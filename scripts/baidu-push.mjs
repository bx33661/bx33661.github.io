#!/usr/bin/env node
/**
 * Baidu URL push script
 *
 * Reads dist/sitemap.xml, compares with .baidu-push-cache.json,
 * and pushes new URLs to Baidu's ordinary inclusion API.
 *
 * Usage:
 *   node scripts/baidu-push.mjs          # incremental push
 *   node scripts/baidu-push.mjs --force  # push all URLs
 *   node scripts/baidu-push.mjs --dry-run # print URLs without pushing
 *
 * Required env:
 *   BAIDU_PUSH_SITE  - e.g. https://www.bx33661.com
 *   BAIDU_PUSH_TOKEN - token from https://ziyuan.baidu.com/linksubmit/index
 */

import "dotenv/config";
import {
  readNotificationState,
  notificationDelta,
  requireBaiduSuccess,
  normalizeBaiduSite,
  baiduPushBudget,
  isBaiduQuotaExhausted,
} from "./seo-notification-state.mjs";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_PATH = path.join(ROOT, "dist");
const CACHE_PATH = path.join(ROOT, ".baidu-push-cache.json");
const BAIDU_API = "http://data.zz.baidu.com/urls";
const BATCH_SIZE = 10; // Baidu allows up to 2000 URLs per request

function log(...args) {
  console.log("[baidu-push]", ...args);
}

function warn(...args) {
  console.warn("[baidu-push]", ...args);
}

function error(...args) {
  console.error("[baidu-push]", ...args);
}

async function readCache() {
  try {
    const content = await fs.readFile(CACHE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    return { pushed: [], lastPushAt: null };
  }
}

async function writeCache(cache) {
  await fs.writeFile(
    CACHE_PATH,
    JSON.stringify(cache, null, 2) + "\n",
    "utf-8",
  );
}

async function pushBatch(urls, site, token) {
  const body = urls.join("\n");
  const apiUrl = `${BAIDU_API}?site=${encodeURIComponent(new URL(site).host)}&token=${encodeURIComponent(token)}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok && isBaiduQuotaExhausted(data)) {
    return { success: 0, remain: 0, quotaExhausted: true };
  }
  if (!response.ok) {
    throw new Error(`Baidu API HTTP ${response.status}: ${text}`);
  }

  return data;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  let site = process.env.BAIDU_PUSH_SITE || "";
  const token = process.env.BAIDU_PUSH_TOKEN || "";

  if (!site || !token) {
    // Secrets are optional in forks/local CI — skip instead of failing the deploy run.
    warn("Missing BAIDU_PUSH_SITE or BAIDU_PUSH_TOKEN environment variables.");
    warn(
      "Skipping Baidu push. Get a token at: https://ziyuan.baidu.com/linksubmit/index",
    );
    process.exit(args.includes("--require-config") ? 1 : 0);
  }

  site = normalizeBaiduSite(site);

  let current;
  let urls;
  try {
    current = await readNotificationState(DIST_PATH, site);
    urls = Object.keys(current);
  } catch (err) {
    error(
      "Failed to read sitemap:",
      String(err.message).split(token).join("[redacted]"),
    );
    process.exit(1);
  }

  if (urls.length === 0) {
    warn("No URLs found in sitemap.");
    process.exit(0);
  }

  log(`Found ${urls.length} URLs in sitemap.`);

  const cache = await readCache();
  const pushedSet = new Set(cache.pushed || []);
  const fingerprints = { ...(cache.fingerprints || {}) };

  let urlsToPush;
  if (force) {
    urlsToPush = urls;
    log("Force mode: pushing all URLs.");
  } else {
    urlsToPush = notificationDelta(current, fingerprints).changed;
    log(`${urlsToPush.length} new or updated URLs since last push.`);
  }

  if (urlsToPush.length === 0) {
    log("No new URLs to push.");
    process.exit(0);
  }

  if (dryRun) {
    log("Dry run mode. URLs that would be pushed:");
    urlsToPush.forEach((url) => log("  -", url));
    process.exit(0);
  }

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = baiduPushBudget(
    limitArg?.split("=")[1] || process.env.BAIDU_PUSH_LIMIT || 10,
  );
  urlsToPush.sort(
    (a, b) =>
      Number(/\/(blog|notes)\/[^/]+\/$/.test(b)) -
      Number(/\/(blog|notes)\/[^/]+\/$/.test(a)),
  );
  const attempted = urlsToPush.slice(0, limit);
  // Push in bounded batches; unsubmitted URLs remain eligible next time.
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < attempted.length; i += BATCH_SIZE) {
    const batch = attempted.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(attempted.length / BATCH_SIZE);

    log(`Pushing batch ${batchNum}/${totalBatches} (${batch.length} URLs)...`);

    try {
      const result = await pushBatch(batch, site, token);
      if (result.quotaExhausted) {
        log("Daily quota exhausted; pending URLs retained for the next run.");
        break;
      }
      requireBaiduSuccess(result, batch.length);
      log(
        `  success: ${result.success ?? "?"}, remain: ${result.remain ?? "?"}`,
      );

      if (result.not_same_site?.length) {
        warn(
          `  not_same_site: ${result.not_same_site.length}`,
          result.not_same_site,
        );
      }
      if (result.not_valid?.length) {
        warn(`  not_valid: ${result.not_valid.length}`, result.not_valid);
      }

      totalSuccess += result.success ?? 0;

      // Only mark URLs as pushed if Baidu reported success for the whole batch
      if ((result.success ?? 0) === batch.length) {
        batch.forEach((url) => {
          pushedSet.add(url);
          fingerprints[url] = current[url];
        });
      } else {
        totalFailed += batch.length - (result.success ?? 0);
      }
    } catch (err) {
      error(
        `  batch ${batchNum} failed:`,
        String(err.message).split(token).join("[redacted]"),
      );
      totalFailed += batch.length;
    }
  }

  await writeCache({
    pushed: Array.from(pushedSet).filter((url) => url in current),
    fingerprints: Object.fromEntries(
      Object.entries(fingerprints).filter(([url]) => url in current),
    ),
    lastPushAt: new Date().toISOString(),
  });

  log(
    `Push complete. success=${totalSuccess}, failed=${totalFailed}, queued=${urlsToPush.length - totalSuccess}`,
  );

  if (totalFailed > 0) {
    process.exit(2);
  }
}

main().catch((err) => {
  error("Unexpected error:", err);
  process.exit(1);
});

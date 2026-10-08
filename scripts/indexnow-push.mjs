#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readNotificationState,
  notificationDelta,
} from "./seo-notification-state.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, ".indexnow-cache.json");
export async function submitIndexNow({ site, key, urls, fetcher = fetch }) {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key))
    throw new Error("Invalid IndexNow verification key");
  const origin = new URL(site).origin;
  if (
    new URL(origin).protocol !== "https:" ||
    urls.some((url) => new URL(url).origin !== origin)
  )
    throw new Error("Invalid IndexNow URL origin");
  const keyLocation = `${origin}/indexnow-key.txt`;
  const proof = await fetcher(keyLocation, {
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  });
  if (!proof.ok || (await proof.text()).trim() !== key)
    throw new Error("Published IndexNow key file did not match");
  for (let i = 0; i < urls.length; i += 10000) {
    const response = await fetcher("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(origin).host,
        key,
        keyLocation,
        urlList: urls.slice(i, i + 10000),
      }),
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    // 202 is pending validation: do not mark the snapshot delivered yet.
    if (response.status !== 200)
      throw new Error(`IndexNow not confirmed: HTTP ${response.status}`);
  }
}

async function main() {
  const site = process.env.INDEXNOW_SITE || "https://www.bx33661.com";
  const key = (
    await fs.readFile(path.join(ROOT, "public/indexnow-key.txt"), "utf8")
  ).trim();
  const current = await readNotificationState(path.join(ROOT, "dist"), site);
  let previous = {};
  try {
    previous = JSON.parse(await fs.readFile(CACHE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const delta = notificationDelta(current, previous);
  const urls = [...delta.changed, ...delta.deleted];
  console.log(
    `[indexnow] changed=${delta.changed.length}, deleted=${delta.deleted.length}`,
  );
  if (process.argv.includes("--dry-run")) {
    console.log("[indexnow] DRY RUN: no network requests or cache writes");
    return;
  }
  if (!urls.length) return;
  await submitIndexNow({ site, key, urls });
  await fs.writeFile(`${CACHE}.tmp`, JSON.stringify(current, null, 2) + "\n");
  await fs.rename(`${CACHE}.tmp`, CACHE);
  console.log(
    `[indexnow] received=${urls.length}; indexing remains a search-engine decision`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((err) => {
    console.error("[indexnow]", err.message);
    process.exitCode = 1;
  });
}

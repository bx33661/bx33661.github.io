import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

export function contentFingerprint(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!main) throw new Error("Missing main content");
  const metadata = [
    ...html.matchAll(
      /<(?:title|meta|link)\b[^>]*(?:description|canonical)[^>]*>|<title>[\s\S]*?<\/title>/gi,
    ),
  ].map((x) => x[0]);
  const text = main
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256")
    .update(metadata.join("\n") + "\n" + text)
    .digest("hex");
}

export async function readNotificationState(dist, site) {
  const origin = new URL(site).origin;
  const xml = await fs.readFile(path.join(dist, "sitemap.xml"), "utf8");
  const result = {};
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(match[1].replace(/&amp;/g, "&"));
    if (url.origin !== origin || url.search || url.hash)
      throw new Error("Noncanonical sitemap URL");
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(dist, `.${pathname}`, "index.html");
    if (!file.startsWith(path.resolve(dist) + path.sep))
      throw new Error("Invalid sitemap path");
    const html = await fs.readFile(file, "utf8");
    if (
      /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(
        html,
      )
    )
      throw new Error("noindex URL in sitemap");
    result[url.href] = contentFingerprint(html);
  }
  if (!Object.keys(result).length) throw new Error("Empty sitemap");
  return result;
}

export function notificationDelta(current, previous = {}) {
  return {
    changed: Object.keys(current).filter(
      (url) => current[url] !== previous[url],
    ),
    deleted: Object.keys(previous).filter((url) => !(url in current)),
  };
}

export function requireBaiduSuccess(result, count) {
  if (
    result.error ||
    result.success !== count ||
    result.not_valid?.length ||
    result.not_same_site?.length
  ) {
    throw new Error(
      `Baidu rejected batch: accepted=${Number(result.success) || 0}/${count}, error=${Number(result.error) || 0}`,
    );
  }
}

export function normalizeBaiduSite(input) {
  const url = new URL(input.includes("://") ? input : `https://${input}`);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid Baidu site resource");
  return url.origin;
}

export function baiduPushBudget(value = 10) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 2000)
    throw new Error("Invalid Baidu push limit");
  return limit;
}
export function isBaiduQuotaExhausted(result) {
  return result.error === 400 && /quota|配额/i.test(result.message || "");
}

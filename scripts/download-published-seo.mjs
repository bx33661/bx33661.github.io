import fs from "node:fs/promises";
import path from "node:path";
import { mapConcurrent } from "./lib/concurrency.mjs";
import { readNotificationState } from "./seo-notification-state.mjs";

// Daily notifications describe published pages, never unpublished local content.
export async function downloadPublishedSeo(origin, dist, request = fetch) {
  const site = new URL(origin);
  if (site.protocol !== "https:" || site.origin !== "https://www.bx33661.com")
    throw new Error("Unexpected published origin");
  const root = path.resolve(dist);
  await fs.mkdir(root, { recursive: true });

  async function get(url) {
    const response = await request(url, {
      signal: AbortSignal.timeout(30000),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`Published fetch failed: ${response.status}`);
    return response.text();
  }

  const xml = await get(`${site.origin}/sitemap.xml`);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, "&")));
  if (!urls.length || urls.length > 2000) throw new Error("Unexpected sitemap size");

  // Validate every path before downloading anything from the sitemap.
  const targets = urls.map((url) => {
    const pathname = decodeURIComponent(url.pathname);
    const target = path.resolve(root, `.${pathname}`, "index.html");
    if (
      url.origin !== site.origin ||
      url.search ||
      url.hash ||
      !pathname.endsWith("/") ||
      !target.startsWith(root + path.sep)
    )
      throw new Error("Noncanonical published URL");
    return { url, target };
  });

  await mapConcurrent(targets, 8, async ({ url, target }) => {
    const html = await get(url.href);
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    if (canonical !== url.href) throw new Error("Published canonical mismatch");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, html);
  });

  await fs.writeFile(path.join(root, "sitemap.xml"), xml);
  await readNotificationState(root, site.origin);
  console.log(`[published-seo] validated=${targets.length}`);
}

if (process.argv[1]?.endsWith("/download-published-seo.mjs")) {
  downloadPublishedSeo("https://www.bx33661.com", process.argv[2] || "dist").catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

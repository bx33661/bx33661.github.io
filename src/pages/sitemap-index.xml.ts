import type { APIContext } from "astro";
import { escapeXml, getSiteBaseUrl, xmlResponse } from "@/utils/sitemap";

export async function GET(context: APIContext) {
  const baseUrl = getSiteBaseUrl(context.site);
  const sitemaps = [`${baseUrl}/sitemap.xml`, `${baseUrl}/image-sitemap.xml`];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (loc) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;

  return xmlResponse(xml);
}

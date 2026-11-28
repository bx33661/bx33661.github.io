import { SITE } from "../config.ts";
import { getArticleDates } from "./article-discovery.ts";

export interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

/** Escape all XML text nodes, including canonical URLs with query parameters. */
export function escapeXml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
}

/** Significant editorial update only; never fabricate dates from build time. */
export function getSitemapLastmod(published: Date, updated?: Date | null): string {
  return getArticleDates(published, updated).latest.toISOString();
}

export function getSiteBaseUrl(site?: URL | string): string {
  const raw = (site ?? SITE.website).toString();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function renderUrlEntry(page: SitemapUrl): string {
  const lines = [`    <loc>${escapeXml(page.url)}</loc>`];
  if (page.lastmod) {
    lines.push(`    <lastmod>${escapeXml(page.lastmod)}</lastmod>`);
  }
  lines.push(`    <changefreq>${page.changefreq}</changefreq>`, `    <priority>${page.priority}</priority>`);
  return `  <url>\n${lines.join("\n")}\n  </url>`;
}

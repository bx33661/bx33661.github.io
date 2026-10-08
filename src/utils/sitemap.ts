import { getArticleDates } from "./article-discovery.ts";

/** Escape all XML text nodes, including canonical URLs with query parameters. */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);
}

/** Significant editorial update only; never fabricate dates from build time. */
export function getSitemapLastmod(published: Date, updated?: Date | null): string {
  return getArticleDates(published, updated).latest.toISOString();
}

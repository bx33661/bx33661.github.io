import type { APIContext } from "astro";
import type { CollectionEntry } from "astro:content";
import { getPublishedGalleries } from "@/data/gallery";
import { localizedPath, type Locale } from "@/i18n";
import { getAllNoteSlugs, getAllPostSlugs } from "@/lib/data-utils";
import { getSiteBaseUrl, getSitemapLastmod, renderUrlEntry, xmlResponse, type SitemapUrl } from "@/utils/sitemap";

function mapPostUrls(
  baseUrl: string,
  posts: Array<{ slug: string; post: CollectionEntry<"blog"> }>,
  locale: Locale,
): SitemapUrl[] {
  return posts.map(({ slug, post }) => ({
    url: `${baseUrl}${localizedPath(`/blog/${encodeURIComponent(slug)}/`, locale)}`,
    lastmod: getSitemapLastmod(post.data.pubDatetime, post.data.modDatetime),
    changefreq: "monthly",
    priority: "0.7",
  }));
}

function mapNoteUrls(
  baseUrl: string,
  notes: Array<{ slug: string; note: CollectionEntry<"notes"> }>,
  locale: Locale,
): SitemapUrl[] {
  return notes.map(({ slug, note }) => ({
    url: `${baseUrl}${localizedPath(`/notes/${encodeURIComponent(slug)}/`, locale)}`,
    lastmod: note.data.date.toISOString(),
    changefreq: "monthly",
    priority: "0.6",
  }));
}

export async function GET(context: APIContext) {
  const [postSlugs, noteSlugs, galleries, englishPosts, englishNotes] = await Promise.all([
    getAllPostSlugs(),
    getAllNoteSlugs(),
    getPublishedGalleries(),
    getAllPostSlugs("en"),
    getAllNoteSlugs("en"),
  ]);
  const baseUrl = getSiteBaseUrl(context.site);

  // /blog/tags/* intentionally omitted — tags are UI filters (noindex), not SEO landing pages.
  const staticPages: SitemapUrl[] = [
    { url: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
    { url: `${baseUrl}/blog/`, changefreq: "daily", priority: "0.9" },
    { url: `${baseUrl}/notes/`, changefreq: "weekly", priority: "0.8" },
    { url: `${baseUrl}/galleries/`, changefreq: "weekly", priority: "0.8" },
    { url: `${baseUrl}/archives/`, changefreq: "weekly", priority: "0.7" },
    { url: `${baseUrl}/friends/`, changefreq: "monthly", priority: "0.6" },
    { url: `${baseUrl}/notes/list/`, changefreq: "weekly", priority: "0.6" },
  ];

  const galleryPages: SitemapUrl[] = galleries.map(({ slug, gallery }) => ({
    url: `${baseUrl}/galleries/${encodeURIComponent(slug)}/`,
    lastmod: getSitemapLastmod(gallery.data.pubDatetime),
    changefreq: "monthly",
    priority: "0.7",
  }));

  // Empty English collection pages are noindex until real content exists.
  const englishPages: SitemapUrl[] = [
    "/en/",
    ...(englishPosts.length ? ["/en/blog/", "/en/archives/"] : []),
    ...(englishNotes.length ? ["/en/notes/", "/en/notes/list/"] : []),
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    changefreq: "weekly",
    priority: "0.6",
  }));

  const allUrls: SitemapUrl[] = [
    ...staticPages,
    ...galleryPages,
    ...mapPostUrls(baseUrl, postSlugs, "zh-CN"),
    ...mapNoteUrls(baseUrl, noteSlugs, "zh-CN"),
    ...englishPages,
    ...mapPostUrls(baseUrl, englishPosts, "en"),
    ...mapNoteUrls(baseUrl, englishNotes, "en"),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls.map(renderUrlEntry).join("\n")}
</urlset>`;

  return xmlResponse(xml);
}

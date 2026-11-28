import type { APIContext } from "astro";
import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config.ts";
import { getPublishedGalleries } from "@/data/gallery";
import { BILINGUAL_ENABLED, DEFAULT_LOCALE, SECONDARY_LOCALE, localizedPath, type Locale } from "@/i18n";
import { getAllNoteSlugs, getAllPostSlugs } from "@/lib/data-utils";
import { getSiteBaseUrl, getSitemapLastmod, renderUrlEntry, xmlResponse, type SitemapUrl } from "@/utils/sitemap";
import { withBase } from "@/utils/url";

function mapPostUrls(
  origin: string,
  posts: Array<{ slug: string; post: CollectionEntry<"blog"> }>,
  locale: Locale,
): SitemapUrl[] {
  return posts.map(({ slug, post }) => ({
    url: `${origin}${localizedPath(`/blog/${encodeURIComponent(slug)}/`, locale)}`,
    lastmod: getSitemapLastmod(post.data.pubDatetime, post.data.modDatetime),
    changefreq: "monthly",
    priority: "0.7",
  }));
}

function mapNoteUrls(
  origin: string,
  notes: Array<{ slug: string; note: CollectionEntry<"notes"> }>,
  locale: Locale,
): SitemapUrl[] {
  return notes.map(({ slug, note }) => ({
    url: `${origin}${localizedPath(`/notes/${encodeURIComponent(slug)}/`, locale)}`,
    lastmod: note.data.date.toISOString(),
    changefreq: "monthly",
    priority: "0.6",
  }));
}

export async function GET(context: APIContext) {
  const [postSlugs, noteSlugs, galleries, secondaryPosts, secondaryNotes] = await Promise.all([
    getAllPostSlugs(DEFAULT_LOCALE),
    SITE.features.notes ? getAllNoteSlugs(DEFAULT_LOCALE) : Promise.resolve([]),
    SITE.features.galleries ? getPublishedGalleries() : Promise.resolve([]),
    BILINGUAL_ENABLED ? getAllPostSlugs(SECONDARY_LOCALE) : Promise.resolve([]),
    BILINGUAL_ENABLED && SITE.features.notes ? getAllNoteSlugs(SECONDARY_LOCALE) : Promise.resolve([]),
  ]);
  const origin = new URL(getSiteBaseUrl(context.site)).origin;

  const staticPages: SitemapUrl[] = [
    { url: `${origin}${withBase("/")}`, changefreq: "daily", priority: "1.0" },
    { url: `${origin}${withBase("/blog/")}`, changefreq: "daily", priority: "0.9" },
    ...(SITE.features.notes
      ? [
          { url: `${origin}${withBase("/notes/")}`, changefreq: "weekly", priority: "0.8" },
          { url: `${origin}${withBase("/notes/list/")}`, changefreq: "weekly", priority: "0.6" },
        ]
      : []),
    ...(SITE.features.galleries
      ? [{ url: `${origin}${withBase("/galleries/")}`, changefreq: "weekly", priority: "0.8" }]
      : []),
    ...(SITE.features.archives
      ? [{ url: `${origin}${withBase("/archives/")}`, changefreq: "weekly", priority: "0.7" }]
      : []),
    ...(SITE.features.projects
      ? [{ url: `${origin}${withBase("/projects/")}`, changefreq: "monthly", priority: "0.7" }]
      : []),
    ...(SITE.features.friends
      ? [{ url: `${origin}${withBase("/friends/")}`, changefreq: "monthly", priority: "0.6" }]
      : []),
  ];

  const galleryPages: SitemapUrl[] = galleries.map(({ slug, gallery }) => ({
    url: `${origin}${withBase(`/galleries/${encodeURIComponent(slug)}/`)}`,
    lastmod: getSitemapLastmod(gallery.data.pubDatetime),
    changefreq: "monthly",
    priority: "0.7",
  }));

  const secondaryPages: SitemapUrl[] = BILINGUAL_ENABLED
    ? [
        localizedPath("/", SECONDARY_LOCALE),
        ...(secondaryPosts.length
          ? [
              localizedPath("/blog/", SECONDARY_LOCALE),
              ...(SITE.features.archives ? [localizedPath("/archives/", SECONDARY_LOCALE)] : []),
            ]
          : []),
        ...(secondaryNotes.length && SITE.features.notes
          ? [localizedPath("/notes/", SECONDARY_LOCALE), localizedPath("/notes/list/", SECONDARY_LOCALE)]
          : []),
      ].map((path) => ({
        url: `${origin}${path}`,
        changefreq: "weekly",
        priority: "0.6",
      }))
    : [];

  const allUrls: SitemapUrl[] = [
    ...staticPages,
    ...galleryPages,
    ...mapPostUrls(origin, postSlugs, DEFAULT_LOCALE),
    ...mapNoteUrls(origin, noteSlugs, DEFAULT_LOCALE),
    ...secondaryPages,
    ...mapPostUrls(origin, secondaryPosts, SECONDARY_LOCALE),
    ...mapNoteUrls(origin, secondaryNotes, SECONDARY_LOCALE),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls.map(renderUrlEntry).join("\n")}
</urlset>`;

  return xmlResponse(xml);
}

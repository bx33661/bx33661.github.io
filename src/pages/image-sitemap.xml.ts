import type { APIContext } from "astro";
import { SITE } from "@/config.ts";
import { GALLERY_IMAGES, buildGalleryImageSources } from "@/data/gallery";
import { DEFAULT_LOCALE, localizedPath } from "@/i18n";
import { getAllNoteSlugs, getAllPostSlugs } from "@/lib/data-utils";
import { resolvePostOgImagePath } from "@/utils/generateOgImages";
import { escapeXml, getSiteBaseUrl, xmlResponse } from "@/utils/sitemap";
import { withBase } from "@/utils/url";

interface SitemapImageEntry {
  loc: string;
  image: Array<{ loc: string; title: string; caption: string }>;
}

export async function GET(context: APIContext) {
  const [postSlugs, notes] = await Promise.all([
    getAllPostSlugs(DEFAULT_LOCALE),
    SITE.features.notes ? getAllNoteSlugs(DEFAULT_LOCALE) : Promise.resolve([]),
  ]);
  const origin = new URL(getSiteBaseUrl(context.site)).origin;
  const images: SitemapImageEntry[] = [];

  for (const { slug, post } of postSlugs) {
    const encodedSlug = encodeURIComponent(slug);
    const ogPath = resolvePostOgImagePath(post, slug, DEFAULT_LOCALE) ?? withBase(`/${SITE.ogImage}`);
    const ogLoc = ogPath.startsWith("http") ? ogPath : `${origin}${withBase(ogPath)}`;
    images.push({
      loc: `${origin}${localizedPath(`/blog/${encodedSlug}/`, DEFAULT_LOCALE)}`,
      image: [
        {
          loc: ogLoc,
          title: post.data.title,
          caption: post.data.description || post.data.title,
        },
      ],
    });
  }

  if (SITE.features.galleries && GALLERY_IMAGES.length > 0) {
    images.push({
      loc: `${origin}${withBase("/galleries/")}`,
      image: GALLERY_IMAGES.map((item) => ({
        loc: `${origin}${buildGalleryImageSources(item).originalSrc}`,
        title: item.title,
        caption: item.alt,
      })),
    });
  }

  for (const { slug, note } of notes) {
    images.push({
      loc: `${origin}${localizedPath(`/notes/${encodeURIComponent(slug)}/`, DEFAULT_LOCALE)}`,
      image: [
        {
          loc: `${origin}${withBase(`/${SITE.ogImage}`)}`,
          title: note.data.title,
          caption: note.data.description || note.data.title,
        },
      ],
    });
  }

  images.push({
    loc: `${origin}${withBase("/")}`,
    image: [
      {
        loc: `${origin}${withBase(`/${SITE.ogImage}`)}`,
        title: `${SITE.title} - Site Image`,
        caption: SITE.desc,
      },
      {
        loc: `${origin}${withBase(SITE.friendCard.avatar)}`,
        title: `${SITE.title} Logo`,
        caption: `${SITE.title} emblem`,
      },
    ],
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
${page.image
  .map(
    (img) => `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
      <image:caption>${escapeXml(img.caption)}</image:caption>
    </image:image>`,
  )
  .join("\n")}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return xmlResponse(xml);
}

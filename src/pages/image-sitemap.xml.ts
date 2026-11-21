import type { APIContext } from "astro";
import { SITE } from "@/config.ts";
import { GALLERY_IMAGES, buildGalleryImageSources } from "@/data/gallery";
import { getAllNoteSlugs, getAllPostSlugs } from "@/lib/data-utils";
import { resolvePostOgImagePath } from "@/utils/generateOgImages";
import { escapeXml, getSiteBaseUrl, xmlResponse } from "@/utils/sitemap";

interface SitemapImageEntry {
  loc: string;
  image: Array<{ loc: string; title: string; caption: string }>;
}

export async function GET(context: APIContext) {
  const [postSlugs, notes] = await Promise.all([getAllPostSlugs(), getAllNoteSlugs()]);
  const baseUrl = getSiteBaseUrl(context.site);
  const images: SitemapImageEntry[] = [];

  for (const { slug, post } of postSlugs) {
    const encodedSlug = encodeURIComponent(slug);
    const ogPath = resolvePostOgImagePath(post, slug, "zh-CN") ?? `/${SITE.ogImage}`;
    const ogLoc = new URL(ogPath, `${baseUrl}/`).href;
    images.push({
      loc: `${baseUrl}/blog/${encodedSlug}/`,
      image: [
        {
          loc: ogLoc,
          title: post.data.title,
          caption: post.data.description || post.data.title,
        },
      ],
    });
  }

  images.push({
    loc: `${baseUrl}/galleries/`,
    image: GALLERY_IMAGES.map((item) => ({
      loc: `${baseUrl}${buildGalleryImageSources(item).originalSrc}`,
      title: item.title,
      caption: item.alt,
    })),
  });

  for (const { slug, note } of notes) {
    images.push({
      loc: `${baseUrl}/notes/${encodeURIComponent(slug)}/`,
      image: [
        {
          loc: `${baseUrl}/${SITE.ogImage}`,
          title: note.data.title,
          caption: note.data.description || note.data.title,
        },
      ],
    });
  }

  images.push({
    loc: `${baseUrl}/`,
    image: [
      {
        loc: `${baseUrl}/brand/bx-logo-512.png`,
        title: `${SITE.title} - Site Image`,
        caption: SITE.desc,
      },
      {
        loc: `${baseUrl}/brand/bx-logo-192.png`,
        title: `${SITE.title} Logo`,
        caption: `${SITE.title}网站标志`,
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

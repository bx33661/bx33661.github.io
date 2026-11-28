import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/config.ts";
import { DEFAULT_LOCALE, defaultDescriptionForLocale, localizedPath, type Locale } from "@/i18n";
import { getAllPostSlugs } from "@/lib/data-utils";
import { getArticleDates } from "@/utils/article-discovery";

export async function buildRssResponse(locale: Locale, context: APIContext) {
  const posts = await getAllPostSlugs(locale);
  const isDefault = locale === DEFAULT_LOCALE;
  const editionSuffix = locale === "en" ? "English" : "中文";

  return rss({
    title: isDefault ? SITE.title : `${SITE.title} — ${editionSuffix}`,
    description: defaultDescriptionForLocale(locale),
    site: context.site ?? SITE.website,
    customData: `<language>${locale}</language>`,
    items: posts.map(({ slug, post }) => ({
      link: localizedPath(`/blog/${encodeURIComponent(slug)}/`, locale),
      title: post.data.title,
      description: post.data.description,
      pubDate: getArticleDates(post.data.pubDatetime, post.data.modDatetime).latest,
    })),
  });
}

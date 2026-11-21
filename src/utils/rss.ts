import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/config.ts";
import { englishDescription, localizedPath, type Locale } from "@/i18n";
import { getAllPostSlugs } from "@/lib/data-utils";
import { getArticleDates } from "@/utils/article-discovery";

export async function buildRssResponse(locale: Locale, context: APIContext) {
  const posts = await getAllPostSlugs(locale);
  const isEnglish = locale === "en";

  return rss({
    title: isEnglish ? `${SITE.title} — English` : SITE.title,
    description: isEnglish ? englishDescription : SITE.desc,
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

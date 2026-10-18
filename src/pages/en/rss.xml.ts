import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/config.ts";
import { getAllPostSlugs } from "@/lib/data-utils";
import { englishDescription } from "@/i18n";

export async function GET(context: APIContext) {
  const posts = await getAllPostSlugs("en");
  return rss({
    title: `${SITE.title} — English`,
    description: englishDescription,
    site: context.site ?? SITE.website,
    customData: "<language>en</language>",
    items: posts.map(({ slug, post }) => ({
      link: `/en/blog/${encodeURIComponent(slug)}/`,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDatetime,
    })),
  });
}

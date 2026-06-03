import rss from "@astrojs/rss";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { resolveLegacyPostSlug } from "@/utils/legacySlug";
import { SITE } from "@/config.ts";
import { getAllPosts } from "@/lib/data-utils";

export async function GET() {
  const posts = await getAllPosts();
  const sortedPosts = getSortedPosts(posts);
  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: sortedPosts.map((post) => ({
      link: getPath(
        post.id,
        post.filePath,
        true,
        post.data.slug || resolveLegacyPostSlug(post)
      ),
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.modDatetime ?? post.data.pubDatetime),
    })),
  });
}

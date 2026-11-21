import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config.ts";
import { getAllPostSlugs } from "@/lib/data-utils";
import { generateOgImageForPost, pngResponse } from "@/utils/generateOgImages";

interface Props {
  post: CollectionEntry<"blog">;
}

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getAllPostSlugs("zh-CN");
  return posts
    .filter(({ post }) => !post.data.ogImage && !post.data.cover)
    .map(({ slug, post }) => ({
      params: { slug },
      props: { post },
    }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as Props;
  return pngResponse(await generateOgImageForPost(post));
};

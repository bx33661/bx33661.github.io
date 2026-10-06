import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";
import { getArticleDates } from "./article-discovery";

const getSortedPosts = (posts: CollectionEntry<"blog">[]) => {
  return posts
    .filter(postFilter)
    .sort(
      (a, b) =>
        Math.floor(
          getArticleDates(
            b.data.pubDatetime,
            b.data.modDatetime,
          ).latest.getTime() / 1000,
        ) -
        Math.floor(
          getArticleDates(
            a.data.pubDatetime,
            a.data.modDatetime,
          ).latest.getTime() / 1000,
        ),
    );
};

export default getSortedPosts;

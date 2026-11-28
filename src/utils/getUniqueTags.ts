import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";
import postFilter from "./postFilter";

export interface TagEntry {
  tag: string;
  tagName: string;
}

export interface TagGroup extends TagEntry {
  posts: CollectionEntry<"blog">[];
}

export function groupPostsByTag(posts: CollectionEntry<"blog">[]): TagGroup[] {
  const groups = new Map<string, TagGroup>();

  for (const post of posts) {
    if (!postFilter(post)) continue;
    const seenInPost = new Set<string>();
    for (const rawTag of post.data.tags) {
      const tag = slugifyStr(rawTag);
      if (seenInPost.has(tag)) continue;
      seenInPost.add(tag);

      let group = groups.get(tag);
      if (!group) {
        group = { tag, tagName: rawTag, posts: [] };
        groups.set(tag, group);
      }
      group.posts.push(post);
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.tag.localeCompare(b.tag));
}

const getUniqueTags = (posts: CollectionEntry<"blog">[]): TagEntry[] =>
  groupPostsByTag(posts).map(({ tag, tagName }) => ({ tag, tagName }));

export default getUniqueTags;

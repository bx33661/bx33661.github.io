import type { CollectionEntry } from "astro:content";

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function createDeterministicSlug(
  source: string,
  prefix: "post" | "note"
): string {
  const normalized = source
    .replace(/\.(md|mdx)$/i, "")
    .replace(/[\\/]/g, "-")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `${prefix}-${stableHash(source)}`;
}

export function resolveLegacyPostSlug(post: CollectionEntry<"blog">): string {
  return post.data.slug || createDeterministicSlug(post.id, "post");
}

export function resolveLegacyNoteSlug(note: CollectionEntry<"notes">): string {
  return note.data.slug || createDeterministicSlug(note.id, "note");
}

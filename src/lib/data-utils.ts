import { getCollection, type CollectionEntry } from "astro:content";
import { withCache } from "./cache-utils";
import { getArticleDates } from "@/utils/article-discovery";
import postFilter from "@/utils/postFilter";
import { DEFAULT_LOCALE, isEntryLocale, type Locale } from "@/i18n";
import { resolveLegacyPostSlug, resolveLegacyNoteSlug } from "@/utils/legacySlug";

function ensureUniqueSlug<T extends { id: string }>(desiredSlug: string, entry: T, slugMap: Map<string, T>): string {
  if (!slugMap.has(desiredSlug)) {
    return desiredSlug;
  }

  let suffix = 2;
  let candidate = `${desiredSlug}-${suffix}`;
  while (slugMap.has(candidate) && slugMap.get(candidate)?.id !== entry.id) {
    suffix++;
    candidate = `${desiredSlug}-${suffix}`;
  }
  return candidate;
}

function buildUniqueSlugEntries<T extends { id: string }>(
  entries: T[],
  getDesiredSlug: (entry: T) => string,
  mapKey: "post" | "note",
): Array<{ slug: string } & Record<typeof mapKey, T>> {
  const slugMap = new Map<string, T>();
  const result: Array<{ slug: string } & Record<typeof mapKey, T>> = [];

  for (const entry of entries) {
    const uniqueSlug = ensureUniqueSlug(getDesiredSlug(entry), entry, slugMap);
    slugMap.set(uniqueSlug, entry);
    result.push({ slug: uniqueSlug, [mapKey]: entry } as { slug: string } & Record<typeof mapKey, T>);
  }

  return result;
}

export async function getAllPosts(locale: Locale = DEFAULT_LOCALE): Promise<CollectionEntry<"blog">[]> {
  return withCache(
    `all-public-posts:${locale}`,
    async () => {
      const posts = await getCollection("blog");
      return posts
        .filter(postFilter)
        .filter((post) => isEntryLocale(post.data, locale))
        .sort((a, b) => {
          const bLatest = Math.floor(getArticleDates(b.data.pubDatetime, b.data.modDatetime).latest.getTime() / 1000);
          const aLatest = Math.floor(getArticleDates(a.data.pubDatetime, a.data.modDatetime).latest.getTime() / 1000);
          return bLatest - aLatest || resolveLegacyPostSlug(a).localeCompare(resolveLegacyPostSlug(b));
        });
    },
    import.meta.env.DEV ? 0 : undefined,
  );
}

export async function getAllPostSlugs(
  locale: Locale = DEFAULT_LOCALE,
): Promise<Array<{ slug: string; post: CollectionEntry<"blog"> }>> {
  return withCache(
    `all-post-slugs:${locale}`,
    async () => buildUniqueSlugEntries(await getAllPosts(locale), resolveLegacyPostSlug, "post"),
    import.meta.env.DEV ? 0 : undefined,
  );
}

export async function getAllNotes(locale: Locale = DEFAULT_LOCALE): Promise<CollectionEntry<"notes">[]> {
  return withCache(
    `all-notes:${locale}`,
    async () => {
      const notes = await getCollection("notes");
      return notes
        .filter((note) => !note.data.draft)
        .filter((note) => isEntryLocale(note.data, locale))
        .sort((a, b) => {
          const diff = b.data.date.valueOf() - a.data.date.valueOf();
          return diff !== 0 ? diff : resolveLegacyNoteSlug(a).localeCompare(resolveLegacyNoteSlug(b));
        });
    },
    import.meta.env.DEV ? 0 : undefined,
  );
}

export async function getAllNoteSlugs(
  locale: Locale = DEFAULT_LOCALE,
): Promise<Array<{ slug: string; note: CollectionEntry<"notes"> }>> {
  return withCache(
    `all-note-slugs:${locale}`,
    async () => buildUniqueSlugEntries(await getAllNotes(locale), resolveLegacyNoteSlug, "note"),
    import.meta.env.DEV ? 0 : undefined,
  );
}

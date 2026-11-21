import { getAllPostSlugs, getAllNoteSlugs, getAllPosts, getAllNotes } from "@/lib/data-utils";
import { withCache } from "@/lib/cache-utils";
import { LOCALES, entryAlternates, localizedPath, sectionAlternates, type LanguagePaths } from "./index";

function safeDecodeURI(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

export async function languagePaths(pathname: string): Promise<LanguagePaths> {
  const sections = sectionAlternates(pathname);
  if (Object.keys(sections).length) return sections;

  const normalizedPath = `${pathname.replace(/\/+$/, "")}/`;
  const section = /^\/(?:en\/)?(blog|notes)\/[^/]+\/$/.exec(normalizedPath)?.[1];
  if (!section) return {};

  return withCache(
    `language-paths:${normalizedPath}`,
    async () => {
      const entries = (
        await Promise.all(
          LOCALES.map(async (locale) => {
            const items =
              section === "blog"
                ? (await getAllPostSlugs(locale)).map(({ post, slug }) => ({ data: post.data, slug }))
                : (await getAllNoteSlugs(locale)).map(({ note, slug }) => ({ data: note.data, slug }));
            return items.map(({ data, slug }) => ({
              ...data,
              path: localizedPath(`/${section}/${encodeURIComponent(slug)}/`, locale),
            }));
          }),
        )
      ).flat();

      const decodedPath = safeDecodeURI(normalizedPath);
      const current = entries.find((entry) => safeDecodeURI(entry.path) === decodedPath);
      return current ? entryAlternates(current, entries) : {};
    },
    import.meta.env.DEV ? 0 : undefined,
  );
}

export async function hasEnglishContent(): Promise<boolean> {
  const [posts, notes] = await Promise.all([getAllPosts("en"), getAllNotes("en")]);
  return posts.length + notes.length > 0;
}

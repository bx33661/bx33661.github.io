import { getAllPostSlugs, getAllNoteSlugs, getAllPosts, getAllNotes } from "@/lib/data-utils";
import { withCache } from "@/lib/cache-utils";
import {
  BILINGUAL_ENABLED,
  LOCALES,
  entryAlternates,
  localizedPath,
  sectionAlternates,
  stripLocalePrefix,
  type LanguagePaths,
  type Locale,
} from "./index";

function safeDecodeURI(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

export async function languagePaths(pathname: string): Promise<LanguagePaths> {
  if (!BILINGUAL_ENABLED) return {};

  const sections = sectionAlternates(pathname);
  if (Object.keys(sections).length) return sections;

  const logicalPath = `${stripLocalePrefix(pathname).replace(/\/+$/, "")}/`;
  const section = /^\/(blog|notes)\/[^/]+\/$/.exec(logicalPath)?.[1];
  if (!section) return {};

  return withCache(
    `language-paths:${pathname}`,
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

      const decodedTarget = safeDecodeURI(`${pathname.replace(/\/+$/, "")}/`);
      const current = entries.find((entry) => safeDecodeURI(entry.path) === decodedTarget);
      return current ? entryAlternates(current, entries) : {};
    },
    import.meta.env.DEV ? 0 : undefined,
  );
}

export async function hasLocaleContent(locale: Locale): Promise<boolean> {
  const [posts, notes] = await Promise.all([getAllPosts(locale), getAllNotes(locale)]);
  return posts.length + notes.length > 0;
}

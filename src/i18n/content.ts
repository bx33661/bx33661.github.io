import { getAllPostSlugs, getAllNoteSlugs } from "@/lib/data-utils";
import { entryAlternates, localizedPath, sectionAlternates, type Locale } from "./index";

export async function languagePaths(pathname: string) {
  const sections = sectionAlternates(pathname);
  if (Object.keys(sections).length) return sections;
  const section = /^\/(?:en\/)?(blog|notes)\/[^/]+\/$/.exec(`${pathname.replace(/\/+$/, "")}/`)?.[1];
  if (!section) return {};
  const entries = (await Promise.all((["zh-CN", "en"] as Locale[]).map(async (locale) => {
    const items = section === "blog"
      ? (await getAllPostSlugs(locale)).map(({ post, slug }) => ({ data: post.data, slug }))
      : (await getAllNoteSlugs(locale)).map(({ note, slug }) => ({ data: note.data, slug }));
    return items.map(({ data, slug }) => ({
      ...data,
      path: localizedPath(`/${section}/${encodeURIComponent(slug)}/`, locale),
    }));
  }))).flat();
  const path = `${pathname.replace(/\/+$/, "")}/`;
  const current = entries.find((entry) => decodeURI(entry.path) === decodeURI(path));
  return current ? entryAlternates(current, entries) : {};
}

export async function hasEnglishContent() {
  const [posts, notes] = await Promise.all([getAllPostSlugs("en"), getAllNoteSlugs("en")]);
  return posts.length + notes.length > 0;
}

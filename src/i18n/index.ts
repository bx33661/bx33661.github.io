/** Chinese URLs are the default edition; only English routes receive a prefix. */
export type Locale = "zh-CN" | "en";
export type LanguagePaths = Partial<Record<Locale, string>>;

export const englishDescription =
  "A personal blog about Cybersecurity, Large Language Models (LLMs), and learning.";

export function localeFromPath(pathname: string): Locale {
  return /^\/en(?:\/|$)/.test(pathname) ? "en" : "zh-CN";
}

export function localizedPath(path: string, locale: Locale): string {
  const normalized = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  return locale === "en" ? `/en${normalized}` : normalized;
}

export function isEntryLocale(data: { lang?: string }, locale: Locale): boolean {
  return (data.lang ?? "zh-CN") === locale;
}

/** Only these section pages have real counterparts, not arbitrary /en mirrors. */
export function sectionAlternates(pathname: string): LanguagePaths {
  const path = pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
  if (["/", "/about/", "/en/", "/en/about/"].includes(path))
    return { "zh-CN": "/", en: "/en/" };
  for (const section of ["blog", "notes", "archives", "search"]) {
    if (path === `/${section}/` || path === `/en/${section}/`)
      return { "zh-CN": `/${section}/`, en: `/en/${section}/` };
  }
  return {};
}

export function switchDestination(pathname: string, paths: LanguagePaths): string {
  const target = localeFromPath(pathname) === "en" ? "zh-CN" : "en";
  if (paths[target]) return paths[target];
  if (/^\/(?:en\/)?blog(?:\/|$)/.test(pathname)) return localizedPath("/blog/", target);
  if (/^\/(?:en\/)?notes(?:\/|$)/.test(pathname)) return localizedPath("/notes/", target);
  return localizedPath("/", target);
}

/** A translation pair is explicit and unique, never guessed from matching slugs. */
export function entryAlternates(
  current: { lang?: string; translationKey?: string; path: string },
  entries: { lang?: string; translationKey?: string; path: string }[],
): LanguagePaths {
  const locale = current.lang === "en" ? "en" : "zh-CN";
  const paths: LanguagePaths = { [locale]: current.path };
  if (!current.translationKey) return paths;
  const other = locale === "en" ? "zh-CN" : "en";
  const matches = entries.filter((entry) =>
    entry.translationKey === current.translationKey && isEntryLocale(entry, other),
  );
  if (matches.length === 1) paths[other] = matches[0].path;
  return paths;
}

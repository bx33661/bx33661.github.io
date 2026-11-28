import { SITE, type SiteLocale } from "../config.ts";
import { stripBase, withBase } from "../utils/url.ts";

export type Locale = SiteLocale;
export const LOCALES = ["en", "zh-CN"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = SITE.i18n.defaultLocale;
export const SECONDARY_LOCALE: Locale = DEFAULT_LOCALE === "en" ? "zh-CN" : "en";
export const SECONDARY_PREFIX = SECONDARY_LOCALE === "en" ? "en" : "zh";
export const BILINGUAL_ENABLED = SITE.i18n.bilingual;

export type LanguagePaths = Partial<Record<Locale, string>>;

export function defaultDescriptionForLocale(locale: Locale): string {
  return locale === "zh-CN" ? SITE.descZh : SITE.desc;
}

const SECONDARY_ROUTE_RE = new RegExp(`^/${SECONDARY_PREFIX}(?:/|$)`);
const STRIP_SECONDARY_RE = new RegExp(`^/${SECONDARY_PREFIX}(?=/|$)`);

export function localeFromPath(pathname: string): Locale {
  if (!BILINGUAL_ENABLED) return DEFAULT_LOCALE;
  const clean = stripBase(pathname);
  return SECONDARY_ROUTE_RE.test(clean) ? SECONDARY_LOCALE : DEFAULT_LOCALE;
}

export function stripLocalePrefix(pathname: string): string {
  const clean = stripBase(pathname);
  const normalized = clean.endsWith("/") && clean !== "/" ? clean.slice(0, -1) : clean;
  if (!BILINGUAL_ENABLED) return normalized || "/";
  return normalized.replace(STRIP_SECONDARY_RE, "") || "/";
}

export function localizedPath(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const normalized = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}/`;
  if (BILINGUAL_ENABLED && locale === SECONDARY_LOCALE) {
    return withBase(normalized === "/" ? `/${SECONDARY_PREFIX}/` : `/${SECONDARY_PREFIX}${normalized}`);
  }
  return withBase(normalized);
}

export function isEntryLocale(data: { lang?: string }, locale: Locale): boolean {
  return (data.lang ?? DEFAULT_LOCALE) === locale;
}

/** Only active bilingual section pages receive alternate links. */
export function sectionAlternates(pathname: string): LanguagePaths {
  if (!BILINGUAL_ENABLED) return {};

  const stripped = stripLocalePrefix(pathname);
  const sectionPath = stripped === "/" ? "/" : `${stripped}/`;

  if (sectionPath === "/") {
    return {
      [DEFAULT_LOCALE]: localizedPath("/", DEFAULT_LOCALE),
      [SECONDARY_LOCALE]: localizedPath("/", SECONDARY_LOCALE),
    };
  }

  const enabledSections = [
    "blog",
    ...(SITE.features.notes ? ["notes"] : []),
    ...(SITE.features.archives ? ["archives"] : []),
    ...(SITE.features.search ? ["search"] : []),
  ];

  for (const section of enabledSections) {
    if (sectionPath === `/${section}/`) {
      return {
        [DEFAULT_LOCALE]: localizedPath(`/${section}/`, DEFAULT_LOCALE),
        [SECONDARY_LOCALE]: localizedPath(`/${section}/`, SECONDARY_LOCALE),
      };
    }
  }

  return {};
}

export function switchDestination(pathname: string, paths: LanguagePaths): string {
  const current = localeFromPath(pathname);
  const target = current === DEFAULT_LOCALE ? SECONDARY_LOCALE : DEFAULT_LOCALE;
  if (paths[target]) return paths[target];

  const section = stripLocalePrefix(pathname);
  if (section === "/blog" || section.startsWith("/blog/")) return localizedPath("/blog/", target);
  if ((section === "/notes" || section.startsWith("/notes/")) && SITE.features.notes) {
    return localizedPath("/notes/", target);
  }
  return localizedPath("/", target);
}

/** A translation pair is explicit and unique, never guessed from matching slugs. */
export function entryAlternates(
  current: { lang?: string; translationKey?: string; path: string },
  entries: { lang?: string; translationKey?: string; path: string }[],
): LanguagePaths {
  const locale: Locale = current.lang === "zh-CN" || current.lang === "en" ? current.lang : DEFAULT_LOCALE;
  const paths: LanguagePaths = { [locale]: current.path };
  if (!BILINGUAL_ENABLED || !current.translationKey) return paths;

  const other: Locale = locale === "en" ? "zh-CN" : "en";
  const matches = entries.filter(
    (entry) => entry.translationKey === current.translationKey && isEntryLocale(entry, other),
  );
  if (matches.length === 1) paths[other] = matches[0].path;
  return paths;
}

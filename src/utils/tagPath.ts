import { DEFAULT_LOCALE, localizedPath, type Locale } from "@/i18n";
import { slugifyStr } from "./slugify";
import { withBase } from "./url";

export function getTagPath(tag: string): string {
  return withBase(`/blog/tags/${encodeURIComponent(slugifyStr(tag))}/`);
}

export function getLocalizedTagPath(tag: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE
    ? getTagPath(tag)
    : `${localizedPath("/search/", locale)}?q=${encodeURIComponent(tag)}`;
}

const HIDDEN_TAG_LABELS = new Set(["others", "其他"]);

export function getVisiblePostTags(tags: string[], limit = 3): string[] {
  return tags.filter((tag) => !HIDDEN_TAG_LABELS.has(tag.toLowerCase())).slice(0, limit);
}

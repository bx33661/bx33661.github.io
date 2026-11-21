import type { Locale } from "@/i18n";
import { slugifyStr } from "./slugify";

export function getTagPath(tag: string): string {
  return `/blog/tags/${encodeURIComponent(slugifyStr(tag))}/`;
}

export function getLocalizedTagPath(tag: string, locale: Locale): string {
  return locale === "en" ? `/en/search/?q=${encodeURIComponent(tag)}` : getTagPath(tag);
}

const HIDDEN_TAG_LABELS = new Set(["bx", "others", "其他"]);

export function getVisiblePostTags(tags: string[], limit = 3): string[] {
  return tags.filter((tag) => !HIDDEN_TAG_LABELS.has(tag.toLowerCase())).slice(0, limit);
}

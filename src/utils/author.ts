import { SITE } from "@/config.ts";

const DEFAULT_AUTHOR_ALIASES = new Set(["bx", "bx33661"]);

/** Normalize default author aliases to `SITE.author` while preserving distinct contributors. */
export function resolveAuthor(authors?: readonly string[], fallback = SITE.author): string {
  const normalized = (authors ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => (DEFAULT_AUTHOR_ALIASES.has(name.toLowerCase()) ? fallback : name));

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique.join(", ") : fallback;
}

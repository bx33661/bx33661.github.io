import { SITE } from "@/config.ts";

const DEFAULT_AUTHOR_ALIASES = new Set(SITE.authorAliases.map((alias) => alias.toLowerCase()));

/** Normalize configured author aliases to `SITE.author` while preserving distinct contributors. */
export function resolveAuthor(authors?: readonly string[], fallback = SITE.author): string {
  const normalized = (authors ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => (DEFAULT_AUTHOR_ALIASES.has(name.toLowerCase()) ? fallback : name));

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique.join(", ") : fallback;
}

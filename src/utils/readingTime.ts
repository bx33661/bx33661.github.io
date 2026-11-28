const INTERACTIVE_ISLAND_RE = /\bclient:(?:load|idle|visible|media|only)\b/;

const CJK_CHAR_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/g;
const LATIN_WORD_RE = /[A-Za-z0-9_]+/g;

/**
 * Estimate reading time in minutes from raw Markdown/MDX source.
 * Strips frontmatter, MDX import/export lines, and markup punctuation so code
 * and prose both contribute naturally while remaining deterministic in Node.
 */
export function estimateReadingMinutes(body: string | undefined): number {
  if (!body) return 1;

  const stripped = body
    .replace(/^---[\s\S]*?\r?\n---\r?\n?/, "")
    .replace(/^\s*(?:import|export)\s+.*$/gm, "")
    .replace(/^```.*$/gm, "")
    .replace(/<[^>]+>/g, " ");

  const cjkCount = stripped.match(CJK_CHAR_RE)?.length ?? 0;
  const latinCount = stripped.replace(CJK_CHAR_RE, " ").match(LATIN_WORD_RE)?.length ?? 0;

  return Math.max(1, Math.round(cjkCount / 320 + latinCount / 220));
}

/** True when a post embeds hydrated interactive MDX components. */
export function isInteractivePost(body: string | undefined): boolean {
  if (!body) return false;
  return INTERACTIVE_ISLAND_RE.test(body);
}

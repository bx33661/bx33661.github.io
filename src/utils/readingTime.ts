const INTERACTIVE_ISLAND_RE = /\bclient:(?:load|idle|visible|media|only)\b/;

const CJK_CHAR_RE = /[\u3400-\u4dbf\u4e00-\u9fff]/g;
const LATIN_WORD_RE = /[A-Za-z0-9_]+/g;

function stripReadableSource(body: string): string {
  return body
    .replace(/^---[\s\S]*?\r?\n---\r?\n?/, "")
    .replace(/^\s*(?:import|export)\s+.*$/gm, "")
    .replace(/^```.*$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
    .replace(/<[^>]+>/g, " ");
}

/**
 * Count readable units (CJK characters + Latin/numeric tokens) from raw Markdown/MDX.
 */
export function countReadingWords(body: string | undefined): number {
  if (!body) return 0;
  const stripped = stripReadableSource(body);
  const cjkCount = stripped.match(CJK_CHAR_RE)?.length ?? 0;
  const latinCount = stripped.replace(CJK_CHAR_RE, " ").match(LATIN_WORD_RE)?.length ?? 0;
  return cjkCount + latinCount;
}

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

/**
 * Prepare clean Markdown text for reader "Copy as Markdown" actions,
 * stripping MDX framework imports while preserving prose, headings, lists, and code blocks.
 */
export function cleanArticleMarkdownForCopy(
  title: string,
  canonicalUrl: string,
  body: string | undefined,
): string {
  const cleanedBody = (body ?? "")
    .replace(/^---[\s\S]*?\r?\n---\r?\n?/, "")
    .replace(/^\s*import\s+[^;\n]+from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return `# ${title}\n\n> Source: ${canonicalUrl}\n\n${cleanedBody}\n`;
}

/** True when a post embeds hydrated interactive MDX components. */
export function isInteractivePost(body: string | undefined): boolean {
  if (!body) return false;
  return INTERACTIVE_ISLAND_RE.test(body);
}

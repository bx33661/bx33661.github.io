/** Produce a clean plain-text search excerpt without exposing raw MDX/JSX syntax. */
export function buildSearchExcerpt(body?: string, maxLength = 500): string {
  if (!body) return "";
  return body
    .replace(/^\s*import\s+[^\n]+$/gm, " ")
    .replace(/```[^\n]*\n([\s\S]*?)```/g, " $1 ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
    .replace(/<\/?[A-Za-z][^>\n]*>/g, " ")
    .replace(/[`#>*_~|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

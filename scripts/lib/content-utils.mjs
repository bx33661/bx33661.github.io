import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const FRONTMATTER_PATTERN = /^\s*---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
export const CODE_FENCE_PATTERN = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*(?:\n|$)/gm;

export function parseFrontmatter(raw) {
  const normalized = raw.replace(/^\uFEFF/, "");
  const match = FRONTMATTER_PATTERN.exec(normalized);
  if (!match) return null;

  const rawFrontmatter = match[1];
  const body = normalized.slice(match[0].length);
  const loaded = yaml.load(rawFrontmatter);
  const data = loaded && typeof loaded === "object" ? loaded : {};
  return { rawFrontmatter, data, body };
}

export function walkMarkdownFiles(rootDir, { skipUnderscore = true } = {}) {
  const result = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (skipUnderscore && entry.name.startsWith("_")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

export function stableHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function createDeterministicSlug(source, prefix = "post", { datedFallback = false } = {}) {
  const normalized = source
    .replace(/\.(md|mdx)$/i, "")
    .replace(/[\\/]/g, "-")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized) return normalized;
  const hash = stableHash(source);
  return datedFallback ? `${prefix}-${new Date().toISOString().slice(0, 10)}-${hash.slice(0, 6)}` : `${prefix}-${hash}`;
}

export function stripCodeFences(markdown) {
  return markdown.replace(CODE_FENCE_PATTERN, "");
}

export function collectMatches(text, regex) {
  return [...text.matchAll(regex)].map((match) => match[1] ?? match[0]);
}

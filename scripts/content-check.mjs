import fs from "node:fs";
import path from "node:path";
import { createDeterministicSlug, parseFrontmatter, walkMarkdownFiles } from "./lib/content-utils.mjs";

const PUBLIC_ROOT = path.resolve("public");
const COLLECTION_PATHS = {
  blog: path.resolve("src/content/blog"),
  notes: path.resolve("src/data/notes"),
  galleries: path.resolve("src/data/galleries"),
};
const COLLECTIONS = Object.keys(COLLECTION_PATHS);

const REQUIRED_FIELDS = {
  blog: ["title", "description", "date"],
  notes: ["title", "description", "date"],
  galleries: ["title", "description"],
};

const IMAGE_KEYS = ["ogImage", "cover", "image", "coverImage"];
const existsCache = new Map();

function cachedExists(targetPath) {
  let exists = existsCache.get(targetPath);
  if (exists === undefined) {
    exists = fs.existsSync(targetPath);
    existsCache.set(targetPath, exists);
  }
  return exists;
}

function stripQuotes(value) {
  return String(value ?? "")
    .trim()
    .replace(/^['"`](.*)['"`]$/, "$1")
    .trim();
}

function parseDateValue(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = stripQuotes(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => stripQuotes(item).length > 0);
}

function publicPathToFilePath(value) {
  const decodedPath = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  return path.resolve(PUBLIC_ROOT, decodedPath.replace(/^\/+/, ""));
}

function parseMarkdownImageTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  const angleMatch = trimmed.match(/^<([^>]+)>/);
  if (angleMatch) return angleMatch[1].trim();
  return stripQuotes(trimmed.replace(/\s+(?:"[^"]*"|'[^']*')\s*$/, ""));
}

function stripNonProseRegions(body) {
  return body
    .replace(/(^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/`[^`\n]+`/g, "");
}

function resolveLocalImagePath(imagePath, filePath) {
  const cleanPath = stripQuotes(imagePath).split(/[?#]/, 1)[0];
  if (!cleanPath || /^https?:\/\//i.test(cleanPath) || /^data:/i.test(cleanPath)) {
    return null;
  }

  if (cleanPath.startsWith("/")) {
    return publicPathToFilePath(cleanPath);
  }

  if (filePath && (cleanPath.startsWith("./") || cleanPath.startsWith("../"))) {
    let decodedRelative = cleanPath;
    try {
      decodedRelative = decodeURIComponent(cleanPath);
    } catch {
      /* Preserve literal path if percent-encoding is invalid. */
    }
    return path.resolve(path.dirname(filePath), decodedRelative);
  }

  return null;
}

function resolveCollection(filePath) {
  for (const [collection, collectionDir] of Object.entries(COLLECTION_PATHS)) {
    const rel = path.relative(collectionDir, filePath);
    if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
      return collection;
    }
  }
  return null;
}

function resolveSlugForFile(collection, filePath, data) {
  const slugRaw = stripQuotes(data.slug);
  if (slugRaw) return slugRaw;

  const relFromCollection = path.relative(COLLECTION_PATHS[collection], filePath);
  return createDeterministicSlug(relFromCollection, collection === "notes" ? "note" : "post");
}

function checkFrontmatterImages(data, filePath, relPath, warnings) {
  for (const imageKey of IMAGE_KEYS) {
    const value = typeof data[imageKey] === "string" ? stripQuotes(data[imageKey]) : "";
    const resolved = value ? resolveLocalImagePath(value, filePath) : null;
    if (resolved && !cachedExists(resolved)) {
      warnings.push(`${relPath}: local ${imageKey} not found -> ${value}`);
    }
  }
}

function checkFile(filePath, errors, warnings, slugRegistry) {
  const raw = fs.readFileSync(filePath, "utf8");
  const collection = resolveCollection(filePath);
  if (!collection) return;

  const relPath = path.relative(process.cwd(), filePath);
  let parsed;
  try {
    parsed = parseFrontmatter(raw);
  } catch (err) {
    errors.push(`${relPath}: invalid YAML frontmatter (${err instanceof Error ? err.message : String(err)})`);
    return;
  }

  if (!parsed) {
    errors.push(`${relPath}: missing frontmatter block`);
    return;
  }

  const { data, body } = parsed;
  for (const field of REQUIRED_FIELDS[collection]) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) {
      errors.push(`${relPath}: missing required field "${field}"`);
      continue;
    }

    if (stripQuotes(data[field]) === "") {
      errors.push(`${relPath}: "${field}" cannot be empty`);
    }
  }

  if (collection === "blog" || collection === "notes") {
    if (!parseDateValue(data.date)) {
      errors.push(`${relPath}: invalid "date", expected a parseable date`);
    }

    const title = stripQuotes(data.title);
    const description = stripQuotes(data.description);
    if (title && title.length > 80) {
      warnings.push(`${relPath}: title is long (${title.length} chars), consider <= 80`);
    }
    if (description && (description.length < 40 || description.length > 180)) {
      warnings.push(`${relPath}: description length is ${description.length}, recommended 40-180`);
    }
    if (!hasNonEmptyArray(data.tags)) {
      warnings.push(`${relPath}: missing/empty tags, recommended for archive and SEO`);
    }
    if (collection === "blog" && !hasNonEmptyArray(data.authors)) {
      warnings.push(`${relPath}: missing/empty authors`);
    }

    checkFrontmatterImages(data, filePath, relPath, warnings);

    const proseBody = stripNonProseRegions(body);
    for (const match of proseBody.matchAll(/!\[[^\]]*]\(([^)\n]+)\)/g)) {
      const imagePath = parseMarkdownImageTarget(match[1]);
      const resolvedImage = resolveLocalImagePath(imagePath, filePath);
      if (resolvedImage && !cachedExists(resolvedImage)) {
        warnings.push(`${relPath}: local image not found -> ${imagePath}`);
      }
    }

    for (const match of proseBody.matchAll(/<img\b[^>]*\bsrc\s*=\s*(['"])([^'"]+)\1/gi)) {
      const imagePath = stripQuotes(match[2]);
      const resolvedImage = resolveLocalImagePath(imagePath, filePath);
      if (resolvedImage && !cachedExists(resolvedImage)) {
        warnings.push(`${relPath}: local <img> not found -> ${imagePath}`);
      }
    }
  } else if (collection === "galleries") {
    if (!parseDateValue(data.date) && !parseDateValue(data.pubDatetime)) {
      errors.push(`${relPath}: invalid or missing "date"/"pubDatetime", expected a parseable date`);
    }
    checkFrontmatterImages(data, filePath, relPath, warnings);
  }

  if (data.draft !== undefined && data.draft !== false && !/^(false|0|no)$/i.test(String(data.draft).trim())) {
    warnings.push(`${relPath}: draft is not false, page may be hidden in production`);
  }

  if (collection === "blog" || collection === "notes") {
    const slug = resolveSlugForFile(collection, filePath, data);
    const key = `${collection}:${slug}`;
    const existing = slugRegistry.get(key);
    if (existing && existing !== relPath) {
      errors.push(`${relPath}: duplicate slug "${slug}" (already used by ${existing})`);
    } else {
      slugRegistry.set(key, relPath);
    }
  }
}

function main() {
  const errors = [];
  const warnings = [];
  const slugRegistry = new Map();

  for (const collection of COLLECTIONS) {
    const collectionDir = COLLECTION_PATHS[collection];
    if (!fs.existsSync(collectionDir)) continue;
    for (const filePath of walkMarkdownFiles(collectionDir)) {
      checkFile(filePath, errors, warnings, slugRegistry);
    }
  }

  console.log("Content check summary:");
  console.log(`- Errors: ${errors.length}`);
  console.log(`- Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log("");
    for (const error of errors) console.error(`[FAIL] ${error}`);
  }

  if (warnings.length > 0) {
    console.log("");
    for (const warning of warnings) console.warn(`[WARN] ${warning}`);
  }

  if (errors.length > 0) process.exit(1);
}

main();

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { banner, c, panel, statusLine, table } from "./lib/cli-ui.mjs";
import { createDeterministicSlug } from "./lib/content-utils.mjs";

const VALID_TYPES = new Set(["blog", "notes"]);

function resolveDefaultAuthorId() {
  try {
    const configSource = fs.readFileSync(path.resolve("src/config.ts"), "utf8");
    const match = configSource.match(/defaultAuthorId:\s*["']([^"']+)["']/);
    return match?.[1] || "bx";
  } catch {
    return "bx";
  }
}

function parseArgs(argv) {
  const args = {
    type: "blog",
    title: "",
    slug: "",
    description: "",
    date: "",
    ext: "md",
    lang: "",
    tags: "",
  };
  const flagSet = new Set(["type", "title", "slug", "description", "date", "ext", "lang", "tags"]);

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith("--")) continue;
    const eqIndex = part.indexOf("=");
    if (eqIndex !== -1) {
      const key = part.slice(2, eqIndex);
      if (flagSet.has(key)) args[key] = part.slice(eqIndex + 1);
    } else {
      const key = part.slice(2);
      if (flagSet.has(key)) {
        args[key] = argv[i + 1] ?? args[key];
        i += 1;
      }
    }
  }

  return args;
}

function escapeDoubleQuotes(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function resolveDate(inputDate) {
  if (!inputDate) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(inputDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${inputDate}. Expected YYYY-MM-DD.`);
  }
  return parsed.toISOString().slice(0, 10);
}

function parseTagsList(rawTags, fallbackTags) {
  const parsed = String(rawTags || "")
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : fallbackTags;
}

function formatYamlTags(tags) {
  return tags.map((tag) => `  - "${escapeDoubleQuotes(tag)}"`).join("\n");
}

function buildTemplate(type, { title, description, date, slug, tags, authorId, lang }) {
  const safeTitle = escapeDoubleQuotes(title);
  const defaultDesc =
    type === "blog"
      ? "Write a concise summary for search and social preview."
      : "Write a concise summary for the note.";
  const safeDesc = escapeDoubleQuotes(description || defaultDesc);
  const langLine = lang === "en" ? 'lang: "en"\n' : "";

  if (type === "blog") {
    return `---
title: "${safeTitle}"
description: "${safeDesc}"
date: ${date}
tags:
${formatYamlTags(tags)}
authors:
  - "${escapeDoubleQuotes(authorId)}"
draft: true
slug: "${slug}"
${langLine}---

## Background

## Key Points

## Reproduction / Practice

## Notes
`;
  }

  return `---
title: "${safeTitle}"
description: "${safeDesc}"
date: ${date}
category: "learning"
tags:
${formatYamlTags(tags)}
authors:
  - "${escapeDoubleQuotes(authorId)}"
draft: true
slug: "${slug}"
${langLine}---

## Topic

## Details

## References
`;
}

async function promptInteractive(defaults) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(banner("Content Generator", "Interactive wizard for blog posts and notes"));
    console.log("");
    const ask = async (label, fallback = "") => {
      const hint = fallback ? ` ${c.muted(`(${fallback})`)}` : "";
      const answer = (await rl.question(`  ${c.cyan("?")} ${c.bold(label)}${hint}: `)).trim();
      return answer || fallback;
    };

    const type = (await ask("Collection [blog / notes]", defaults.type)).toLowerCase();
    const title = await ask("Title (required)", defaults.title);
    const suggestedSlug = createDeterministicSlug(title, type === "notes" ? "note" : "post", { datedFallback: true });
    const slug = await ask("URL slug", defaults.slug || suggestedSlug);
    const description = await ask("Description (40-180 chars)", defaults.description);
    const tags = await ask("Tags (comma separated)", defaults.tags || (type === "notes" ? "notes" : "security"));
    const lang = (await ask("Language [zh / en]", defaults.lang || "zh")).toLowerCase();
    const ext = (await ask("Format [md / mdx]", defaults.ext)).toLowerCase();
    return { ...defaults, type, title, slug, description, tags, lang: lang === "en" ? "en" : "", ext };
  } finally {
    rl.close();
  }
}

async function main() {
  let args = parseArgs(process.argv.slice(2));
  const isInteractive = !String(args.title || "").trim() && process.stdin.isTTY && process.stdout.isTTY;

  if (isInteractive) {
    args = await promptInteractive(args);
  } else {
    console.log(banner("Content Generator", "Creating draft markdown scaffold"));
  }

  const type = String(args.type || "blog").toLowerCase();
  if (!VALID_TYPES.has(type)) {
    console.error(statusLine("error", "Invalid --type", `Must be one of: ${Array.from(VALID_TYPES).join(", ")}`));
    process.exit(1);
  }

  const title = String(args.title || "").trim();
  if (!title) {
    console.error(
      statusLine("error", "Missing --title", 'Usage: npm run content:new -- --title "文章标题" [--type blog|notes]'),
    );
    process.exit(1);
  }

  const ext = String(args.ext || "md").toLowerCase();
  if (!["md", "mdx"].includes(ext)) {
    console.error(statusLine("error", "Invalid --ext", "Must be md or mdx"));
    process.exit(1);
  }

  const lang = String(args.lang || "").toLowerCase();
  if (lang && lang !== "zh" && lang !== "en") {
    console.error(statusLine("error", "Invalid --lang", "Must be zh or en"));
    process.exit(1);
  }

  const date = resolveDate(args.date);
  const slugPrefix = type === "notes" ? "note" : "post";
  const slug = createDeterministicSlug(String(args.slug || title), slugPrefix, { datedFallback: true });
  const defaultTags = type === "notes" ? ["notes"] : ["security"];
  const tags = parseTagsList(args.tags, defaultTags);
  const authorId = resolveDefaultAuthorId();

  const targetDir = type === "notes" ? path.resolve("src/data/notes") : path.resolve("src/content", type);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, `${slug}.${ext}`);

  if (fs.existsSync(targetPath)) {
    console.error(statusLine("error", "File already exists", targetPath));
    process.exit(1);
  }

  const template = buildTemplate(type, {
    title,
    description: String(args.description || "").trim(),
    date,
    slug,
    tags,
    authorId,
    lang: lang === "en" ? "en" : "",
  });

  fs.writeFileSync(targetPath, template, "utf8");
  const relPath = path.relative(process.cwd(), targetPath);

  console.log("");
  console.log(
    panel(
      "Draft Scaffold Created",
      [`File   ${relPath}`, `Slug   /${type}/${slug}/`, `Author ${authorId} (draft: true)`],
      "ok",
    ),
  );
  console.log("");
  console.log(
    table([
      [c.cyan("Next"), "Edit frontmatter description/tags, then run npm run content:check"],
      [c.cyan("Publish"), "Set draft: false when ready to publish"],
    ]),
  );
  console.log("");
}

main().catch((error) => {
  console.error(
    statusLine("error", "Failed to create content", error instanceof Error ? error.message : String(error)),
  );
  process.exit(1);
});

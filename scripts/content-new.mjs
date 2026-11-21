import fs from "node:fs";
import path from "node:path";
import { createDeterministicSlug } from "./lib/content-utils.mjs";

const VALID_TYPES = new Set(["blog", "notes"]);

function parseArgs(argv) {
  const args = {
    type: "blog",
    title: "",
    slug: "",
    description: "",
    date: "",
    ext: "md",
  };
  const flagSet = new Set(["type", "title", "slug", "description", "date", "ext"]);

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

function buildTemplate(type, { title, description, date, slug }) {
  const safeTitle = escapeDoubleQuotes(title);
  const defaultDesc =
    type === "blog"
      ? "Write a concise summary for search and social preview."
      : "Write a concise summary for the note.";
  const safeDesc = escapeDoubleQuotes(description || defaultDesc);

  if (type === "blog") {
    return `---
title: "${safeTitle}"
description: "${safeDesc}"
date: ${date}
tags:
  - "security"
authors:
  - "bx"
draft: true
slug: "${slug}"
---

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
  - "notes"
authors:
  - "bx"
draft: true
slug: "${slug}"
---

## Topic

## Details

## References
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const type = String(args.type || "blog").toLowerCase();

  if (!VALID_TYPES.has(type)) {
    console.error(`[FAIL] --type must be one of: ${Array.from(VALID_TYPES).join(", ")}`);
    process.exit(1);
  }

  const title = String(args.title || "").trim();
  if (!title) {
    console.error("[FAIL] Missing required --title");
    process.exit(1);
  }

  const ext = String(args.ext || "md").toLowerCase();
  if (!["md", "mdx"].includes(ext)) {
    console.error("[FAIL] --ext must be md or mdx");
    process.exit(1);
  }

  const date = resolveDate(args.date);
  const slugPrefix = type === "notes" ? "note" : "post";
  const slug = createDeterministicSlug(String(args.slug || title), slugPrefix, { datedFallback: true });

  const targetDir = type === "notes" ? path.resolve("src/data/notes") : path.resolve("src/content", type);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, `${slug}.${ext}`);

  if (fs.existsSync(targetPath)) {
    console.error(`[FAIL] File already exists: ${targetPath}`);
    process.exit(1);
  }

  const template = buildTemplate(type, {
    title,
    description: String(args.description || "").trim(),
    date,
    slug,
  });

  fs.writeFileSync(targetPath, template, "utf8");
  console.log(`[OK] Created ${targetPath}`);
  console.log("[NEXT] Run: npm run content:check");
}

try {
  main();
} catch (error) {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

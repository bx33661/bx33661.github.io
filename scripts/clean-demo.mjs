import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { banner, c, panel, section, statusLine, table } from "./lib/cli-ui.mjs";

const dryRun = process.argv.includes("--dry-run");
const autoYes = process.argv.includes("--yes") || process.argv.includes("-y");

const DEMO_BLOG_FILES = [
  "src/content/blog/getting-started-with-astro-orbit.md",
  "src/content/blog/getting-started-with-astro-orbit-zh.md",
  "src/content/blog/markdown-math-and-diagrams-showcase.md",
  "src/content/blog/markdown-math-and-diagrams-showcase-zh.md",
  "src/content/blog/bilingual-and-series-architecture.md",
];

const DEMO_NOTE_FILES = [
  "src/data/notes/astro-7-fonts-and-csp.md",
  "src/data/notes/astro-7-fonts-and-csp-zh.md",
  "src/data/notes/deploying-to-subpath.md",
];

const DEMO_GALLERY_DIRS = ["src/data/galleries/orbit-frames"];
const DEMO_OPTIMIZED_PREFIXES = [
  "01-celestial-horizon-",
  "02-meridian-study-",
  "03-quiet-observatory-",
  "04-twilight-grid-",
];
const DEMO_PUBLIC_FILES = ["public/blog/demo/orbit-architecture.png"];

function readSiteDefaults() {
  const fallback = { title: "Astro Orbit", authorId: "orbit", locale: "en" };
  try {
    const src = fs.readFileSync(path.resolve("src/config.ts"), "utf8");
    return {
      title: src.match(/^\s*title:\s*["']([^"']+)["']/m)?.[1] || fallback.title,
      authorId: src.match(/^\s*defaultAuthorId:\s*["']([^"']+)["']/m)?.[1] || fallback.authorId,
      locale: src.match(/const DEFAULT_LOCALE(?::[^=]+)?\s*=\s*["']([^"']+)["']/)?.[1] || fallback.locale,
    };
  } catch {
    return fallback;
  }
}

function collectDemoOptimizedFiles() {
  const optDir = path.resolve("public/gallery/optimized");
  if (!fs.existsSync(optDir)) return [];
  return fs
    .readdirSync(optDir)
    .filter((name) => DEMO_OPTIMIZED_PREFIXES.some((prefix) => name.startsWith(prefix)))
    .map((name) => path.posix.join("public/gallery/optimized", name));
}

function removeFile(relPath) {
  const full = path.resolve(relPath);
  if (!fs.existsSync(full)) return false;
  if (!dryRun) fs.unlinkSync(full);
  return true;
}

function removeDir(relPath) {
  const full = path.resolve(relPath);
  if (!fs.existsSync(full)) return false;
  if (!dryRun) fs.rmSync(full, { recursive: true, force: true });
  return true;
}

async function confirmCleanup() {
  if (dryRun || autoYes) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(statusLine("error", "Confirmation required", "Re-run with --yes in non-interactive shells."));
    process.exit(1);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`  ${c.cyan("?")} Remove demo posts, notes, and gallery assets? [y/N]: `))
      .trim()
      .toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

async function main() {
  console.log(banner("Clean Demo Content", dryRun ? "Dry-run preview (no files modified)" : "Reset starter examples"));
  console.log("");

  const existingFiles = [...DEMO_BLOG_FILES, ...DEMO_NOTE_FILES, ...DEMO_PUBLIC_FILES, ...collectDemoOptimizedFiles()]
    .filter((rel) => fs.existsSync(path.resolve(rel)));
  const existingDirs = DEMO_GALLERY_DIRS.filter((rel) => fs.existsSync(path.resolve(rel)));

  console.log(section("Planned Actions"));
  console.log(
    table([
      [c.cyan("Remove files"), `${existingFiles.length} demo post / note / asset file(s)`],
      [c.cyan("Remove folders"), `${existingDirs.length} demo gallery folder(s)`],
      [c.cyan("Reset data"), "src/data/article-series.ts & GALLERY_IMAGES in src/data/gallery.ts"],
      [c.cyan("Starter post"), "Ensure src/content/blog/hello-world.md exists so builds stay valid"],
    ]),
  );
  console.log("");

  if (dryRun) {
    console.log(panel("Dry Run Complete", ["No files were modified. Run `npm run clean:demo -- --yes` to apply."], "info"));
    return;
  }

  const confirmed = await confirmCleanup();
  if (!confirmed) {
    console.log(statusLine("warn", "Cancelled", "Demo content left untouched."));
    return;
  }

  let removedFiles = 0;
  for (const rel of existingFiles) {
    if (removeFile(rel)) removedFiles += 1;
  }
  for (const rel of existingDirs) {
    removeDir(rel);
  }
  const demoPublicDir = path.resolve("public/blog/demo");
  if (fs.existsSync(demoPublicDir) && fs.readdirSync(demoPublicDir).length === 0) {
    fs.rmdirSync(demoPublicDir);
  }

  const seriesPath = path.resolve("src/data/article-series.ts");
  fs.writeFileSync(
    seriesPath,
    `import type { ArticleSeries } from "@/utils/article-discovery";

/**
 * Curated reading series using stable article slugs in explicit order.
 * Entries marked \`draft: true\` or missing are omitted automatically.
 */
export const articleSeries: readonly ArticleSeries[] = [];
`,
    "utf8",
  );

  const galleryPath = path.resolve("src/data/gallery.ts");
  if (fs.existsSync(galleryPath)) {
    const gallerySrc = fs.readFileSync(galleryPath, "utf8");
    const updatedGallery = gallerySrc.replace(
      /export const GALLERY_IMAGES:\s*GalleryImageItem\[\]\s*=\s*\[[\s\S]*?\n\];/,
      "export const GALLERY_IMAGES: GalleryImageItem[] = [];",
    );
    fs.writeFileSync(galleryPath, updatedGallery, "utf8");
  }

  const blogDir = path.resolve("src/content/blog");
  fs.mkdirSync(blogDir, { recursive: true });
  const remainingPosts = fs.readdirSync(blogDir).filter((name) => /\.(md|mdx)$/i.test(name));
  const defaults = readSiteDefaults();
  let createdStarter = false;

  if (remainingPosts.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const starterPath = path.join(blogDir, "hello-world.md");
    const isZh = defaults.locale === "zh-CN";
    const starterContent = isZh
      ? `---
title: "你好，世界 · ${defaults.title}"
description: "这是一个全新的示例起步文章，确认站点结构、搜索索引与排版均可正常构建。"
date: ${today}
tags:
  - "笔记"
authors:
  - "${defaults.authorId}"
draft: false
slug: "hello-world"
lang: "zh-CN"
---

欢迎来到 **${defaults.title}**。示例演示文章已清理完毕，现在可以运行 \`npm run content:new\` 开始创作你的第一篇正式内容。
`
      : `---
title: "Hello, World · ${defaults.title}"
description: "A clean starter article confirming your site build, typography, and local search index work out of the box."
date: ${today}
tags:
  - "Notes"
authors:
  - "${defaults.authorId}"
draft: false
slug: "hello-world"
lang: "en"
---

Welcome to **${defaults.title}**. Starter demo articles have been removed—run \`npm run content:new\` whenever you are ready to write your next post.
`;
    fs.writeFileSync(starterPath, starterContent, "utf8");
    createdStarter = true;
  }

  console.log("");
  console.log(
    panel(
      "Demo Cleanup Complete",
      [
        `Removed ${removedFiles} file(s) and ${existingDirs.length} folder(s)`,
        "Reset article-series.ts and GALLERY_IMAGES",
        createdStarter ? "Created starter post src/content/blog/hello-world.md" : "Kept your existing custom blog posts",
      ],
      "ok",
    ),
  );
  console.log(statusLine("next", "Verify build", "Run npm run verify:full"));
  console.log("");
}

main().catch((error) => {
  console.error(statusLine("error", "Cleanup failed", error instanceof Error ? error.message : String(error)));
  process.exit(1);
});

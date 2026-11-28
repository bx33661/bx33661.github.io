import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { banner, c, formatDuration, panel, section, statusLine, table } from "./lib/cli-ui.mjs";

const startedAt = performance.now();
const distDir = path.resolve("dist");
const failures = [];

function checkExists(relPath) {
  const full = path.join(distDir, relPath);
  if (!fs.existsSync(full)) {
    failures.push(`missing dist artifact: ${relPath}`);
    return null;
  }
  return full;
}

function assertIncludes(relPath, marker) {
  const full = checkExists(relPath);
  if (!full) return;
  const content = fs.readFileSync(full, "utf8");
  if (!content.includes(marker)) {
    failures.push(`${relPath} missing expected marker: ${marker}`);
  }
}

const configSource = fs.readFileSync(path.resolve("src/config.ts"), "utf8");
const bilingual = /const BILINGUAL\s*=\s*true/.test(configSource);
const defaultLocale = configSource.match(/const DEFAULT_LOCALE(?::[^=]+)?\s*=\s*["']([^"']+)["']/)?.[1] || "en";
const secondaryPrefix = defaultLocale === "en" ? "zh" : "en";
const hasFeature = (name) => !new RegExp(`^\\s*${name}:\\s*false\\b`, "m").test(configSource);

const requiredFiles = [
  "index.html",
  "404.html",
  "offline/index.html",
  "blog/index.html",
  ...(hasFeature("notes") ? ["notes/index.html"] : []),
  ...(hasFeature("projects") ? ["projects/index.html"] : []),
  ...(hasFeature("friends") ? ["friends/index.html"] : []),
  ...(hasFeature("galleries") ? ["galleries/index.html"] : []),
  ...(hasFeature("archives") ? ["archives/index.html"] : []),
  ...(hasFeature("search") ? ["search/index.html", "search.json", "pagefind/pagefind.js"] : []),
  "rss.xml",
  "sitemap-index.xml",
  "sitemap.xml",
  "image-sitemap.xml",
  "robots.txt",
  "site.webmanifest",
  "og.png",
];

if (bilingual) {
  requiredFiles.push(
    `${secondaryPrefix}/index.html`,
    `${secondaryPrefix}/blog/index.html`,
    ...(hasFeature("notes") ? [`${secondaryPrefix}/notes/index.html`] : []),
    ...(hasFeature("archives") ? [`${secondaryPrefix}/archives/index.html`] : []),
    ...(hasFeature("search") ? [`${secondaryPrefix}/search/index.html`, `${secondaryPrefix}/search.json`] : []),
    `${secondaryPrefix}/rss.xml`,
  );
}

for (const rel of requiredFiles) {
  checkExists(rel);
}

// Verify at least one generated blog post page exists regardless of whether demo posts were cleaned.
const distBlogDir = path.join(distDir, "blog");
const builtBlogPosts = fs.existsSync(distBlogDir)
  ? fs
      .readdirSync(distBlogDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !/^\d+$/.test(entry.name) && fs.existsSync(path.join(distBlogDir, entry.name, "index.html")))
  : [];
if (builtBlogPosts.length === 0) {
  failures.push("no built article pages found under dist/blog/*/index.html");
}

// Check showcase pipeline markers only when the showcase article is still present.
if (fs.existsSync(path.resolve("src/content/blog/markdown-math-and-diagrams-showcase.md"))) {
  assertIncludes("blog/markdown-math-and-diagrams-showcase/index.html", "katex");
  assertIncludes("blog/markdown-math-and-diagrams-showcase/index.html", "orbit-architecture.png");
  assertIncludes("blog/markdown-math-and-diagrams-showcase/index.html", "data-callout=");
}

if (bilingual) {
  assertIncludes("index.html", 'rel="alternate" hreflang=');
}

// Privacy & upstream leak guard across built text artifacts
const LEAK_PATTERN = new RegExp(
  [
    ["bx", "33661"].join(""),
    ["hnu", "sec"].join(""),
    ["codeva", "INhoFW40MU"].join("-"),
    ["googlee", "8222"].join(""),
    ["Zhang", "Boxiang"].join(" "),
    ["张", "博翔"].join(""),
    ["Hainan", "University"].join(" "),
    ["海南", "大学"].join(""),
    ["Wot", "fard"].join(""),
    ["Carto", "graph CF"].join(""),
  ].join("|"),
  "i",
);

function scanLeaks(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "pagefind") continue;
      scanLeaks(full);
    } else if (/\.(html|xml|json|txt|webmanifest|js|css)$/i.test(entry.name)) {
      const content = fs.readFileSync(full, "utf8");
      const match = content.match(LEAK_PATTERN);
      if (match) {
        failures.push(`leak detected (${match[0]}) in ${path.relative(distDir, full)}`);
      }
    }
  }
}
scanLeaks(distDir);

const elapsed = formatDuration(performance.now() - startedAt);
console.log(banner("Dist Smoke Check", "Verifying built routes, Pagefind index & zero-leak output"));
console.log(section("Summary"));
console.log(
  table([
    [c.cyan("Checked Files"), String(requiredFiles.length)],
    [c.cyan("Article Pages"), String(builtBlogPosts.length)],
    [c.cyan("Bilingual"), bilingual ? `enabled (/${secondaryPrefix}/)` : "disabled"],
    [c.cyan("Failures"), failures.length === 0 ? c.green("0") : c.red(String(failures.length))],
    [c.cyan("Elapsed"), elapsed],
  ]),
);

if (failures.length > 0) {
  console.log(section("Failures"));
  for (const failure of failures) console.error(statusLine("error", "Fail", failure));
  console.log("");
  console.log(panel("Dist Smoke Failed", [`Found ${failures.length} issue(s) in dist/.`], "error"));
  process.exit(1);
}

console.log("");
console.log(statusLine("ok", "Dist smoke passed", `${elapsed}`));

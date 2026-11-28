import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { banner, c, formatDuration, section, statusLine, table } from "./lib/cli-ui.mjs";

const startedAt = performance.now();
const failures = [];
const warnings = [];

const requireFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${filePath}`);
  }
};

const requireDirectoryHasFiles = (dirPath, filter) => {
  if (!fs.existsSync(dirPath)) {
    failures.push(`missing directory: ${dirPath}`);
    return;
  }
  const files = fs.readdirSync(dirPath).filter((name) => filter(name));
  if (files.length === 0) {
    failures.push(`directory has no expected files: ${dirPath}`);
  }
};

const assertNoText = (filePath, pattern, label) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file for check: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (pattern.test(content)) {
    failures.push(`${label}: ${filePath}`);
  }
};

const assertHasText = (filePath, pattern, label) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file for check: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (!pattern.test(content)) {
    failures.push(`${label}: ${filePath}`);
  }
};

const repoRoot = process.cwd();

requireFile(path.join(repoRoot, "src/pages/album/index.astro"));
requireFile(path.join(repoRoot, "src/pages/tags/index.astro"));
requireFile(path.join(repoRoot, "src/pages/tags/[tag].astro"));
requireFile(path.join(repoRoot, "src/data/gallery.ts"));
requireFile(path.join(repoRoot, "public/sw.js"));
requireFile(path.join(repoRoot, "src/pages/site.webmanifest.ts"));
requireFile(path.join(repoRoot, "astro.config.ts"));

assertHasText(
  path.join(repoRoot, "src/pages/tags/index.astro"),
  /\/blog\/#topics/,
  "legacy /tags index missing redirect to blog topics",
);
assertHasText(
  path.join(repoRoot, "src/layouts/Layout.astro"),
  /giscus\.app/,
  "Layout CSP missing giscus.app allowlist",
);
assertHasText(path.join(repoRoot, "public/_headers"), /giscus\.app/, "_headers CSP missing giscus.app allowlist");
assertHasText(
  path.join(repoRoot, "src/layouts/Layout.astro"),
  /frame-src \$\{frameSources\}[\s\S]*giscus\.app|giscus\.app[\s\S]*frame-src/,
  "Layout CSP missing frame-src for giscus.app",
);

requireDirectoryHasFiles(path.join(repoRoot, "src/data/galleries/bx-journey"), (name) => /\.(jpe?g|png)$/i.test(name));
requireDirectoryHasFiles(path.join(repoRoot, "public/gallery/optimized"), (name) => /\.(avif|webp|jpg)$/i.test(name));

for (const retiredPath of ["src/pages/projects", "src/utils/projects.ts", "public/fonts/crt"]) {
  if (fs.existsSync(path.join(repoRoot, retiredPath))) {
    failures.push(`retired Projects resource still exists: ${retiredPath}`);
  }
}
for (const file of [
  "src/data/academic/projects/pureautocodeql.json",
  "src/data/academic/projects/wireshark-mcp.json",
  "src/data/academic/awards/panshi-2025.json",
])
  requireFile(path.join(repoRoot, file));
assertHasText(
  path.join(repoRoot, "src/content.config.ts"),
  /relatedPosts:\s*z\.array\(reference\("blog"\)\)/,
  "academic project-to-article references missing",
);
assertHasText(
  path.join(repoRoot, "src/config.ts"),
  /the field of Computer Science/,
  "homepage config missing approved focus text",
);
assertHasText(
  path.join(repoRoot, "src/components/AcademicHome.astro"),
  /focus-section/,
  "personal homepage missing focus section",
);
assertNoText(
  path.join(repoRoot, "src/components/AcademicHome.astro"),
  /education-section|\/schools\/|Hainan University|University of Chinese Academy of Sciences/,
  "homepage still includes removed school details",
);
assertNoText(
  path.join(repoRoot, "src/components/AcademicHome.astro"),
  /getProjectRoots|\/projects\/[\w-]+/,
  "homepage still uses retired project routes",
);
assertHasText(
  path.join(repoRoot, "astro.config.ts"),
  /defaultStrategy:\s*['"]hover['"]/,
  "Astro prefetch hover strategy not configured",
);

const elapsed = formatDuration(performance.now() - startedAt);
console.log(banner("Source Smoke Check", "Verifying critical routes, headers, collections & configs"));
console.log(section("Summary"));
console.log(
  table([
    [c.cyan("Failures"), failures.length === 0 ? c.green("0") : c.red(String(failures.length))],
    [c.cyan("Warnings"), warnings.length === 0 ? c.green("0") : c.amber(String(warnings.length))],
    [c.cyan("Elapsed"), elapsed],
  ]),
);

for (const warning of warnings) {
  console.warn(statusLine("warn", "Warn", warning));
}

if (failures.length > 0) {
  console.log(section("Failures"));
  for (const failure of failures) {
    console.error(statusLine("error", "Fail", failure));
  }
  console.log("");
  process.exit(1);
}

console.log(statusLine("ok", "Source smoke checks passed", elapsed));

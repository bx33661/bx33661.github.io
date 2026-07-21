import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, "dist");
const failures = [];

const requireBuiltFile = (relativePath) => {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing built file: dist/${relativePath}`);
  }
  return fullPath;
};

if (!fs.existsSync(distDir)) {
  console.error("[FAIL] dist directory not found. Run build first.");
  process.exit(1);
}

const requiredFiles = [
  "index.html",
  "galleries/index.html",
  "album/index.html",
  "tags/index.html",
  "blog/tags/index.html",
  "sitemap.xml",
  "image-sitemap.xml",
  "_headers",
  "_redirects",
];

for (const file of requiredFiles) {
  requireBuiltFile(file);
}

const projectsIndexFile = requireBuiltFile("projects/index.html");
if (fs.existsSync(projectsIndexFile)) {
  const content = fs.readFileSync(projectsIndexFile, "utf8");
  if (/http-equiv=["']refresh["']/i.test(content) && /\/galleries\/?/.test(content)) {
    failures.push(
      "dist/projects/index.html still redirects to /galleries (expected real projects list)",
    );
  }
  if (!/oh-my-vul|Wireshark-MCP|PureAutoCodeQL/i.test(content)) {
    failures.push(
      "dist/projects/index.html does not list expected project titles",
    );
  }
  if (!/href="\/projects\/[^"/]+\//.test(content)) {
    failures.push(
      "dist/projects/index.html does not contain project detail links",
    );
  }
}

// Docs-library: root + at least one child page should exist
const omvRoot = requireBuiltFile("projects/oh-my-vul/index.html");
const omvChild = path.join(distDir, "projects/oh-my-vul/problem/index.html");
if (fs.existsSync(omvRoot)) {
  const content = fs.readFileSync(omvRoot, "utf8");
  if (!/crt-docs|PAGES|Overview/i.test(content)) {
    failures.push(
      "dist/projects/oh-my-vul/index.html missing docs-library chrome",
    );
  }
}
if (!fs.existsSync(omvChild)) {
  failures.push(
    "dist/projects/oh-my-vul/problem/index.html missing (docs child page)",
  );
}

const albumIndex = requireBuiltFile("album/index.html");
if (fs.existsSync(albumIndex)) {
  const content = fs.readFileSync(albumIndex, "utf8");
  if (!/\/galleries\/?/.test(content)) {
    failures.push("album index does not redirect to /galleries");
  }
}

const tagsIndex = requireBuiltFile("tags/index.html");
if (fs.existsSync(tagsIndex)) {
  const content = fs.readFileSync(tagsIndex, "utf8");
  if (!/\/blog\/tags\/?/.test(content)) {
    failures.push("tags index does not redirect to /blog/tags");
  }
}

const tagsDir = path.join(distDir, "tags");
if (fs.existsSync(tagsDir)) {
  const tagDirs = fs
    .readdirSync(tagsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
  if (tagDirs.length === 0) {
    failures.push("no legacy tag redirect pages under dist/tags");
  } else {
    const sample = requireBuiltFile(
      path.join("tags", tagDirs[0].name, "index.html"),
    );
    const sampleContent = fs.readFileSync(sample, "utf8");
    if (
      !/http-equiv=["']refresh["']/i.test(sampleContent) ||
      !/\/blog\/tags\//.test(sampleContent)
    ) {
      failures.push(
        `legacy tag redirect missing refresh to /blog/tags: ${sample}`,
      );
    }
  }
}

const headersFile = requireBuiltFile("_headers");
if (fs.existsSync(headersFile)) {
  const headers = fs.readFileSync(headersFile, "utf8");
  if (!/giscus\.app/.test(headers) || !/frame-src/.test(headers)) {
    failures.push(
      "dist/_headers CSP missing giscus.app / frame-src allowlist",
    );
  }
}

const galleriesIndex = requireBuiltFile("galleries/index.html");
if (fs.existsSync(galleriesIndex)) {
  const content = fs.readFileSync(galleriesIndex, "utf8");
  if (!/href="\/galleries\/[^"/]+\//.test(content)) {
    failures.push("galleries index does not contain any gallery detail links");
  }
}

const galleriesDir = path.join(distDir, "galleries");
if (fs.existsSync(galleriesDir)) {
  const galleriesEntries = fs.readdirSync(galleriesDir, {
    withFileTypes: true,
  });
  const galleryDirs = galleriesEntries.filter((entry) => entry.isDirectory());

  if (galleryDirs.length === 0) {
    failures.push("no gallery detail pages generated under dist/galleries");
  } else {
    const sampleDetail = requireBuiltFile(
      path.join("galleries", galleryDirs[0].name, "index.html"),
    );
    const detailContent = fs.readFileSync(sampleDetail, "utf8");

    if (!/data-lightbox-trigger/.test(detailContent)) {
      failures.push(
        `gallery detail page missing lightbox triggers: ${sampleDetail}`,
      );
    }

    if (!/\/_astro\//.test(detailContent)) {
      failures.push(
        `gallery detail page does not reference optimized Astro images: ${sampleDetail}`,
      );
    }
  }
} else {
  failures.push("dist/galleries directory missing");
}

console.log("Dist smoke check summary:");
console.log(`- Failures: ${failures.length}`);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[FAIL] ${failure}`);
  }
  process.exit(1);
}

console.log("[OK] dist smoke checks passed");

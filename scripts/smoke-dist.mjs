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
  "sitemap.xml",
  "image-sitemap.xml",
  "_headers",
  "_redirects",
];

for (const file of requiredFiles) {
  requireBuiltFile(file);
}

const projectsRedirectFile = requireBuiltFile("projects/index.html");
if (fs.existsSync(projectsRedirectFile)) {
  const content = fs.readFileSync(projectsRedirectFile, "utf8");
  if (!/\/galleries\/?/.test(content)) {
    failures.push(
      "dist/projects/index.html does not contain redirect target /galleries",
    );
  }
}

const albumIndex = requireBuiltFile("album/index.html");
if (fs.existsSync(albumIndex)) {
  const content = fs.readFileSync(albumIndex, "utf8");
  if (!/\/galleries\/?/.test(content)) {
    failures.push("album index does not redirect to /galleries");
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

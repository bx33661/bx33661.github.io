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
  "schools/ucas-emblem.webp",
  "schools/hainan-university-emblem.webp",
];

for (const file of requiredFiles) {
  requireBuiltFile(file);
}

const homeFile = requireBuiltFile("index.html");
if (fs.existsSync(homeFile)) {
  const home = fs.readFileSync(homeFile, "utf8");
  if (!home.includes("--font-wotfard-native:") || !home.includes("--font-cartograph-native:"))
    failures.push("homepage missing locally served Astro Fonts API families");
  if (!/rel="preload" href="\/_astro\/fonts\/[^\"]+\.woff2" as="font"/.test(home))
    failures.push("homepage missing local first-screen font preload");
  // IMAGE_AUDIT: unused preload must not return to the homepage.
  if (/rel="preload"[^>]*href="\/touxiang-512\.png"/.test(home))
    failures.push("homepage preloads an unused 512px avatar");
  for (const marker of [
    "Zhang Boxiang",
    "张博翔",
    "Research interests",
    "Selected work",
    "PureAutoCodeQL",
    "Wireshark-MCP",
    "Honors &amp; awards",
    "National First Prize",
    "第九届强网杯全国网络安全挑战赛",
    "Education",
    "Hainan University",
    "University of Chinese Academy of Sciences",
    "UCAS",
    "HNU",
    "2027",
    "BACHELOR'S DEGREE",
    "MASTER'S DEGREE",
    "Recent updates",
    "Selected writing",
    "Question",
    "Method",
    "Evidence",
    "/schools/ucas-emblem.webp",
    "/schools/hainan-university-emblem.webp",
    "mailto:bx33661@gmail.com",
  ]) {
    if (!home.includes(marker))
      failures.push(`academic homepage missing: ${marker}`);
  }
  if (!/href="\/blog\/"/.test(home))
    failures.push("academic homepage missing blog entry");
  if (/CURRENTLY|UP NEXT|EXPECTED|预计|Master's studies|undergraduate/.test(home))
    failures.push("academic homepage still contains education status wording");
  if (!home.includes("selected-list") || !home.includes("work-list"))
    failures.push("academic homepage missing selected work or writing list");
  const selectedWork = home.match(/<div class="work-list"[\s\S]*?<\/div>\s*<\/section>/)?.[0] ?? "";
  if (!selectedWork.includes("PureAutoCodeQL") || !selectedWork.includes("Wireshark-MCP"))
    failures.push("selected work must include both research projects");
  const selectedWriting = home.match(/<ol class="selected-list"[\s\S]*?<\/ol>/)?.[0] ?? "";
  const latestUpdates = home.match(/<ol class="updates-list"[\s\S]*?<\/ol>/)?.[0] ?? "";
  if (!selectedWriting.includes("cnvd-2026-20654-lg-nas-rce"))
    failures.push("selected writing missing vulnerability research article");
  if (latestUpdates.includes("cnvd-2026-20654-lg-nas-rce"))
    failures.push("recent updates duplicates selected writing");
  if (home.includes("18768921736") || home.includes("bx33661@qq.com"))
    failures.push("homepage exposes private resume contact details");
}

const cyberGymFile = requireBuiltFile("blog/cybergym-ai-security-agent-benchmark/index.html");
if (fs.existsSync(cyberGymFile)) {
  const article = fs.readFileSync(cyberGymFile, "utf8");
  if (!/<picture><source[^>]+cybergym-dataset-metadata[^>]+\.webp/.test(article))
    failures.push("CyberGym article missing native responsive WebP source");
  if (!/<img[^>]+cybergym-dataset-metadata[^>]+loading="lazy"/.test(article))
    failures.push("CyberGym article missing lazy fallback image");
}
requireBuiltFile("blog/cybergym-ai-security-agent-benchmark/02-dataset-metadata.png");

// IMAGE_AUDIT: generated variants and loading hints are part of the build contract.
for (const [article, image] of [
  ["blog/k8x9w2m7/index.html", "01-profile-bypass-flow"],
  ["blog/wechat-miniapp-security-audit/index.html", "08-xcode-development-ui"],
  ["blog/wechat-miniapp-security-audit/index.html", "13-endpoints-parameters-analysis"],
]) {
  const htmlFile = requireBuiltFile(article);
  if (!fs.existsSync(htmlFile)) continue;
  const html = fs.readFileSync(htmlFile, "utf8");
  if (!html.includes(`${image}-800.webp 800w`) || !html.includes(`${image}-1600.webp 1600w`))
    failures.push(`${article} missing responsive variants for ${image}`);
  if (!new RegExp(`<img[^>]*${image}\\.png[^>]*loading="(eager|lazy)"`).test(html))
    failures.push(`${article} missing image loading policy for ${image}`);
  for (const width of [800, 1600]) {
    const variant = `blog/${image === "01-profile-bypass-flow" ? "l3hctf-best-profile" : "miniapp-audit"}/${image}-${width}.webp`;
    requireBuiltFile(variant);
  }
}

const searchFile = requireBuiltFile("search/index.html");

const friendsFile = requireBuiltFile("friends/index.html");
if (fs.existsSync(friendsFile)) {
  const friends = fs.readFileSync(friendsFile, "utf8");
  for (const marker of ["fp-featured-intro", "friend-blogs", "friend-hnusec", "friend-organizations", "fp-exchange", "fc-tag-row", "self-banner"]) {
    if (!friends.includes(marker)) failures.push(`friends page missing: ${marker}`);
  }
  const friendLinks = friends.match(/aria-label="访问 [^"]+"/g) ?? [];
  if (friendLinks.length !== 20) failures.push(`friends page should preserve 20 links, found ${friendLinks.length}`);
}

if (fs.existsSync(searchFile)) {
  const search = fs.readFileSync(searchFile, "utf8");
  for (const marker of [
    "SEARCH / INDEX",
    "search-surface",
    "pagefind-search",
    "search-dialog",
    "modal-pagefind-search",
  ]) {
    if (!search.includes(marker))
      failures.push(`search page missing: ${marker}`);
  }
  if (search.includes("sp-orb") || search.includes("sm-border-spin")) {
    failures.push("search still renders decorative effects");
  }
}

const archiveFile = requireBuiltFile("archives/index.html");
if (fs.existsSync(archiveFile)) {
  const archive = fs.readFileSync(archiveFile, "utf8");
  for (const marker of [
    "ARCHIVES / CHRONOLOGY",
    "year-index",
    "month-entries",
  ]) {
    if (!archive.includes(marker))
      failures.push(`archive page missing: ${marker}`);
  }
  if (archive.includes("arc-orb"))
    failures.push("archive page still renders old decorative hero");
}

const galleryFile = requireBuiltFile("galleries/index.html");
if (fs.existsSync(galleryFile)) {
  const gallery = fs.readFileSync(galleryFile, "utf8");
  for (const marker of [
    "gallery-fullscreen-container",
    "gallery-container",
    "查看原图",
    "峡谷双桥",
    "经幡穹顶",
  ]) {
    if (!gallery.includes(marker))
      failures.push(`gallery page missing: ${marker}`);
  }
  if (gallery.includes("photo-grid"))
    failures.push("gallery page still renders replacement photo grid");
}

const aboutFile = requireBuiltFile("about/index.html");
if (fs.existsSync(aboutFile)) {
  const about = fs.readFileSync(aboutFile, "utf8");
  if (!about.includes("Zhang Boxiang") || !about.includes("Research interests"))
    failures.push("about page missing academic homepage");
  if (!about.includes("教育经历") || !about.includes("中国科学院大学"))
    failures.push("about page missing education section");
}

const sampleArticleFile = requireBuiltFile(
  "blog/wechat-miniapp-security-audit/index.html",
);
if (fs.existsSync(sampleArticleFile)) {
  const article = fs.readFileSync(sampleArticleFile, "utf8");
  for (const marker of ["本文目录", "本文概览", "等 6 个标签", "分享"]) {
    if (!article.includes(marker))
      failures.push(`post detail missing: ${marker}`);
  }
  if (!article.includes('href="https://github.com/bx33661/WxLocated"')) {
    failures.push("WxLocated article link is malformed");
  }
  if (article.includes("// contenido") || article.includes("Compartir")) {
    failures.push("post detail still contains mixed-language UI labels");
  }
}

for (const [relativePath, expected] of [
  ["blog/index.html", "POSTS / ARCHIVE"],
  ["notes/index.html", "NOTES / INDEX"],
  ["notes/list/index.html", "NOTES / ARCHIVE"],
]) {
  const file = requireBuiltFile(relativePath);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes(expected) || !content.includes("entry-row")) {
    failures.push(`${relativePath} missing unified editorial list`);
  }
  if (content.includes("card-glow")) {
    failures.push(`${relativePath} still renders article cards`);
  }
}

const blogIndex = requireBuiltFile("blog/index.html");
if (fs.existsSync(blogIndex)) {
  const blog = fs.readFileSync(blogIndex, "utf8");
  if (!blog.includes('id="topics"') || !blog.includes("按主题浏览")) {
    failures.push("blog index missing compact topic navigation");
  }
  if (!/href="\/blog\/tags\/[^"/]+\/"/.test(blog)) {
    failures.push("blog topic navigation missing tag detail links");
  }
  if (/class="nav-link[^" ]*"[^>]*>Tags</.test(blog)) {
    failures.push("Tags still appears in primary navigation");
  }
}

const blogTagsIndex = requireBuiltFile("blog/tags/index.html");
if (fs.existsSync(blogTagsIndex)) {
  const content = fs.readFileSync(blogTagsIndex, "utf8");
  if (!content.includes("/blog/#topics") || content.includes("tag-cloud")) {
    failures.push("old tag overview does not redirect to blog topics");
  }
}

const sampleTagDetail = requireBuiltFile("blog/tags/ctf/index.html");
if (fs.existsSync(sampleTagDetail)) {
  const content = fs.readFileSync(sampleTagDetail, "utf8");
  if (
    !content.includes("主题：") ||
    !content.includes("与「CTF」相关的文章") ||
    !content.includes('href="/blog/#topics"')
  ) {
    failures.push("tag detail page missing localized filtering context");
  }
}

if (fs.existsSync(path.join(distDir, "fonts/crt"))) {
  failures.push("removed CRT fonts are still present in dist");
}
if (fs.existsSync(path.join(distDir, "projects"))) {
  failures.push("removed /projects/ route is still present in dist");
}
const sitemapFile = requireBuiltFile("sitemap.xml");
if (fs.existsSync(sitemapFile)) {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  if (sitemap.includes("/projects/"))
    failures.push("sitemap still lists removed projects pages");
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
  if (!content.includes("/blog/#topics")) {
    failures.push("legacy tags index does not redirect to blog topics");
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
    failures.push("dist/_headers CSP missing giscus.app / frame-src allowlist");
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

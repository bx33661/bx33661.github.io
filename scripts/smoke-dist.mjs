import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, "dist");
const failures = [];
const htmlCache = new Map();

if (!fs.existsSync(distDir)) {
  console.error("[FAIL] dist directory not found. Run build first.");
  process.exit(1);
}

const requireBuiltFile = (relativePath) => {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) failures.push(`missing built file: dist/${relativePath}`);
  return fullPath;
};

const readDistHtml = (relativePath) => {
  if (htmlCache.has(relativePath)) return htmlCache.get(relativePath);
  const fullPath = requireBuiltFile(relativePath);
  if (!fs.existsSync(fullPath)) {
    htmlCache.set(relativePath, null);
    return null;
  }
  const content = fs.readFileSync(fullPath, "utf8");
  htmlCache.set(relativePath, content);
  return content;
};

const assertMarkers = (content, markers, failurePrefix) => {
  for (const marker of markers) {
    if (!content.includes(marker)) failures.push(`${failurePrefix}: ${marker}`);
  }
};

for (const file of [
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
  "blog/cybergym-ai-security-agent-benchmark/02-dataset-metadata.png",
  "pagefind/pagefind.js",
]) {
  requireBuiltFile(file);
}

const home = readDistHtml("index.html");
if (home !== null) {
  if (!home.includes("--font-wotfard-native:") || !home.includes("--font-cartograph-native:"))
    failures.push("homepage missing locally served Astro Fonts API families");
  if (!/rel="preload" href="\/_astro\/fonts\/[^"]+\.woff2" as="font"/.test(home))
    failures.push("homepage missing local first-screen font preload");
  if (/rel="preload"[^>]*href="\/touxiang-512\.png"/.test(home))
    failures.push("homepage preloads an unused 512px avatar");
  assertMarkers(
    home,
    [
      "Hey, I'm",
      "Welcome to my blog!",
      "Cybersecurity and Large Language Models (LLMs)",
      "This is my little corner of the internet",
      "I don't expect every post",
      "I hope this blog becomes a space",
      "Feel free to look around!",
      "Let's explore the stars and beyond together.",
      "Education",
      "Hainan University",
      "University of Chinese Academy of Sciences",
      "UCAS",
      "HNU",
      "Bachelor's studies in Information Security",
      "Master's studies",
      "/schools/ucas-emblem.webp",
      "/schools/hainan-university-emblem.webp",
      'lang="en"',
      'aria-labelledby="education-title"',
    ],
    "personal homepage missing",
  );
  for (const href of ["/blog/", "/notes/", "https://github.com/bx33661"]) {
    if (!home.includes(`href="${href}"`)) failures.push(`personal homepage missing entry: ${href}`);
  }
  const homeMain = home.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "";
  for (const removed of [
    "Zhang Boxiang",
    "张博翔",
    "Research interests",
    "Selected work",
    "Honors &amp; awards",
    "Recent updates",
    "2023",
    "2027",
    "mailto:",
    "research-proof",
    "awards-list",
    "18768921736",
    "bx33661@qq.com",
  ]) {
    if (homeMain.includes(removed)) failures.push(`personal homepage retains removed content: ${removed}`);
  }
  if (!home.includes("bx · Cybersecurity, LLMs &amp; Personal Notes"))
    failures.push("personal homepage missing updated title");
}

const cyberGym = readDistHtml("blog/cybergym-ai-security-agent-benchmark/index.html");
if (cyberGym !== null) {
  if (!/<picture><source[^>]+cybergym-dataset-metadata[^>]+\.webp/.test(cyberGym))
    failures.push("CyberGym article missing native responsive WebP source");
  if (!/<img[^>]+cybergym-dataset-metadata[^>]+loading="lazy"/.test(cyberGym))
    failures.push("CyberGym article missing lazy fallback image");
}

for (const [article, image, folder] of [
  ["blog/k8x9w2m7/index.html", "01-profile-bypass-flow", "l3hctf-best-profile"],
  ["blog/wechat-miniapp-security-audit/index.html", "08-xcode-development-ui", "miniapp-audit"],
  ["blog/wechat-miniapp-security-audit/index.html", "13-endpoints-parameters-analysis", "miniapp-audit"],
]) {
  const html = readDistHtml(article);
  if (html !== null) {
    if (!html.includes(`${image}-800.webp 800w`) || !html.includes(`${image}-1600.webp 1600w`))
      failures.push(`${article} missing responsive variants for ${image}`);
    if (!new RegExp(`<img[^>]*${image}\\.png[^>]*loading="(eager|lazy)"`).test(html))
      failures.push(`${article} missing image loading policy for ${image}`);
  }
  for (const width of [800, 1600]) requireBuiltFile(`blog/${folder}/${image}-${width}.webp`);
}

for (const [file, requiredMarkers, prefix, forbidden] of [
  [
    "friends/index.html",
    [
      "fp-featured-intro",
      "friend-blogs",
      "friend-hnusec",
      "friend-organizations",
      "fp-exchange",
      "fc-tag-row",
      "self-banner",
    ],
    "friends page missing",
    [],
  ],
  [
    "search/index.html",
    ["SEARCH / INDEX", "search-surface", "pagefind-search", "search-dialog", "modal-pagefind-search"],
    "search page missing",
    [
      ["sp-orb", "search still renders decorative effects"],
      ["sm-border-spin", "search still renders decorative effects"],
    ],
  ],
  [
    "archives/index.html",
    ["ARCHIVES / CHRONOLOGY", "year-index", "month-entries"],
    "archive page missing",
    [["arc-orb", "archive page still renders old decorative hero"]],
  ],
  [
    "galleries/index.html",
    ["gallery-fullscreen-container", "gallery-container", "查看原图", "峡谷双桥", "经幡穹顶"],
    "gallery page missing",
    [["photo-grid", "gallery page still renders replacement photo grid"]],
  ],
  [
    "about/index.html",
    [
      "Hey, I'm",
      "Cybersecurity and Large Language Models (LLMs)",
      "Education",
      "University of Chinese Academy of Sciences",
    ],
    "about alias missing",
    [],
  ],
  [
    "blog/wechat-miniapp-security-audit/index.html",
    ["本文目录", "本文概览", "等 6 个标签", "分享", 'href="https://github.com/bx33661/WxLocated"'],
    "post detail missing",
    [
      ["// contenido", "post detail still contains mixed-language UI labels"],
      ["Compartir", "post detail still contains mixed-language UI labels"],
    ],
  ],
  [
    "blog/tags/ctf/index.html",
    ["主题：", "与「CTF」相关的文章", 'href="/blog/#topics"'],
    "tag detail page missing localized filtering context",
    [],
  ],
]) {
  const html = readDistHtml(file);
  if (html === null) continue;
  assertMarkers(html, requiredMarkers, prefix);
  for (const [token, message] of forbidden) {
    if (html.includes(token)) failures.push(message);
  }
}

const friends = readDistHtml("friends/index.html");
if (friends !== null) {
  const friendLinks = friends.match(/aria-label="访问 [^"]+"/g) ?? [];
  if (friendLinks.length !== 20) failures.push(`friends page should preserve 20 links, found ${friendLinks.length}`);
}

for (const [relativePath, expected] of [
  ["blog/index.html", "POSTS / ARCHIVE"],
  ["notes/index.html", "NOTES / INDEX"],
  ["notes/list/index.html", "NOTES / ARCHIVE"],
]) {
  const content = readDistHtml(relativePath);
  if (content === null) continue;
  if (!content.includes(expected) || !content.includes("entry-row"))
    failures.push(`${relativePath} missing unified editorial list`);
  if (content.includes("card-glow")) failures.push(`${relativePath} still renders article cards`);
}

const blog = readDistHtml("blog/index.html");
if (blog !== null) {
  if (!blog.includes('id="topics"') || !blog.includes("按主题浏览"))
    failures.push("blog index missing compact topic navigation");
  if (!/href="\/blog\/tags\/[^"/]+\/"/.test(blog)) failures.push("blog topic navigation missing tag detail links");
  if (/class="nav-link[^" ]*"[^>]*>Tags</.test(blog)) failures.push("Tags still appears in primary navigation");
}

for (const name of fs.readdirSync(path.join(repoRoot, "src/data/notes"))) {
  if (!/\.mdx?$/.test(name)) continue;
  const source = fs.readFileSync(path.join(repoRoot, "src/data/notes", name), "utf8");
  const oldSlug = source.match(/^formerBlogSlug:\s*["']?([^\s"']+)["']?/m)?.[1];
  if (!oldSlug) continue;
  const newSlug = source.match(/^slug:\s*["']?([^\s"']+)["']?/m)?.[1];
  if (!newSlug) {
    failures.push(`moved note missing slug: ${name}`);
    continue;
  }
  requireBuiltFile(`notes/${newSlug}/index.html`);
  const html = readDistHtml(`blog/${oldSlug}/index.html`);
  if (html !== null && (!/http-equiv=["']refresh["']/i.test(html) || !html.includes(`/notes/${newSlug}/`)))
    failures.push(`moved blog URL does not redirect to note: ${oldSlug}`);
}

const blogTagsIndex = readDistHtml("blog/tags/index.html");
if (blogTagsIndex !== null && (!blogTagsIndex.includes("/blog/#topics") || blogTagsIndex.includes("tag-cloud")))
  failures.push("old tag overview does not redirect to blog topics");

if (fs.existsSync(path.join(distDir, "fonts/crt"))) failures.push("removed CRT fonts are still present in dist");
if (fs.existsSync(path.join(distDir, "projects"))) failures.push("removed /projects/ route is still present in dist");

const sitemap = readDistHtml("sitemap.xml");
if (sitemap !== null && sitemap.includes("/projects/")) failures.push("sitemap still lists removed projects pages");

const albumIndex = readDistHtml("album/index.html");
if (albumIndex !== null && !/\/galleries\/?/.test(albumIndex))
  failures.push("album index does not redirect to /galleries");

const tagsIndex = readDistHtml("tags/index.html");
if (tagsIndex !== null && !tagsIndex.includes("/blog/#topics"))
  failures.push("legacy tags index does not redirect to blog topics");

const tagsDir = path.join(distDir, "tags");
if (fs.existsSync(tagsDir)) {
  const tagDirs = fs.readdirSync(tagsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (tagDirs.length === 0) failures.push("no legacy tag redirect pages under dist/tags");
  else {
    const sample = path.join("tags", tagDirs[0].name, "index.html");
    const sampleContent = readDistHtml(sample);
    if (
      sampleContent !== null &&
      (!/http-equiv=["']refresh["']/i.test(sampleContent) || !/\/blog\/tags\//.test(sampleContent))
    )
      failures.push(`legacy tag redirect missing refresh to /blog/tags: ${path.join(distDir, sample)}`);
  }
}

const headers = readDistHtml("_headers");
if (headers !== null && (!/giscus\.app/.test(headers) || !/frame-src/.test(headers)))
  failures.push("dist/_headers CSP missing giscus.app / frame-src allowlist");

const galleriesIndex = readDistHtml("galleries/index.html");
if (galleriesIndex !== null && !/href="\/galleries\/[^"/]+\//.test(galleriesIndex))
  failures.push("galleries index does not contain any gallery detail links");

const galleriesDir = path.join(distDir, "galleries");
if (fs.existsSync(galleriesDir)) {
  const galleryDirs = fs.readdirSync(galleriesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (galleryDirs.length === 0) {
    failures.push("no gallery detail pages generated under dist/galleries");
  } else {
    const sample = path.join("galleries", galleryDirs[0].name, "index.html");
    const detailContent = readDistHtml(sample);
    if (detailContent !== null) {
      if (!/data-lightbox-trigger/.test(detailContent))
        failures.push(`gallery detail page missing lightbox triggers: ${path.join(distDir, sample)}`);
      if (!/\/_astro\//.test(detailContent))
        failures.push(`gallery detail page does not reference optimized Astro images: ${path.join(distDir, sample)}`);
    }
  }
} else {
  failures.push("dist/galleries directory missing");
}

console.log("Dist smoke check summary:");
console.log(`- Failures: ${failures.length}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`[FAIL] ${failure}`);
  process.exit(1);
}
console.log("[OK] dist smoke checks passed");

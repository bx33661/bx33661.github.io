import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const port = Number(process.env.I18N_PORT ?? 4341);
const base = `http://127.0.0.1:${port}`;
const output = path.join(root, ".visual-artifacts/i18n");
const fixture = process.env.I18N_FIXTURE === "1";
const designProperties = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "maxWidth", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderRadius"];
const designSelectors = ["#main-content", "main h1", ".header-glass", ".footer-wrapper", ".breadcrumb-bar"];
async function designFingerprint(page, selectors) {
  return page.evaluate(({ selectors, properties }) => Object.fromEntries(selectors.map((selector) => {
    const node = document.querySelector(selector);
    if (!node) return [selector, null];
    const css = getComputedStyle(node);
    return [selector, Object.fromEntries(properties.map((key) => [key, css[key]]))];
  })), { selectors, properties: designProperties });
}
const server = spawn(process.execPath, ["node_modules/astro/bin/astro.mjs", "preview", "--ignore-lock", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: root, env: { ...process.env, PUBLIC_ENABLE_ANALYTICS: "false", PUBLIC_ENABLE_COMMENTS: "false" }, stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (chunk) => serverLog += chunk);
server.stderr.on("data", (chunk) => serverLog += chunk);
let browser;
const passed = [];
try {
  await fs.mkdir(output, { recursive: true });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`${base}/en/`)).ok) { ready = true; break; } } catch { /* Startup */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, serverLog);
  const englishIndex = await (await fetch(`${base}/en/search.json`)).json();
  const rss = await (await fetch(`${base}/en/rss.xml`)).text();
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.match(rss, /<language>en<\/language>/);
  assert.ok(sitemap.includes("https://www.bx33661.com/en/"));
  assert.ok(!sitemap.includes("/en/search/"));
  const hasEnglishPosts = englishIndex.some((item) => item.href.startsWith("/en/blog/"));
  const hasEnglishNotes = englishIndex.some((item) => item.href.startsWith("/en/notes/"));
  const populated = englishIndex.length > 0;
  const probe = fixture ? englishIndex.find((item) => item.href === "/en/blog/i18n-fixture-post/") : englishIndex.find((item) => item.href.includes("websocket-handshake-message-replay-en")) ?? englishIndex[0];
  const query = fixture ? "I18NPROBE" : populated ? "WebSocket" : "CodeQL";
  if (!populated) {
    assert.deepEqual(englishIndex, []);
    assert.ok(!rss.includes("<item>"));
    for (const section of ["blog", "notes", "archives"]) assert.ok(!sitemap.includes(`/en/${section}/`));
  } else {
    if (fixture) assert.equal(englishIndex.length, 2);
    assert.ok(englishIndex.every((item) => item.href.startsWith("/en/")));
    if (fixture) assert.match(rss, /\/en\/blog\/i18n-fixture-post\//);
    else assert.ok(englishIndex.filter((entry) => entry.href.startsWith("/en/blog/")).every((entry) => rss.includes(entry.href)));
    if (hasEnglishPosts) assert.ok(sitemap.includes("/en/blog/") && sitemap.includes("/en/archives/"));
    assert.ok(!rss.includes("/en/notes/"));
  }
  passed.push("English JSON/RSS/sitemap language isolation");
  browser = await chromium.launch(process.platform === "darwin" ? { headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : { headless: true });
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport, colorScheme: theme });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const route of ["", "blog/", "notes/", "notes/list/", "archives/", "search/"]) {
        await page.goto(`${base}/${route}`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        const originalDesign = await designFingerprint(page, designSelectors);
        const response = await page.goto(`${base}/en/${route}`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
        await page.evaluate(() => document.fonts.ready);
        assert.deepEqual(await designFingerprint(page, designSelectors), originalDesign, `${name}/${theme}/${route}: must reuse original design`);
        assert.equal(await page.locator('[class*="english-"], .english-section-nav, .english-sidebar').count(), 0);
        const navLinks = await page.locator("#mobile-menu a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
        assert.ok(navLinks.includes("/friends/") && navLinks.includes("/galleries/"), "shared navigation resources stay available");
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), `https://www.bx33661.com/en/${route}`);
        assert.equal(await page.locator('link[type="application/rss+xml"]').getAttribute("href"), "https://www.bx33661.com/en/rss.xml");
        assert.equal(await page.locator('meta[property="og:locale"]').getAttribute("content"), "en_US");
        assert.ok(!(await page.locator(".footer-wrapper").innerText()).includes("保留所有权利"));
        assert.equal(await page.locator("h1").count(), 1);
        const emptySection = route.startsWith("notes/") ? !hasEnglishNotes : !hasEnglishPosts;
        if (route && emptySection && route !== "search/") assert.match(await page.locator("main").innerText(), /No English (posts|notes) yet/);
        if (route && (emptySection || route === "search/")) assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /^noindex/);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2), `${name}/${theme}/${route}: overflow`);
        if (route === "search/") {
          const input = page.locator("#pagefind-search input");
          await input.waitFor();
          await input.fill(query);
          if (!populated) {
            await page.locator("#pagefind-search .search-fallback-status").filter({ hasText: "No English articles" }).waitFor();
            assert.equal(await page.locator("#pagefind-search .search-fallback-link").count(), 0);
          } else {
            await page.locator(`#pagefind-search a[href="${probe.href}"]`).first().waitFor();
            assert.equal(await page.locator('#pagefind-search a[href^="/blog/"]').count(), 0);
          }
        }
        await page.screenshot({ path: path.join(output, `en-${route.replace(/\//g, "") || "home"}-${theme}-${name}.png`), fullPage: true });
      }
      // Navigation must carry locale through Astro's client router.
      await page.goto(`${base}/blog/codeql-learning/`, { waitUntil: "domcontentloaded" });
      assert.equal(await page.locator('link[hreflang="en"]').count(), 0);
      await page.locator("[data-language-switch]").click();
      await page.waitForURL("**/en/blog/");
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      if (name === "mobile") {
        await page.locator("#menu-btn").click();
        await page.locator('#mobile-menu a[href="/en/notes/"]').click();
        await page.waitForURL("**/en/notes/");
        assert.equal(await page.locator("#menu-btn").getAttribute("aria-expanded"), "false");
      }
      await page.keyboard.press("Control+k");
      const modal = page.locator("#search-modal");
      await modal.locator("input").waitFor();
      assert.equal(await page.locator("#search-dialog-title").innerText(), "Search English content");
      await modal.locator("input").fill(query);
      if (!populated) assert.match(await modal.innerText(), /No English articles/);
      else await modal.locator(`a[href="${probe.href}"]`).first().waitFor();
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("#search-modal").open);
      await page.locator("[data-language-switch]").click();
      await page.waitForURL(`${base}${name === "mobile" ? "/notes/" : "/blog/"}`);
      assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
      // Same browser session: Chinese -> English -> Chinese search still works.
      await page.goto(`${base}/search/`, { waitUntil: "domcontentloaded" });
      await page.locator("#pagefind-search input").fill("CodeQL");
      await page.locator('#pagefind-search a[href="/blog/codeql-learning/"]').first().waitFor();
      await page.locator("[data-language-switch]").click();
      await page.waitForURL("**/en/search/");
      await page.locator("#pagefind-search input").fill(query);
      if (!populated) assert.match(await page.locator("#pagefind-search").innerText(), /No English articles/);
      else await page.locator(`#pagefind-search a[href="${probe.href}"]`).first().waitFor();
      await page.locator("[data-language-switch]").click();
      await page.waitForURL(`${base}/search/`);
      await page.locator("#pagefind-search input").fill("CodeQL");
      await page.locator('#pagefind-search a[href="/blog/codeql-learning/"]').first().waitFor();
      if (fixture) {
        await page.goto(`${base}/en/blog/i18n-fixture-post/`, { waitUntil: "domcontentloaded" });
        assert.match(await page.locator("article").innerText(), /I18NPROBE/);
        assert.equal(await page.locator(".post-page .post-header").count(), 1);
        assert.equal(await page.locator(".post-toc-inline").count(), 1);
        assert.match(await page.locator(".post-meta").innerText(), /Published/);
        await page.locator(".copy-code").first().waitFor();
        assert.equal(await page.locator(".copy-code").first().getAttribute("aria-label"), "Copy code");
        assert.equal(await page.locator('.post-toc-mobile-label').innerText(), "Contents");
        if (name === "mobile") {
          await page.locator("[data-post-toc-open]").click();
          assert.equal(await page.locator("#post-toc-dialog").evaluate((dialog) => dialog.open), true);
          await page.keyboard.press("Escape");
          await page.waitForFunction(() => !document.querySelector("#post-toc-dialog").open);
        }
        const readingDesign = await designFingerprint(page, [".post-page", ".post-title", ".post-description", "#article"]);
        await page.screenshot({ path: path.join(output, `en-article-${theme}-${name}.png`), fullPage: true });
        await page.goto(`${base}/blog/i18n-fixture-source/`, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        assert.deepEqual(await designFingerprint(page, [".post-page", ".post-title", ".post-description", "#article"]), readingDesign);
        await page.goto(`${base}/en/blog/i18n-fixture-post/`, { waitUntil: "domcontentloaded" });
        assert.equal(await page.locator('link[hreflang="zh-CN"]').getAttribute("href"), "https://www.bx33661.com/blog/i18n-fixture-source/");
        await page.locator("[data-language-switch]").click();
        await page.waitForURL("**/blog/i18n-fixture-source/");
        assert.equal(await page.locator('link[hreflang="en"]').getAttribute("href"), "https://www.bx33661.com/en/blog/i18n-fixture-post/");
        await page.goto(`${base}/en/notes/i18n-fixture-note/`, { waitUntil: "domcontentloaded" });
        assert.equal(await page.locator("[data-note-summary]").count(), 1);
        assert.equal(await page.locator('main a[href^="/notes/"]').count(), 0);
        assert.equal(await page.locator('[class*="english-"]').count(), 0);
        await page.screenshot({ path: path.join(output, `en-note-${theme}-${name}.png`), fullPage: true });
        await page.goto(`${base}/en/archives/`, { waitUntil: "domcontentloaded" });
        assert.equal(await page.locator(".year-section h2").first().innerText(), "2020");
        await page.locator('.month-entries a[href="/en/blog/i18n-fixture-post/"]').click();
        await page.waitForURL("**/en/blog/i18n-fixture-post/");
      }
      assert.deepEqual(errors, [], `${name}/${theme}: browser errors`);
      passed.push(`${name}/${theme}: 6 shared routes with original-design parity, language switch, modal, search round-trip, overflow`);
      await context.close();
    }
  }
  const report = `PASS: ${passed.join("\nPASS: ")}\nPASS: ${fixture ? "fixture" : populated ? "published" : "empty"} English content; ${fixture ? 32 : 24} screenshots\n`;
  await fs.writeFile(path.join(output, "report.txt"), report);
  console.log(report.trim());
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const port = Number(process.env.ENGLISH_PORT ?? 4346);
const base = (process.env.ENGLISH_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, "");
const output = path.resolve(process.env.ENGLISH_SCREENSHOTS ?? ".visual-artifacts/english-publication");
const corpus = JSON.parse(await fs.readFile(new URL('./english-corpus.json', import.meta.url)));
const blogCount = corpus.filter(p => p.source.startsWith('src/content/blog/')).length;
const slugs = ["websocket-handshake-message-replay", "openrasp-sql-detect-bypass", "cybergym-ai-security-agent-benchmark"];
let server; let browser;
const passed = [];
try {
  await fs.mkdir(output, { recursive: true });
  if (!process.env.ENGLISH_BASE_URL) {
    server = spawn(process.execPath, ["node_modules/astro/bin/astro.mjs", "preview", "--ignore-lock", "--host", "127.0.0.1", "--port", String(port)], { stdio: "ignore" });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`${base}/en/blog/`)).ok) { ready = true; break; } } catch { /* startup */ }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(ready, "Production preview starts");
  }
  const rss = await (await fetch(`${base}/en/rss.xml`)).text();
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.equal((rss.match(/<item>/g) ?? []).length, blogCount);
  for (const slug of slugs) {
    assert.ok(rss.includes(`/en/blog/${slug}-en/`));
    assert.ok(sitemap.includes(`/en/blog/${slug}-en/`));
  }
  passed.push(`${blogCount} English RSS items and sitemap entries; original article paths retained`);
  browser = await chromium.launch(process.platform === "darwin" ? { headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : { headless: true });
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport, colorScheme: theme });
      const page = await context.newPage(); const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const res = await page.goto(`${base}/en/blog/`, { waitUntil: "domcontentloaded" });
      assert.equal(res.status(), 200);
      assert.ok(await page.locator(".entry-row").count() > 0);
      assert.equal(await page.locator("[data-content-empty]").count(), 0);
      assert.equal(await page.locator('[class*="english-"]').count(), 0);
      await page.screenshot({ path: path.join(output, `list-${name}-${theme}.png`), fullPage: true });
      for (const slug of slugs) {
        const enPath = `/en/blog/${slug}-en/`; const zhPath = `/blog/${slug}/`;
        const response = await page.goto(`${base}${enPath}`, { waitUntil: "domcontentloaded" });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        assert.equal(await page.locator(".post-page #article").count(), 1);
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(await page.locator('meta[name="robots"][content^="noindex"]').count(), 0);
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        assert.equal(new URL(canonical).pathname, enPath);
        assert.equal(new URL(await page.locator('link[hreflang="zh-CN"]').getAttribute("href")).pathname, zhPath);
        assert.equal(new URL(await page.locator('[data-language-switch]').getAttribute("href"), base).pathname, zhPath);
        assert.match(await page.locator(".post-meta").innerText(), /Published/);
        await page.locator(".copy-code").first().waitFor();
        assert.equal(await page.locator(".copy-code").first().getAttribute("aria-label"), "Copy code");
        const brokenImages = await page.locator("#article img").evaluateAll(async (images) => {
          const broken = [];
          for (const image of images) {
            image.loading = "eager";
            try { await image.decode(); if (!image.naturalWidth) broken.push(image.src); } catch { broken.push(image.src); }
          }
          return broken;
        });
        assert.deepEqual(brokenImages, [], `${slug}: all shared illustrations decode`);
        if (slug.startsWith("cybergym")) {
          await page.locator('[data-cg-case="both"]').click();
          assert.equal(await page.locator('[data-cg-post]').innerText(), "Still crashes");
          await page.locator('[data-cg-case="none"]').press("Enter");
          assert.equal(await page.locator('[data-cg-pre]').innerText(), "Does not crash");
          await page.locator('[data-cg-case="target"]').click();
          assert.equal(await page.locator('[data-cg-pre]').innerText(), "Crashes");
          assert.equal(await page.locator('[data-cg-post]').innerText(), "No longer crashes");
        }
        if (name === "mobile") {
          await page.locator("[data-post-toc-open]").click();
          assert.equal(await page.locator('#post-toc-dialog-title').innerText(), "On this page");
          await page.keyboard.press("Escape");
          await page.waitForFunction(() => !document.querySelector("#post-toc-dialog").open);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2), `${slug}: no page overflow`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(output, `${slug}-${name}-${theme}.png`) });
        await page.locator('[data-language-switch]').click();
        await page.waitForURL(`${base}${zhPath}`);
        assert.equal(await page.locator("html").getAttribute("lang"), "zh-CN");
        assert.equal(new URL(await page.locator('link[hreflang="en"]').getAttribute("href")).pathname, enPath);
        await page.locator('[data-language-switch]').click();
        await page.waitForURL(`${base}${enPath}`);
      }
      await page.goto(`${base}/en/search/`, { waitUntil: "domcontentloaded" });
      await page.locator('#pagefind-search input').fill("WebSocket");
      const result = page.locator('#pagefind-search a[href="/en/blog/websocket-handshake-message-replay-en/"]').first();
      await result.waitFor(); await result.click();
      await page.waitForURL("**/en/blog/websocket-handshake-message-replay-en/");
      assert.deepEqual(errors, [], `${name}/${theme}: page errors`);
      passed.push(`${name}/${theme}: 3 articles, 3 translation round trips, decoded images, TOC/copy controls, English oracle and actual search-result navigation`);
      await context.close();
    }
  }
  const report = `PASS: ${passed.join("\nPASS: ")}\nPASS: 3 original English regression articles; 16 screenshots\n`;
  await fs.writeFile(path.join(output, "report.txt"), report); console.log(report.trim());
} finally { await browser?.close(); server?.kill("SIGTERM"); }

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { checkArticleExperience } from "./article-experience-browser.mjs";
import { checkMarkdownReading } from "./markdown-reading-browser.mjs";

const root = process.cwd();
const output = path.join(root, ".visual-artifacts");
const port = Number(process.env.HARNESS_PORT ?? 4339);
const base = `http://127.0.0.1:${port}`;
const routes = [
  ["home", "/"],
  ["friends", "/friends/"],
  ["article", "/blog/codeql-learning/"],
  ["cybergym", "/blog/cybergym-ai-security-agent-benchmark/"],
  ["search", "/search/"],
  ["archive", "/archives/"],
  ["gallery", "/galleries/"],
];
const viewports = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];
const failures = [];
const passedFlows = [];
let serverOutput = "";
let serverExit = "running";
const server = spawn(process.execPath, ["node_modules/astro/bin/astro.mjs", "preview", "--ignore-lock", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: root,
  env: { ...process.env, PUBLIC_ENABLE_ANALYTICS: "false", PUBLIC_ENABLE_COMMENTS: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.on("exit", (code, signal) => { serverExit = `${code ?? "null"}/${signal ?? "none"}`; });

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (serverExit !== "running") throw new Error(`preview exited with ${serverExit}: ${serverOutput.slice(-500)}`);
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview did not start at ${base}`);
};

const stopServer = () => {
  if (!server.pid) return;
  try {
    server.kill("SIGTERM");
  } catch { /* Already stopped. */ }
};

try {
  await fs.mkdir(output, { recursive: true });
  await waitForServer();
  const launchOptions = process.platform === "darwin"
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }
    : {};
  const browser = await chromium.launch({ headless: true, ...launchOptions });
  try {
    for (const [viewportName, viewport] of viewports) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      const errors = [];
      const failuresBeforeViewport = failures.length;
      await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && message.location().url.startsWith(base)) errors.push(message.text());
      });
      await page.goto(base, { waitUntil: "domcontentloaded" });
      for (const theme of ["light", "dark"]) {
        for (const [name, route] of routes) {
          const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
          if (!response?.ok()) failures.push(`${viewportName}/${theme}/${name}: HTTP ${response?.status() ?? "none"}`);
          await page.evaluate(async (value) => {
            document.documentElement.dataset.theme = value;
            await document.fonts.ready;
          }, theme);
          const metrics = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            content: document.documentElement.scrollWidth,
            clippedHeadings: [...document.querySelectorAll("h1, h2, h3")]
              .filter((heading) => {
                const box = heading.getBoundingClientRect();
                const style = getComputedStyle(heading);
                return box.width > 10 && box.height > 10 && style.visibility !== "hidden" && !heading.classList.contains("sr-only") && heading.scrollWidth > heading.clientWidth + 2;
              })
              .map((heading) => heading.textContent?.trim().slice(0, 80)),
          }));
          if (metrics.content > metrics.viewport + 2)
            failures.push(`${viewportName}/${theme}/${name}: horizontal overflow ${metrics.content}>${metrics.viewport}`);
          if (metrics.clippedHeadings.length)
            failures.push(`${viewportName}/${theme}/${name}: clipped headings ${metrics.clippedHeadings.join(" | ")}`);
          await page.screenshot({ path: path.join(output, `${name}-${theme}-${viewportName}.png`), fullPage: true });
          if (name === "home") {
            const labels = await page.locator(".hero-aside, .education-section").allTextContents();
            if (!labels.join(" ").includes("Bachelor's Degree") || !labels.join(" ").includes("Master's Degree"))
              failures.push(`${viewportName}/${theme}/home: degree labels missing`);
            const contrast = await page.evaluate(() => {
              const element = document.querySelector(".home-section h2 span");
              if (!element) return 0;
              const rgb = (text) => text.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
              const light = (values) => values.map((value) => {
                const channel = value / 255;
                return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
              }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
              const foreground = light(rgb(getComputedStyle(element).color));
              const background = light(rgb(getComputedStyle(document.body).backgroundColor));
              return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
            });
            if (contrast < 4.5) failures.push(`${viewportName}/${theme}/home: secondary text contrast ${contrast.toFixed(2)}:1`);
            const position = await page.locator(".research-proof").boundingBox();
            if (viewportName === "mobile" && position && position.y > 844)
              failures.push(`mobile/${theme}/home: featured research starts at ${Math.round(position.y)}px`);
          }
          if (name === "article") {
            try {
              await checkArticleExperience(page, { base, output, prefix: `${theme}-${viewportName}` });
              await checkMarkdownReading(page, { base, output, prefix: `${theme}-${viewportName}` });
              const label = `${viewportName}/${theme}/article-experience`;
              passedFlows.push(label, `${viewportName}/${theme}/markdown-reading`);
              console.log(`[OK] browser flow: ${label}`);
            } catch (error) {
              failures.push(`${viewportName}/${theme}/article-experience: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          if (name === "friends") {
            const cards = await page.locator("a.fc").count();
            if (cards !== 20) failures.push(`${viewportName}/${theme}/friends: expected 20 cards, found ${cards}`);
            const categories = await page.locator(".fp-index a").count();
            if (categories !== 3) failures.push(`${viewportName}/${theme}/friends: expected 3 directory categories, found ${categories}`);
          }
          if (name === "cybergym") {
            const image = page.locator('picture img[alt="CyberGym 数据集中的任务元数据和不同等级的文件"]');
            if (await image.count() !== 1) failures.push(`${viewportName}/${theme}/cybergym: native picture missing`);
            else {
              await image.scrollIntoViewIfNeeded();
              const loaded = await image.evaluate(async (element) => {
                try { await element.decode(); return element.naturalWidth > 0; }
                catch { return false; }
              });
              if (!loaded) failures.push(`${viewportName}/${theme}/cybergym: image failed to decode`);
            }
          }
        }
      }
      if (errors.length) failures.push(`${viewportName}: browser errors: ${errors.join(" | ")}`);
      if (failures.length > failuresBeforeViewport)
        await page.context().tracing.stop({ path: path.join(output, `trace-${viewportName}.zip`) });
      else await page.context().tracing.stop();
      await page.close();
    }
    const page = await browser.newPage();
    await page.goto(base);
    const before = await page.locator("html").getAttribute("data-theme");
    await page.locator("#theme-btn").click();
    const after = await page.locator("html").getAttribute("data-theme");
    if (before === after) failures.push("theme toggle did not change data-theme");
    await page.close();
  } finally {
    await browser.close();
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  if (serverExit !== "running") failures.push(`preview exit=${serverExit}: ${serverOutput.slice(-500)}`);
} finally {
  stopServer();
}

await fs.writeFile(path.join(output, "report.txt"), `${failures.length ? failures.join("\n") : "PASS: 28 route/theme/viewport screenshots; 8 article/markdown browser flows; contrast, overflow, headings, theme toggle"}\n`);
console.log(await fs.readFile(path.join(output, "report.txt"), "utf8"));
process.exitCode = failures.length ? 1 : 0;

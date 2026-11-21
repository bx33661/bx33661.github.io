import fs from "node:fs/promises";
import path from "node:path";

import { checkArticleExperience } from "./article-experience-browser.mjs";
import { checkCodeHardening, checkStorageAndSearchBoundaries } from "./code-hardening-browser.mjs";
import {
  THEMES,
  VIEWPORTS,
  launchBrowser,
  measureHorizontalOverflow,
  withPreviewServer,
} from "./lib/browser-harness.mjs";
import { checkMarkdownReading } from "./markdown-reading-browser.mjs";
import { checkReadingMotion } from "./reading-motion-browser.mjs";

const root = process.cwd();
const output = path.join(root, ".visual-artifacts");
const port = Number(process.env.HARNESS_PORT ?? 4339);
const routes = [
  ["home", "/"],
  ["friends", "/friends/"],
  ["article", "/blog/codeql-learning/"],
  ["cybergym", "/blog/cybergym-ai-security-agent-benchmark/"],
  ["search", "/search/"],
  ["archive", "/archives/"],
  ["gallery", "/galleries/"],
];

const failures = [];
const passedFlows = [];

async function checkHomePage(page, base, labelPrefix) {
  const labels = await page.locator(".education-section").allTextContents();
  if (
    !labels.join(" ").includes("Bachelor's studies in Information Security") ||
    !labels.join(" ").includes("Master's studies")
  ) {
    failures.push(`${labelPrefix}: degree labels missing`);
  }

  const contrast = await page.evaluate(() => {
    const element = document.querySelector(".intro-prose");
    if (!element) return 0;
    const rgb = (text) =>
      text
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number) ?? [0, 0, 0];
    const light = (values) =>
      values
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = light(rgb(getComputedStyle(element).color));
    const background = light(rgb(getComputedStyle(document.body).backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  if (contrast < 4.5) failures.push(`${labelPrefix}: secondary text contrast ${contrast.toFixed(2)}:1`);
  if ((await page.locator(".intro-prose p").count()) !== 4)
    failures.push(`${labelPrefix}: introduction paragraphs missing`);
  if ((await page.locator(".education-list li").count()) !== 2)
    failures.push(`${labelPrefix}: expected two education entries`);

  for (const image of await page.locator(".education-list img").all()) {
    await image.scrollIntoViewIfNeeded();
    const ok = await image.evaluate(async (element) => {
      try {
        await element.decode();
        return element.naturalWidth > 0;
      } catch {
        return false;
      }
    });
    if (!ok) failures.push(`${labelPrefix}: school emblem failed to load`);
  }

  const mainText = await page.locator("main").innerText();
  if (/Zhang Boxiang|张博翔|2023|2027|Honors & awards|Research interests/.test(mainText)) {
    failures.push(`${labelPrefix}: removed resume content remains`);
  }
  await page.locator(".read-link").click();
  await page.waitForURL(`${base}/blog/`);
  await page.goBack();
  await page.locator(".academic-home").waitFor({ state: "visible" });
}

async function checkCyberGymPage(page, labelPrefix) {
  const image = page.locator('picture img[alt="CyberGym 数据集中的任务元数据和不同等级的文件"]');
  if ((await image.count()) !== 1) {
    failures.push(`${labelPrefix}: native picture missing`);
    return;
  }
  await image.scrollIntoViewIfNeeded();
  const loaded = await image.evaluate(async (element) => {
    try {
      await element.decode();
      return element.naturalWidth > 0;
    } catch {
      return false;
    }
  });
  if (!loaded) failures.push(`${labelPrefix}: image failed to decode`);
}

function flowsForRoute(name) {
  if (name === "article") {
    return [
      ["article-experience", checkArticleExperience],
      ["markdown-reading", checkMarkdownReading],
      ["reading-motion", checkReadingMotion],
    ];
  }
  if (name === "search") {
    return [["code-hardening", checkCodeHardening]];
  }
  return [];
}

await fs.mkdir(output, { recursive: true });

try {
  await withPreviewServer({ port, timeoutAttempts: 60 }, async ({ base }) => {
    const browser = await launchBrowser();
    try {
      for (const [viewportName, viewport] of VIEWPORTS) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
        const page = await context.newPage();
        const errors = [];
        const failuresBeforeViewport = failures.length;
        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error" && message.location().url.startsWith(base)) errors.push(message.text());
        });
        await page.goto(base, { waitUntil: "domcontentloaded" });

        for (const theme of THEMES) {
          for (const [name, route] of routes) {
            const labelPrefix = `${viewportName}/${theme}/${name}`;
            await page.evaluate((value) => localStorage.setItem("theme", value), theme);
            const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
            if (!response?.ok()) failures.push(`${labelPrefix}: HTTP ${response?.status() ?? "none"}`);
            await page.evaluate(async (value) => {
              document.documentElement.dataset.theme = value;
              localStorage.setItem("theme", value);
              await document.fonts.ready;
            }, theme);

            const overflow = await measureHorizontalOverflow(page);
            if (overflow.content > overflow.viewport + 2) {
              failures.push(`${labelPrefix}: horizontal overflow ${overflow.content}>${overflow.viewport}`);
            }

            const clippedHeadings = await page.evaluate(() =>
              [...document.querySelectorAll("h1, h2, h3")]
                .filter((heading) => {
                  const box = heading.getBoundingClientRect();
                  const style = getComputedStyle(heading);
                  return (
                    box.width > 10 &&
                    box.height > 10 &&
                    style.visibility !== "hidden" &&
                    !heading.classList.contains("sr-only") &&
                    heading.scrollWidth > heading.clientWidth + 2
                  );
                })
                .map((heading) => heading.textContent?.trim().slice(0, 80)),
            );
            if (clippedHeadings.length) {
              failures.push(`${labelPrefix}: clipped headings ${clippedHeadings.join(" | ")}`);
            }

            await page.screenshot({ path: path.join(output, `${name}-${theme}-${viewportName}.png`), fullPage: true });

            if (name === "home") await checkHomePage(page, base, labelPrefix);
            if (name === "friends") {
              const cards = await page.locator("a.fc").count();
              if (cards !== 20) failures.push(`${labelPrefix}: expected 20 cards, found ${cards}`);
              const categories = await page.locator(".fp-index a").count();
              if (categories !== 3)
                failures.push(`${labelPrefix}: expected 3 directory categories, found ${categories}`);
            }
            if (name === "cybergym") await checkCyberGymPage(page, labelPrefix);

            for (const [flowName, check] of flowsForRoute(name)) {
              const label = `${viewportName}/${theme}/${flowName}`;
              try {
                await check(page, { base, output, prefix: `${theme}-${viewportName}` });
                passedFlows.push(label);
                console.log(`[OK] browser flow: ${label}`);
              } catch (error) {
                failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
                await page.screenshot({
                  path: path.join(output, `failure-${flowName}-${theme}-${viewportName}.png`),
                  fullPage: true,
                });
              }
            }
          }
        }

        if (errors.length) failures.push(`${viewportName}: browser errors: ${errors.join(" | ")}`);
        if (failures.length > failuresBeforeViewport) {
          await page.context().tracing.stop({ path: path.join(output, `trace-${viewportName}.zip`) });
        } else {
          await page.context().tracing.stop();
        }
        await context.close();
      }

      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(base);
      const before = await page.locator("html").getAttribute("data-theme");
      await page.locator("#theme-btn").click();
      await page.waitForFunction((value) => document.documentElement.dataset.theme !== value, before);
      await page.waitForFunction(() => !document.documentElement.hasAttribute("data-theme-reveal"));
      const after = await page.locator("html").getAttribute("data-theme");
      if (before === after) failures.push("theme toggle did not change data-theme");
      await context.close();
      await checkStorageAndSearchBoundaries(browser, { base });
    } finally {
      await browser.close();
    }
  });
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

const summary = `PASS: ${routes.length * VIEWPORTS.length * 2} route/theme/viewport screenshots; ${passedFlows.length} browser flows; contrast, overflow, headings, theme toggle`;
await fs.writeFile(
  path.join(output, "report.txt"),
  `${failures.length ? failures.join("\n") : summary}\n${passedFlows.map((flow) => `[OK] ${flow}`).join("\n")}\n`,
);
console.log(await fs.readFile(path.join(output, "report.txt"), "utf8"));
process.exitCode = failures.length ? 1 : 0;

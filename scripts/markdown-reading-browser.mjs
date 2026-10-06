import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { articleMarkdown } from "../src/utils/articleMarkdown.ts";

const renderer = await articleMarkdown.processor.createRenderer({
  shikiConfig: articleMarkdown.shikiConfig,
  syntaxHighlight: "shiki",
});
const source = await fs.readFile(
  new URL("./fixtures/markdown-reading.md", import.meta.url),
  "utf8",
);
const { code, metadata } = await renderer.render(source);

/** Synthetic fixture uses the production parser, stylesheet, layout and reader JS;
 * no test article, public route or search entry is created. */
export async function checkMarkdownReading(page, { base, output, prefix }) {
  await page.goto(`${base}/blog/openrasp-sql-detect-bypass/`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("#article .copy-code").first().waitFor();
  await page.evaluate(
    ({ code, headings }) => {
      document.querySelector("#article").innerHTML = code;
      document.querySelector(".post-title").textContent =
        "Markdown 格式适配回归样例";
      document.querySelector(".post-description").textContent =
        "公式、表格、嵌套列表、提示框、折叠内容和脚注。此页面仅存在于测试浏览器中。";
      for (const nav of document.querySelectorAll("[data-post-toc]")) {
        nav.replaceChildren();
        const list = document.createElement("ol");
        for (const heading of headings.filter(
          (h) => h.depth <= 3 && h.slug !== "footnote-label",
        )) {
          const item = document.createElement("li");
          if (heading.depth >= 3) item.className = "nested";
          const anchor = document.createElement("a");
          anchor.href = `#${heading.slug}`;
          anchor.textContent = heading.text;
          item.append(anchor);
          list.append(item);
        }
        nav.append(list);
      }
      document.dispatchEvent(new Event("astro:page-load"));
    },
    { code, headings: metadata.headings },
  );
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page.evaluate(() => document.fonts.check("16px KaTeX_Main")),
    true,
    "local math fonts loaded",
  );
  assert.equal(await page.locator("#article .katex-error").count(), 0);
  assert(
    (await page.locator("#article math").count()) >= 6,
    "accessible MathML retained",
  );
  assert.equal(
    await page
      .locator(
        "[data-format-island] .copy-code, [data-format-island] .article-table-scroll",
      )
      .count(),
    0,
    "component-owned content remains untouched",
  );
  // Quiet typography keeps structure without turning every element into a card.
  const quietStyles = await page.evaluate(() => {
    const style = (selector) =>
      getComputedStyle(document.querySelector(selector));
    const inline = style("#article p > code");
    const math = style("#article .article-math-block");
    const table = style("#article .article-table-scroll");
    const cells = [
      ...document.querySelectorAll(".article-table-scroll :is(th, td)"),
    ];
    return {
      inlineBorder: inline.borderWidth,
      mathBackground: math.backgroundColor,
      mathBorder: math.borderWidth,
      tableBorder: table.borderWidth,
      verticalBorders: cells.map((cell) => {
        const css = getComputedStyle(cell);
        return [css.borderLeftWidth, css.borderRightWidth];
      }),
      horizontalBorders: cells.map(
        (cell) => getComputedStyle(cell).borderBottomWidth,
      ),
    };
  });
  assert.equal(quietStyles.inlineBorder, "0px");
  assert.equal(quietStyles.mathBackground, "rgba(0, 0, 0, 0)");
  assert.equal(quietStyles.mathBorder, "0px");
  assert.equal(quietStyles.tableBorder, "0px");
  assert(
    quietStyles.verticalBorders.every(
      ([left, right]) => left === "0px" && right === "0px",
    ),
  );
  assert(quietStyles.horizontalBorders.some((border) => border !== "0px"));

  const align = await page
    .locator(".article-table-scroll thead th")
    .evaluateAll((cells) =>
      cells.map((cell) => getComputedStyle(cell).textAlign),
    );
  assert.equal(align[2], "center");
  assert.equal(align[3], "right");
  const checked = await page
    .locator(".task-list-item input")
    .evaluateAll((inputs) =>
      inputs.map((input) => ({
        checked: input.checked,
        disabled: input.disabled,
      })),
    );
  assert.deepEqual(checked, [
    { checked: true, disabled: true },
    { checked: false, disabled: true },
    { checked: true, disabled: true },
  ]);
  await page.screenshot({
    path: path.join(output, `markdown-overview-${prefix}.png`),
  });

  const assertNoOverflow = async () => {
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      width: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    assert(
      metrics.width <= metrics.viewport + 2 &&
        metrics.body <= metrics.viewport + 2,
      `Markdown page overflow: ${JSON.stringify(metrics)}`,
    );
  };
  await assertNoOverflow();
  const math = page.locator("#article .article-math-block").last();
  await math.scrollIntoViewIfNeeded();
  const geometry = await math.evaluate((node) => ({
    width: node.clientWidth,
    scroll: node.scrollWidth,
    tab: node.tabIndex,
  }));
  assert(
    geometry.scroll > geometry.width,
    "long formula has its own scroll region",
  );
  assert.equal(geometry.tab, 0);
  await math.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".article-math-block")].at(-1).scrollLeft >
      0,
  );
  await math.evaluate((node) => {
    node.scrollLeft = 0;
  });
  await page.screenshot({
    path: path.join(output, `markdown-math-${prefix}.png`),
  });
  if ((page.viewportSize()?.width ?? 0) < 1200) {
    assert(
      (await page
        .locator(".article-inline-math")
        .evaluateAll(
          (nodes) =>
            nodes.filter((node) => node.scrollWidth > node.clientWidth + 2)
              .length,
        )) > 0,
      "long inline math scrolls locally",
    );
    const table = page.locator(".article-table-scroll").first();
    await table.scrollIntoViewIfNeeded();
    assert.equal(
      await table.evaluate((node) => node.scrollWidth > node.clientWidth),
      true,
    );
    await table.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () => document.querySelector(".article-table-scroll").scrollLeft > 0,
    );
    await table.evaluate((node) => {
      node.scrollLeft = 0;
    });
    await page.screenshot({
      path: path.join(output, `markdown-table-${prefix}.png`),
    });
    const original = page.viewportSize();
    await page.setViewportSize({ width: 320, height: 844 });
    await assertNoOverflow();
    await math.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, `markdown-narrow-${prefix}.png`),
    });
    await page.setViewportSize(original);
  }
  const details = page.locator("#article details");
  const summary = details.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  assert.equal(await details.evaluate((node) => node.open), true);
  assert.equal(
    await details.locator("p").first().isVisible(),
    true,
    "ordinary disclosure paragraphs are not hidden",
  );
  assert.equal(
    await details
      .locator("[data-format-raw-table]")
      .evaluate(
        (table) =>
          table.parentElement.classList.contains("article-table-scroll") &&
          table.parentElement.tabIndex === 0,
      ),
    true,
    "raw HTML table has the same keyboard region",
  );
  assert.equal(
    await details
      .locator("p")
      .first()
      .evaluate((node) => getComputedStyle(node).userSelect),
    "text",
  );
  const codeBlock = page.locator("#article pre.astro-code").first();
  const expected = await codeBlock.locator("code").innerText();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await codeBlock.locator(".copy-code").click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    expected,
  );
  await codeBlock.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(output, `markdown-code-${prefix}.png`),
  });
  await details.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(output, `markdown-details-${prefix}.png`),
  });

  const ref = page.locator("[data-footnote-ref]").first();
  assert(
    (await ref.evaluate((node) =>
      parseFloat(getComputedStyle(node).scrollMarginTop),
    )) >= 90,
    "footnote return target clears the fixed header",
  );
  await ref.click();
  await page.waitForFunction(
    () =>
      location.hash === "#user-content-fn-note" &&
      document.getElementById("user-content-fn-note").getBoundingClientRect()
        .top < 200,
  );
  const back = page.locator("[data-footnote-backref]");
  await back.click();
  await page.waitForFunction(
    () =>
      location.hash === "#user-content-fnref-note" &&
      Math.abs(
        document
          .getElementById("user-content-fnref-note")
          .getBoundingClientRect().top - 96,
      ) < 3,
  );
  await assertNoOverflow();
  const image = page.locator("#article .article-image-trigger");
  await image.click();
  await page.locator("#article-lightbox").waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await page.locator("#article-lightbox").waitFor({ state: "hidden" });
  assert.equal(
    await image.evaluate((node) => node === document.activeElement),
    true,
  );

  // Check the real article after the synthetic fixture, not just the fixture DOM.
  await page.goto(`${base}/blog/openrasp-sql-detect-bypass/`, {
    waitUntil: "domcontentloaded",
  });
  await assertNoOverflow();
  assert.match(await page.locator(".post-title").innerText(), /RASP/);
}

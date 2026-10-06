import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import { articleMarkdown } from "../src/utils/articleMarkdown.ts";
import { rehypeArticleFormatting } from "../src/utils/rehypeArticleFormatting.ts";

const shared = {
  shikiConfig: articleMarkdown.shikiConfig,
  syntaxHighlight: "shiki",
};
const renderer = await articleMarkdown.processor.createRenderer(shared);
const source = await fs.readFile(
  new URL("./fixtures/markdown-reading.md", import.meta.url),
  "utf8",
);
const fixture = await renderer.render(source);

test("production Markdown pipeline renders accessible inline/display TeX, matrices and escaped literals", () => {
  assert.match(fixture.code, /class="article-inline-math"/);
  assert.match(fixture.code, /class="article-math-block"/);
  assert.match(
    fixture.code,
    /<math xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML"/,
  );
  assert.match(fixture.code, /encoding="application\/x-tex"/);
  assert.match(fixture.code, /aria-hidden="true"/);
  assert.match(fixture.code, /\$99/);
  assert.match(fixture.code, /<code>\$x\+y\$<\/code>/);
  assert.doesNotMatch(fixture.code, /katex-error/);
  assert.equal(
    (fixture.code.match(/class="article-math-block"/g) ?? []).length,
    4,
  );
});

test("GFM tables retain headers/alignment, tasks and text semantics", () => {
  assert.match(
    fixture.code,
    /class="article-table-scroll" tabindex="0" role="region"/,
  );
  assert.match(fixture.code, /<thead>/);
  assert.match(fixture.code, /align="center"/);
  assert.match(fixture.code, /align="right"/);
  assert.match(fixture.code, /type="checkbox" checked disabled/);
  assert.match(fixture.code, /type="checkbox" disabled/);
  for (const tag of [
    "strong",
    "em",
    "del",
    "ul",
    "ol",
    "h5",
    "h6",
    "sub",
    "sup",
    "kbd",
    "dl",
    "dt",
    "dd",
    "details",
    "summary",
  ]) {
    assert.match(fixture.code, new RegExp(`<${tag}(?: |>).*?`, "s"));
  }
  assert.doesNotMatch(fixture.code, /<h1\b/);
  assert.match(fixture.code, /https:\/\/example.com/);
});

test("fences retain Shiki themes, file labels, highlight and no-language text", () => {
  assert.match(fixture.code, /astro-code/);
  assert.match(fixture.code, /--shiki-light/);
  assert.match(fixture.code, /--shiki-dark/);
  assert.match(fixture.code, /example.ts/);
  assert.match(fixture.code, /line highlighted/);
  assert.match(fixture.code, /未指定语言的围栏代码/);
});

test("footnotes retain stable reference/backlinks and Chinese accessible labels", () => {
  assert.match(fixture.code, /data-footnotes/);
  assert.match(fixture.code, /id="footnote-label"[^>]*>注释/);
  assert.match(fixture.code, /data-footnote-backref[^>]*aria-label="返回正文"/);
  assert.match(fixture.code, /href="#user-content-fn-note"/);
  assert.match(fixture.code, /href="#user-content-fnref-note"/);
});

test("callouts render five distinct labels without rewriting ordinary quotes", async () => {
  for (const [kind, label] of Object.entries({
    note: "说明",
    tip: "提示",
    important: "重要",
    warning: "注意",
    caution: "警告",
  })) {
    assert.match(fixture.code, new RegExp(`data-callout="${kind}"`));
    assert.match(
      fixture.code,
      new RegExp(`class="article-callout-title">${label}`),
    );
  }
  const ordinary = await renderer.render(
    "> 普通引用提到 [!NOTE] 但不是提示框。\n\n> [!UNKNOWN]\n> 原样保留",
  );
  assert.doesNotMatch(ordinary.code, /data-callout/);
  assert.match(ordinary.code, /\[!UNKNOWN\]/);
});

test("format wrapping is idempotent and skips component-owned regions", () => {
  const table = () => ({
    type: "element",
    tagName: "table",
    properties: {},
    children: [],
  });
  const island = {
    type: "element",
    tagName: "div",
    properties: { className: ["not-prose"] },
    children: [table()],
  };
  const math = {
    type: "element",
    tagName: "span",
    properties: { className: ["katex-display"] },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["katex"] },
        children: [],
      },
    ],
  };
  const tree = { type: "root", children: [table(), math, island] };
  const format = rehypeArticleFormatting();
  format(tree);
  const once = JSON.stringify(tree);
  format(tree);
  assert.equal(JSON.stringify(tree), once);
  assert.equal(island.children[0].tagName, "table");
  assert.equal(
    tree.children[1].children[0].children[0].properties.className[0],
    "katex",
  );
});

test("invalid/unsupported TeX stays readable rather than becoming blank", async () => {
  const result = await renderer.render("$\\unknownMacro{x}$");
  assert.match(result.code, /unknownMacro/);
  const malformed = await renderer.render("$\\frac{1}{x$");
  assert.match(malformed.code, /katex-error/);
  assert.match(malformed.code, /frac/);
});

test("the same production processor applies math, tables, alerts and footnotes to MDX", async () => {
  const mdx = await articleMarkdown.processor.createMdxRenderer(shared, {
    optimize: false,
  });
  const result = await mdx.process(
    '## MDX\n\n行内 $x^2$。\n\n$$\n\\frac{1}{2}\n$$\n\n|A|B|\n|-|-|\n|1|2|\n\n> [!TIP]\n> MDX 提示\n\n正文[^a]\n\n[^a]: MDX 注释\n\n<div className="not-prose"><button>自有控件</button></div>',
    "/format-fixture.mdx",
    {},
  );
  for (const marker of [
    "article-inline-math",
    "article-math-block",
    "article-table-scroll",
    "article-callout",
    "footnote-label",
    "自有控件",
  ])
    assert(result.code.includes(marker), marker);
});

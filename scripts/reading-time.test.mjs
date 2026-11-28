import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanArticleMarkdownForCopy,
  countReadingWords,
  estimateReadingMinutes,
  isInteractivePost,
} from "../src/utils/readingTime.ts";
import { transformerLongCode } from "../src/utils/transformers/longCode.ts";

test("countReadingWords and cleanArticleMarkdownForCopy strip frontmatter, imports, and link URLs cleanly", () => {
  assert.equal(countReadingWords(undefined), 0);
  assert.equal(countReadingWords("---\ntitle: Demo\n---\nimport Box from './Box.astro';\n\n你好 [Pinwhy](https://example.com) world!"), 4);

  const md = cleanArticleMarkdownForCopy(
    "Pinwhy Guide",
    "https://www.bx33661.com/blog/introducing-pinwhy/",
    "---\ntitle: Pinwhy\n---\nimport Foo from '@/components/Foo.astro';\n\n\n## Intro\n\nBody `<script>` safe.",
  );
  assert.match(md, /^# Pinwhy Guide\n\n> Source: https:\/\/www\.bx33661\.com\/blog\/introducing-pinwhy\/\n\n## Intro/);
  assert.doesNotMatch(md, /import Foo/);
  assert.match(md, /Body `<script>` safe\./);
});

test("estimateReadingMinutes handles empty, short, CJK, English and mixed content", () => {
  assert.equal(estimateReadingMinutes(undefined), 1);
  assert.equal(estimateReadingMinutes(""), 1);
  assert.equal(estimateReadingMinutes("---\ntitle: Demo\n---\nHello world."), 1);

  const cjk = "系统工程与架构设计笔记。".repeat(60);
  assert.equal(estimateReadingMinutes(cjk), 2);

  const english = "software engineering reproducible notes ".repeat(110);
  assert.equal(estimateReadingMinutes(english), 2);

  const mixed = `${"系统架构实践".repeat(60)}\n\n\`\`\`ts\n${"const token = value; ".repeat(60)}\n\`\`\``;
  assert.ok(estimateReadingMinutes(mixed) >= 2);
});

test("isInteractivePost detects hydrated interactive MDX islands", () => {
  assert.equal(isInteractivePost(undefined), false);
  assert.equal(isInteractivePost("Regular markdown article with code blocks."), false);
  assert.equal(isInteractivePost("<DemoChart client:visible />"), true);
  assert.equal(isInteractivePost("<Playground client:load />"), true);
});

test("transformerLongCode tags only blocks meeting minLines with metadata", () => {
  const transformer = transformerLongCode(36);
  const shortNode = { type: "element", tagName: "pre", properties: {}, children: [] };
  transformer.pre.call({ source: "const a = 1;\n".repeat(12) }, shortNode);
  assert.equal(shortNode.properties["data-code-collapsible"], undefined);
  assert.equal(shortNode.properties["data-code-lines"], undefined);

  const longNode = { type: "element", tagName: "pre", properties: {}, children: [] };
  transformer.pre.call({ source: "const line = true;\n".repeat(42) }, longNode);
  assert.equal(longNode.properties["data-code-collapsible"], "true");
  assert.equal(longNode.properties["data-code-lines"], "42");
});

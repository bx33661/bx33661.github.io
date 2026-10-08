import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

test("article descriptions feed metadata and BlogPosting structured data", () => {
  const layout = fs.readFileSync("src/layouts/Layout.astro", "utf8");
  const post = fs.readFileSync("src/layouts/PostDetails.astro", "utf8");
  assert.match(layout, /headline: `\$\{title\}`,\s*description,/);
  assert.match(layout, /name="description" content=\{description\}/);
  assert.match(layout, /property="og:description" content=\{description\}/);
  assert.match(post, /class="post-description">\{description\}/);
});

test("note summaries are visible before article content and use the same metadata", () => {
  const note = fs.readFileSync("src/pages/notes/[...id].astro", "utf8");
  assert.match(note, /description=\{note\.data\.description\}/);
  assert.match(note, /data-note-summary>\{note\.data\.description\}/);
  assert.ok(note.indexOf("data-note-summary") < note.indexOf("<Content />"));
});

test("notes archive has a distinct description and localized paginated title", () => {
  const notes = fs.readFileSync("src/pages/notes/list/[...page].astro", "utf8");
  assert.match(notes, /description="BX 的技术笔记归档/);
  assert.ok(!notes.includes("Notes List"));
  assert.match(notes, /page\.currentPage > 1/);
});

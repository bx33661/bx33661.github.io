import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { ui } from "../src/i18n/ui.ts";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("both languages use the original page components, not a second visual framework", () => {
  const pairs = [
    ["blog/[...page]", "en/blog/[...page]", "BlogIndex"],
    ["notes", "en/notes/index", "NotesIndex"],
    ["notes/list/[...page]", "en/notes/list/[...page]", "NotesList"],
    ["archives/index", "en/archives", "ArchiveIndex"],
    ["search", "en/search", "SearchPage"],
    ["notes/[...id]", "en/notes/[...slug]", "NoteDetails"],
    ["blog/[...slug]/index", "en/blog/[...slug]", "PostDetails"],
  ];
  for (const [zh, en, component] of pairs) {
    for (const page of [zh, en]) {
      const source = read(`src/pages/${page}.astro`);
      assert.match(source, new RegExp(`<${component}(?:\\s|/)`));
      assert.doesNotMatch(source, /<style|english-|EnglishShell|EnglishEntry/);
    }
  }
  for (const file of ["layouts/EnglishShell.astro", "layouts/EnglishEntry.astro", "components/EnglishList.astro", "components/EnglishSidebar.astro", "styles/english-shell.css"])
    assert.equal(existsSync(new URL(`../src/${file}`, import.meta.url)), false, file);
});

test("shared components keep the original design and locale-independent styles", () => {
  for (const [file, signature] of [["BlogIndex", "blog-index"], ["NotesIndex", "page-head"], ["ArchiveIndex", "archive-main"], ["SearchPage", "search-main"]]) {
    const source = read(`src/components/${file}.astro`);
    assert.match(source, new RegExp(signature));
    assert.match(source, /localeFromPath\(Astro.url.pathname\)/);
    assert.doesNotMatch(source, /english-|EnglishShell|EnglishSidebar/);
    const style = source.split("<style>")[1] ?? "";
    assert.doesNotMatch(style, /:lang|\[lang|english-|\.en\b/);
  }
  assert.match(read("src/components/BlogIndex.astro"), /<EntryRow/);
  assert.match(read("src/components/NotesIndex.astro"), /<EntryRow/);
  assert.match(read("src/components/ArchiveIndex.astro"), /id={`year-\$\{item.year\}`}/);
  assert.match(read("src/components/Header.astro"), /href: localizedPath\("\/blog\/", locale\)/);
});

test("interface dictionaries cover the same keys and truthful empty states", () => {
  const zh = ui("zh-CN"); const en = ui("en");
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  assert.equal(zh.posts, "文章"); assert.equal(en.posts, "Posts");
  assert.equal(en.emptyPosts, "No English posts yet.");
  assert.equal(en.emptyNotes, "No English notes yet.");
  assert.equal(en.pageCount(2, 3), "Page 2/3");
  assert.equal(zh.pageCount(2, 3), "第 2/3 页");
  assert.equal(en.yearMonth(2020, 1), "2020-01");
  assert.match(read("src/components/ContentEmpty.astro"), /lang="zh-CN"/);
  assert.doesNotMatch(read("src/components/ContentEmpty.astro"), /<svg|<aside|edition/i);
});

test("both article types share reading layouts with locale-scoped links and neighbours", () => {
  const post = read("src/layouts/PostDetails.astro");
  const note = read("src/layouts/NoteDetails.astro");
  assert.match(post, /localizedPath\(getPath\(id, filePath, true, slug\), locale\)/);
  assert.match(post, /<PostToc headings=\{tocHeadings\}/);
  assert.match(post, /t\.published/);
  assert.match(note, /getAdjacentNotes\(slug, locale\)/);
  assert.match(note, /localizedPath\(`\/notes\/\$\{next.slug\}\/`, locale\)/);
  assert.match(read("src/utils/notes.ts"), /isEntryLocale\(data, locale\)/);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { localeFromPath, localizedPath, isEntryLocale, sectionAlternates, switchDestination, entryAlternates } from "../src/i18n/index.ts";

test("locale detection respects a full path segment and keeps Chinese as default", () => {
  for (const path of ["/", "/blog/example/", "/english/", "/enough/", "/en-US/"]) assert.equal(localeFromPath(path), "zh-CN");
  for (const path of ["/en", "/en/", "/en/blog/example/"]) assert.equal(localeFromPath(path), "en");
});
test("localization adds only the English prefix without changing published URLs", () => {
  assert.equal(localizedPath("/", "en"), "/en/");
  assert.equal(localizedPath("/blog/codeql-learning/", "zh-CN"), "/blog/codeql-learning/");
  assert.equal(localizedPath("blog/example", "en"), "/en/blog/example/");
});
test("existing content stays Chinese; English content requires an explicit language", () => {
  assert.ok(isEntryLocale({}, "zh-CN"));
  assert.ok(!isEntryLocale({}, "en"));
  assert.ok(isEntryLocale({ lang: "en" }, "en"));
  assert.ok(!isEntryLocale({ lang: "en" }, "zh-CN"));
});
test("only real section counterparts receive alternate links", () => {
  assert.deepEqual(sectionAlternates("/en/blog/"), { "zh-CN": "/blog/", en: "/en/blog/" });
  assert.deepEqual(sectionAlternates("/blog/untranslated/"), {});
  assert.deepEqual(sectionAlternates("/friends/"), {});
  assert.equal(switchDestination("/blog/untranslated/", {}), "/en/blog/");
  assert.equal(switchDestination("/en/notes/new/", {}), "/notes/");
  assert.equal(switchDestination("/friends/", {}), "/en/");
});
test("translation pairing requires an explicit unique key, not a matching slug", () => {
  const zh = { lang: "zh-CN", translationKey: "research-a", path: "/blog/old-slug/" };
  const en = { lang: "en", translationKey: "research-a", path: "/en/blog/new-slug/" };
  assert.deepEqual(entryAlternates(zh, [zh, en]), { "zh-CN": zh.path, en: en.path });
  assert.deepEqual(entryAlternates(en, [zh, en]), { en: en.path, "zh-CN": zh.path });
  assert.deepEqual(entryAlternates({ ...zh, translationKey: undefined }, [zh, en]), { "zh-CN": zh.path });
  assert.deepEqual(entryAlternates(zh, [en, { ...en, path: "/en/blog/ambiguous/" }]), { "zh-CN": zh.path });
});
test("language filtering and cache keys stay separate in both content collections", () => {
  const source = fs.readFileSync("src/lib/data-utils.ts", "utf8");
  assert.match(source, /all-public-posts:\$\{locale\}/);
  assert.match(source, /all-notes:\$\{locale\}/);
  assert.match(source, /isEntryLocale\(post.data, locale\)/);
  assert.match(source, /isEntryLocale\(note.data, locale\)/);
  const schema = fs.readFileSync("src/content.config.ts", "utf8");
  assert.equal((schema.match(/lang: z.enum\(\["zh-CN", "en"\]\).default\("zh-CN"\)/g) ?? []).length, 2);
});
test("production search has an explicit English-empty state instead of a Chinese fallback", () => {
  const source = fs.readFileSync("src/utils/pagefind.ts", "utf8");
  assert.match(source, /isEnglish && document.documentElement.dataset.searchEmpty === "true"/);
  assert.match(source, /entries: \[\]/);
  const dev = fs.readFileSync("src/utils/devSearch.ts", "utf8");
  assert.match(dev, /isEnglish \? "\/en\/search.json" : "\/search.json"/);
});

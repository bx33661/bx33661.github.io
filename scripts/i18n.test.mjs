import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import {
  DEFAULT_LOCALE,
  SECONDARY_LOCALE,
  SECONDARY_PREFIX,
  localeFromPath,
  localizedPath,
  isEntryLocale,
  sectionAlternates,
  switchDestination,
  entryAlternates,
} from "../src/i18n/index.ts";

test("locale detection respects a full path segment and keeps configured default", () => {
  for (const path of ["/", "/blog/example/", "/zh-CN/", "/english/", "/zh-hans/"]) {
    assert.equal(localeFromPath(path), DEFAULT_LOCALE);
  }
  for (const path of [`/${SECONDARY_PREFIX}`, `/${SECONDARY_PREFIX}/`, `/${SECONDARY_PREFIX}/blog/example/`]) {
    assert.equal(localeFromPath(path), SECONDARY_LOCALE);
  }
});

test("localization adds only the secondary locale prefix without altering default URLs", () => {
  assert.equal(localizedPath("/", SECONDARY_LOCALE), `/${SECONDARY_PREFIX}/`);
  assert.equal(localizedPath("/blog/example/", DEFAULT_LOCALE), "/blog/example/");
  assert.equal(localizedPath("blog/example", SECONDARY_LOCALE), `/${SECONDARY_PREFIX}/blog/example/`);
});

test("content defaults to configured default locale unless explicitly marked", () => {
  assert.ok(isEntryLocale({}, DEFAULT_LOCALE));
  assert.ok(!isEntryLocale({}, SECONDARY_LOCALE));
  assert.ok(isEntryLocale({ lang: SECONDARY_LOCALE }, SECONDARY_LOCALE));
  assert.ok(!isEntryLocale({ lang: SECONDARY_LOCALE }, DEFAULT_LOCALE));
});

test("only real section counterparts receive alternate links", () => {
  assert.deepEqual(sectionAlternates(`/${SECONDARY_PREFIX}/blog/`), {
    [DEFAULT_LOCALE]: "/blog/",
    [SECONDARY_LOCALE]: `/${SECONDARY_PREFIX}/blog/`,
  });
  assert.deepEqual(sectionAlternates("/blog/untranslated/"), {});
  assert.deepEqual(sectionAlternates("/friends/"), {});
  assert.equal(switchDestination("/blog/untranslated/", {}), `/${SECONDARY_PREFIX}/blog/`);
  assert.equal(switchDestination(`/${SECONDARY_PREFIX}/notes/new/`, {}), "/notes/");
  assert.equal(switchDestination("/friends/", {}), `/${SECONDARY_PREFIX}/`);
});

test("translation pairing requires an explicit unique key, not a matching slug", () => {
  const def = { lang: DEFAULT_LOCALE, translationKey: "guide-a", path: "/blog/old-slug/" };
  const sec = { lang: SECONDARY_LOCALE, translationKey: "guide-a", path: `/${SECONDARY_PREFIX}/blog/new-slug/` };
  assert.deepEqual(entryAlternates(def, [def, sec]), { [DEFAULT_LOCALE]: def.path, [SECONDARY_LOCALE]: sec.path });
  assert.deepEqual(entryAlternates(sec, [def, sec]), { [SECONDARY_LOCALE]: sec.path, [DEFAULT_LOCALE]: def.path });
  assert.deepEqual(entryAlternates({ ...def, translationKey: undefined }, [def, sec]), { [DEFAULT_LOCALE]: def.path });
  assert.deepEqual(entryAlternates(def, [sec, { ...sec, path: `/${SECONDARY_PREFIX}/blog/ambiguous/` }]), {
    [DEFAULT_LOCALE]: def.path,
  });
});

test("language filtering and cache keys stay separate in both content collections", () => {
  const source = fs.readFileSync("src/lib/data-utils.ts", "utf8");
  assert.match(source, /all-public-posts:\$\{locale\}/);
  assert.match(source, /all-notes:\$\{locale\}/);
  assert.match(source, /isEntryLocale\(post\.data, locale\)/);
  assert.match(source, /isEntryLocale\(note\.data, locale\)/);
  const schema = fs.readFileSync("src/content.config.ts", "utf8");
  assert.equal((schema.match(/lang: z\.enum\(\["en", "zh-CN"\]\)\.default\(SITE\.i18n\.defaultLocale\)/g) ?? []).length, 2);
});

test("search supports dynamic endpoint, subpath bundlePath, and empty-locale fallback", () => {
  const pagefind = fs.readFileSync("src/utils/pagefind.ts", "utf8");
  assert.match(pagefind, /document\.documentElement\.dataset\.searchEmpty === "true"/);
  assert.match(pagefind, /bundlePath/);
  const dev = fs.readFileSync("src/utils/devSearch.ts", "utf8");
  assert.match(dev, /document\.documentElement\.dataset\.searchEndpoint/);
});

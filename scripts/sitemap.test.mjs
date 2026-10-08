import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { escapeXml, getSitemapLastmod } from "../src/utils/sitemap.ts";

test("sitemap lastmod respects editorial updates without build-time churn", () => {
  const published = new Date("2025-01-01T00:00:00Z");
  const updated = new Date("2026-10-07T00:00:00Z");
  assert.equal(getSitemapLastmod(published, updated), updated.toISOString());
  for (const date of [undefined, null, published, new Date("2024-01-01")])
    assert.equal(getSitemapLastmod(published, date), published.toISOString());
});

test("sitemap XML escapes URL and text delimiters", () => {
  assert.equal(escapeXml(`https://example.com/?a=1&b=<"'>`),
    "https://example.com/?a=1&amp;b=&lt;&quot;&apos;&gt;");
});

test("sitemap omits noncanonical about alias and invented static dates", () => {
  const xml = fs.readFileSync("src/pages/sitemap.xml.ts", "utf8");
  const index = fs.readFileSync("src/pages/sitemap-index.xml.ts", "utf8");
  assert.ok(!xml.includes('"/about/"'));
  assert.ok(!xml.includes("lastmod: now"));
  assert.ok(!index.includes("new Date()"));
  assert.ok(xml.includes("post.data.modDatetime"));
});

test("search noindex is crawlable while offline remains excluded", () => {
  const search = fs.readFileSync("src/pages/search.astro", "utf8");
  const robots = fs.readFileSync("src/pages/robots.txt.ts", "utf8");
  assert.match(search, /<Layout[^>]*noindex>/);
  assert.ok(!robots.includes("Disallow: /search/"));
  assert.ok(robots.includes("Disallow: /offline/"));
});

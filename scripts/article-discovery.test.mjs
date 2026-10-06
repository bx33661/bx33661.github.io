import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import {
  getArticleDates,
  getRelatedArticles,
  getArticleSeries,
} from "../src/utils/article-discovery.ts";
import { articleSeries } from "../src/data/article-series.ts";

const now = new Date("2026-10-05T00:00:00Z");
const post = (id, tags = [], extra = {}) => ({
  id,
  slug: id,
  title: id,
  href: `/blog/${id}/`,
  tags,
  publishedAt: new Date("2025-01-01"),
  ...extra,
});

test("publication and update labels use distinct, valid dates", () => {
  const published = new Date("2025-01-01");
  const updated = new Date("2026-01-01");
  assert.deepEqual(getArticleDates(published, updated), {
    published,
    updated,
    latest: updated,
  });
  for (const value of [undefined, null, published, new Date("2024-01-01")]) {
    assert.deepEqual(getArticleDates(published, value), {
      published,
      updated: null,
      latest: published,
    });
  }
});
test("related posts exclude current, generic-only, drafts and future entries", () => {
  const current = post("current", ["bx", "CodeQL"]);
  const posts = [
    current,
    post("relevant", ["codeql"]),
    post("generic", ["BX"]),
    post("draft", ["CodeQL"], { draft: true }),
    post("future", ["CodeQL"], { publishedAt: new Date("2027-01-01") }),
  ];
  assert.deepEqual(
    getRelatedArticles(current, posts, 3, now).map((p) => p.id),
    ["relevant"],
  );
});
test("rare shared topics outrank generic matches and duplicate tags do not inflate score", () => {
  const current = post("current", ["Web", "CodeQL"]);
  const posts = [
    current,
    post("specific", ["CODEQL", "codeql"]),
    ...["a", "b", "c", "d"].map((id) => post(id, ["web"])),
  ];
  assert.equal(getRelatedArticles(current, posts, 3, now)[0].id, "specific");
  assert.deepEqual(getRelatedArticles(current, posts, 0, now), []);
  assert.deepEqual(getRelatedArticles(current, posts, -1, now), []);
});
test("related ordering is deterministic and uses meaningful update dates", () => {
  const current = post("current", ["Redis"]);
  const old = post("old", ["Redis"]);
  const updated = post("updated", ["Redis"], {
    updatedAt: new Date("2026-01-01"),
  });
  assert.deepEqual(
    getRelatedArticles(current, [old, updated, current], 3, now).map(
      (p) => p.id,
    ),
    ["updated", "old"],
  );
  assert.deepEqual(
    getRelatedArticles(current, [current, updated, old], 3, now).map(
      (p) => p.id,
    ),
    ["updated", "old"],
  );
});
test("no same-topic signal means no unrelated filler", () => {
  assert.deepEqual(
    getRelatedArticles(
      post("current", ["AI"]),
      [post("other", ["Redis"])],
      3,
      now,
    ),
    [],
  );
});
test("series follows declared order, not date order, and does not self-link", () => {
  const first = post("first", [], { publishedAt: new Date("2026-01-01") });
  const second = post("second");
  const definition = [{ title: "Explicit series", slugs: ["first", "second"] }];
  const result = getArticleSeries(first, [second, first], definition, now);
  assert.equal(result.position, 1);
  assert.equal(result.previous, null);
  assert.equal(result.next.id, "second");
  const last = getArticleSeries(second, [first, second], definition, now);
  assert.equal(last.previous.id, "first");
  assert.equal(last.next, null);
});
test("series omits unpublished, missing and duplicate members", () => {
  const first = post("first");
  const second = post("second");
  const definition = [
    {
      title: "Series",
      slugs: ["first", "missing", "draft", "future", "first", "second"],
    },
  ];
  const result = getArticleSeries(
    first,
    [
      first,
      second,
      post("draft", [], { draft: true }),
      post("future", [], { publishedAt: new Date("2027-01-01") }),
    ],
    definition,
    now,
  );
  assert.deepEqual(
    result.chapters.map((p) => p.id),
    ["first", "second"],
  );
  assert.equal(
    getArticleSeries(post("outside"), [first, second], definition, now),
    null,
  );
  assert.equal(getArticleSeries(first, [first], definition, now), null);
});
test("curated Redis series points to existing published article slugs", () => {
  const content = fs
    .readdirSync("src/content/blog")
    .filter((name) => /\.(md|mdx)$/.test(name))
    .map((name) => fs.readFileSync(`src/content/blog/${name}`, "utf8"));
  for (const series of articleSeries)
    for (const slug of series.slugs) {
      assert(
        content.some(
          (text) =>
            text.match(/^slug:\s*["']?([^\s"']+)/m)?.[1] === slug &&
            !/^draft:\s*true/m.test(text),
        ),
        slug,
      );
    }
});

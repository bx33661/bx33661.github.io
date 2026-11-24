import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { collectMatches, CODE_FENCE_PATTERN, parseFrontmatter, stripCodeFences } from "./lib/content-utils.mjs";
import { articleCopy } from "../src/i18n/articles.ts";

const root = new URL("../", import.meta.url);
const pairs = JSON.parse(fs.readFileSync(new URL("./english-corpus.json", import.meta.url)));
const read = (file) => parseFrontmatter(fs.readFileSync(new URL(file, root), "utf8"));
const counts = (xs) => Object.fromEntries([...new Set(xs)].sort().map((x) => [x, xs.filter((v) => v === x).length]));

for (const pair of pairs) {
  test(`${pair.target}: paired full translation retains source body, code, links and structure`, () => {
    const a = read(pair.source);
    const b = read(pair.target);
    assert.equal(
      crypto.createHash("sha256").update(a.body).digest("hex"),
      pair.sourceBodySha256,
      "Chinese body is unchanged",
    );
    assert.equal(a.data.translationKey, pair.key);
    assert.equal(b.data.translationKey, pair.key);
    assert.equal(b.data.lang, "en");
    assert.equal(b.data.draft, false);
    assert.equal(b.data.slug, pair.slug);
    assert.match(b.data.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-en$/);
    for (const field of ["date", "pubDatetime", "modDatetime", "authors", "author"])
      assert.deepEqual(b.data[field], a.data[field]);
    assert.ok(b.data.description.length >= 40 && b.data.description.length <= 180);
    assert.doesNotMatch(
      [b.data.title, b.data.description, ...(b.data.tags ?? []), b.data.category ?? ""].join(" "),
      /[\u4e00-\u9fff]/,
    );
    assert.deepEqual(
      collectMatches(b.body, CODE_FENCE_PATTERN),
      collectMatches(a.body, CODE_FENCE_PATTERN),
      "all fenced code remains byte-identical",
    );
    assert.deepEqual(
      [...b.body.matchAll(CODE_FENCE_PATTERN)].map((m) => m[0]),
      [...a.body.matchAll(CODE_FENCE_PATTERN)].map((m) => m[0]),
    );
    const proseA = stripCodeFences(a.body);
    const proseB = stripCodeFences(b.body);
    assert.deepEqual(collectMatches(proseB, /^(#{1,6}) /gm), collectMatches(proseA, /^(#{1,6}) /gm));
    assert.deepEqual(collectMatches(b.body, /\]\(([^)]+)\)/g), collectMatches(a.body, /\]\(([^)]+)\)/g));
    assert.deepEqual(collectMatches(b.body, /^import (.*)$/gm), collectMatches(a.body, /^import (.*)$/gm));
    const before = counts(collectMatches(proseA, /(`+[^`\n]+`+)/g));
    const after = counts(collectMatches(proseB, /(`+[^`\n]+`+)/g));
    for (const [token, n] of Object.entries(before)) assert.ok(after[token] >= n, `unchanged inline token: ${token}`);
    assert.equal(collectMatches(proseB, /^\s*\|/gm).length, collectMatches(proseA, /^\s*\|/gm).length);
    assert.equal(
      collectMatches(proseB, /^\s*(?:[-*+] |\d+[.)] )/gm).length,
      collectMatches(proseA, /^\s*(?:[-*+] |\d+[.)] )/gm).length,
    );
    const visible = proseB.replace(/`+[^`\n]*`+/g, "").replace(/https?:\/\/[^\s<>]+/g, "");
    assert.doesNotMatch(visible.replace("“你好”", ""), /[\u4e00-\u9fff]|ZXQ\d+P\d+QXZ|TODO_TRANSLATE/);
  });
}

test("English corpus covers every public Chinese blog and note exactly once", () => {
  assert.equal(pairs.filter((p) => p.source.startsWith("src/content/blog/")).length, 57);
  assert.equal(pairs.filter((p) => p.source.startsWith("src/data/notes/")).length, 9);
  for (const dir of ["src/content/blog", "src/data/notes"]) {
    const source = fs
      .readdirSync(new URL(dir, root))
      .filter((n) => /\.mdx?$/.test(n))
      .map((n) => `${dir}/${n}`)
      .filter((n) => {
        const { data } = read(n);
        return data.lang !== "en" && !data.draft;
      });
    assert.deepEqual(
      source.sort(),
      pairs
        .filter((p) => p.source.startsWith(dir + "/"))
        .map((p) => p.source)
        .sort(),
    );
  }
  assert.equal(new Set(pairs.map((p) => p.target)).size, 66);
});

test("Article components share translated server and client copy", () => {
  for (const name of ["TrustBoundarySimulator", "MiniappAuditFeature", "MiniappAuditDiagram", "Gist"]) {
    const source = fs.readFileSync(new URL(`src/components/${name}.astro`, root), "utf8");
    assert.match(source, /articleCopy/);
    assert.match(source, /localeFromPath/);
  }
  assert.equal(articleCopy("en", "危险文件写入"), "Dangerous file write");
  assert.equal(articleCopy("zh-CN", "危险文件写入"), "危险文件写入");
  assert.equal(articleCopy("en", "普通分包"), "Regular subpackage");
});

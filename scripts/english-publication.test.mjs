import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { collectMatches, CODE_FENCE_PATTERN, parseFrontmatter, stripCodeFences } from "./lib/content-utils.mjs";
import { cyberGymCopy } from "../src/i18n/cybergym.ts";

const root = new URL("../src/content/blog/", import.meta.url);
const pairs = [
  [
    "websocket-handshake-message-replay.md",
    "websocket-handshake-message-replay-en.md",
    "websocket-handshake-message-replay",
  ],
  ["rasp.md", "openrasp-sql-detect-bypass-en.md", "openrasp-sql-detect-bypass"],
  [
    "cybergym-ai-security-agent-benchmark.mdx",
    "cybergym-ai-security-agent-benchmark-en.mdx",
    "cybergym-ai-security-agent-benchmark",
  ],
];
const parse = (name) => parseFrontmatter(fs.readFileSync(new URL(name, root), "utf8"));

for (const [source, target, key] of pairs) {
  test(`${target}: faithful structure, immutable code/resources and explicit translation metadata`, () => {
    const a = parse(source);
    const b = parse(target);
    assert.equal(b.data.lang, "en");
    assert.equal(a.data.translationKey, key);
    assert.equal(b.data.translationKey, key);
    assert.equal(b.data.slug, `${a.data.slug}-en`);
    assert.deepEqual(b.data.date, a.data.date);
    assert.deepEqual(b.data.authors, a.data.authors);
    assert.equal(b.data.draft, false);
    assert.ok(b.data.description.length >= 40 && b.data.description.length <= 180);
    assert.deepEqual(
      [...b.body.matchAll(CODE_FENCE_PATTERN)].map((m) => m[0]),
      [...a.body.matchAll(CODE_FENCE_PATTERN)].map((m) => m[0]),
      "every fenced block, including comments and output, stays byte-identical",
    );
    const proseA = stripCodeFences(a.body);
    const proseB = stripCodeFences(b.body);
    assert.deepEqual(collectMatches(proseB, /^(#{1,6}) /gm), collectMatches(proseA, /^(#{1,6}) /gm));
    assert.deepEqual(collectMatches(a.body, /\]\(([^)]+)\)/g), collectMatches(b.body, /\]\(([^)]+)\)/g));
    assert.deepEqual(collectMatches(a.body, /^import (.*)$/gm), collectMatches(b.body, /^import (.*)$/gm));
    const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
    const sourceTokens = count(collectMatches(proseA, /(`[^`\n]+`)/g));
    const translatedTokens = count(collectMatches(proseB, /(`[^`\n]+`)/g));
    for (const [token, n] of sourceTokens)
      assert.ok((translatedTokens.get(token) ?? 0) >= n, `source inline token changed: ${token}`);
    for (const image of collectMatches(b.body, /!\[[^\]]*\]\(([^)]+)\)/g)) {
      if (image.startsWith("/")) assert.ok(fs.existsSync(new URL(`../public${image}`, import.meta.url)), image);
    }
    assert.doesNotMatch(b.body, /@@UNCHANGED_CODE_BLOCK_|TODO_TRANSLATE|\[translation pending\]/);
  });
}

test("CyberGym uses one shared component and translated server/client outcomes", () => {
  const zh = cyberGymCopy("zh-CN");
  const en = cyberGymCopy("en");
  assert.equal(zh.outcomes.target.pre, "触发崩溃");
  assert.equal(en.outcomes.target.pre, "Crashes");
  assert.equal(en.outcomes.both.post, "Still crashes");
  assert.equal(en.outcomes.none.pre, "Does not crash");
  assert.deepEqual(Object.keys(zh.outcomes), Object.keys(en.outcomes));
  const component = fs.readFileSync(new URL("../src/components/CyberGymFeature.astro", import.meta.url), "utf8");
  assert.match(component, /data-locale=\{locale\}/);
  assert.match(component, /cyberGymCopy\(root.dataset.locale/);
  assert.match(
    parse("cybergym-ai-security-agent-benchmark-en.mdx").body,
    /<CyberGymFeature variant="oracle" locale="en"/,
  );
});

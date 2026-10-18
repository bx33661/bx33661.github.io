import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import yaml from "js-yaml";
import { cyberGymCopy } from "../src/i18n/cybergym.ts";
const root = new URL("../src/content/blog/", import.meta.url);
const pairs = [
  ["websocket-handshake-message-replay.md", "websocket-handshake-message-replay-en.md", "websocket-handshake-message-replay"],
  ["rasp.md", "openrasp-sql-detect-bypass-en.md", "openrasp-sql-detect-bypass"],
  ["cybergym-ai-security-agent-benchmark.mdx", "cybergym-ai-security-agent-benchmark-en.mdx", "cybergym-ai-security-agent-benchmark"],
];
const parse = (name) => {
  const text = fs.readFileSync(new URL(name, root), "utf8");
  const [, frontmatter, body] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  return { data: yaml.load(frontmatter), body };
};
const fences = (s) => [...s.matchAll(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)/gm)].map((m) => m[0]);
const prose = (s) => s.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)/gm, "");
const matches = (s, regex) => [...s.matchAll(regex)].map((m) => m[1]);
for (const [source, target, key] of pairs) {
  test(`${target}: faithful structure, immutable code/resources and explicit translation metadata`, () => {
    const a = parse(source); const b = parse(target);
    assert.equal(b.data.lang, "en");
    assert.equal(a.data.translationKey, key); assert.equal(b.data.translationKey, key);
    assert.equal(b.data.slug, `${a.data.slug}-en`);
    assert.deepEqual(b.data.date, a.data.date); assert.deepEqual(b.data.authors, a.data.authors);
    assert.equal(b.data.draft, false);
    assert.ok(b.data.description.length >= 40 && b.data.description.length <= 180);
    assert.deepEqual(fences(b.body), fences(a.body), "every fenced block, including comments and output, stays byte-identical");
    assert.deepEqual(matches(prose(b.body), /^(#{1,6}) /gm), matches(prose(a.body), /^(#{1,6}) /gm));
    assert.deepEqual(matches(a.body, /\]\(([^)]+)\)/g), matches(b.body, /\]\(([^)]+)\)/g));
    assert.deepEqual(matches(a.body, /^import (.*)$/gm), matches(b.body, /^import (.*)$/gm));
    const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
    const sourceTokens = count(matches(prose(a.body), /(`[^`\n]+`)/g));
    const translatedTokens = count(matches(prose(b.body), /(`[^`\n]+`)/g));
    for (const [token, n] of sourceTokens) assert.ok((translatedTokens.get(token) ?? 0) >= n, `source inline token changed: ${token}`);
    for (const image of matches(b.body, /!\[[^\]]*\]\(([^)]+)\)/g)) {
      if (image.startsWith("/")) assert.ok(fs.existsSync(new URL(`../public${image}`, import.meta.url)), image);
    }
    assert.doesNotMatch(b.body, /@@UNCHANGED_CODE_BLOCK_|TODO_TRANSLATE|\[translation pending\]/);
  });
}

test("CyberGym uses one shared component and translated server/client outcomes", () => {
  const zh = cyberGymCopy("zh-CN"); const en = cyberGymCopy("en");
  assert.equal(zh.outcomes.target.pre, "触发崩溃");
  assert.equal(en.outcomes.target.pre, "Crashes");
  assert.equal(en.outcomes.both.post, "Still crashes");
  assert.equal(en.outcomes.none.pre, "Does not crash");
  assert.deepEqual(Object.keys(zh.outcomes), Object.keys(en.outcomes));
  const component = fs.readFileSync(new URL("../src/components/CyberGymFeature.astro", import.meta.url), "utf8");
  assert.match(component, /data-locale=\{locale\}/);
  assert.match(component, /cyberGymCopy\(root.dataset.locale/);
  assert.match(parse("cybergym-ai-security-agent-benchmark-en.mdx").body, /<CyberGymFeature variant="oracle" locale="en"/);
});

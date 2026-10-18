import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import yaml from 'js-yaml';
import { articleCopy } from '../src/i18n/articles.ts';
const root = new URL('../', import.meta.url);
const pairs = JSON.parse(fs.readFileSync(new URL('./english-corpus.json', import.meta.url)));
const read = (file) => {
  const raw = fs.readFileSync(new URL(file, root), 'utf8');
  const [, meta, body] = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  return { data: yaml.load(meta), body };
};
const match = (s, rx) => [...s.matchAll(rx)].map((m) => m[1] ?? m[0]);
const code = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*(?:\n|$)/gm;
const prose = (s) => s.replace(code, '');
const counts = (xs) => Object.fromEntries([...new Set(xs)].sort().map((x) => [x, xs.filter((v) => v === x).length]));
for (const pair of pairs) {
  test(`${pair.target}: paired full translation retains source body, code, links and structure`, () => {
    const a = read(pair.source); const b = read(pair.target);
    assert.equal(crypto.createHash('sha256').update(a.body).digest('hex'), pair.sourceBodySha256, 'Chinese body is unchanged');
    assert.equal(a.data.translationKey, pair.key); assert.equal(b.data.translationKey, pair.key);
    assert.equal(b.data.lang, 'en'); assert.equal(b.data.draft, false);
    assert.equal(b.data.slug, pair.slug); assert.match(b.data.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*-en$/);
    for (const field of ['date', 'pubDatetime', 'modDatetime', 'authors', 'author']) assert.deepEqual(b.data[field], a.data[field]);
    assert.ok(b.data.description.length >= 40 && b.data.description.length <= 180);
    assert.doesNotMatch([b.data.title, b.data.description, ...(b.data.tags ?? []), b.data.category ?? ''].join(' '), /[\u4e00-\u9fff]/);
    assert.deepEqual(match(b.body, code), match(a.body, code), 'all fenced code remains byte-identical');
    // Compare full fence strings as well as indentation captured by match().
    assert.deepEqual([...b.body.matchAll(code)].map(m=>m[0]), [...a.body.matchAll(code)].map(m=>m[0]));
    assert.deepEqual(match(prose(b.body), /^(#{1,6}) /gm), match(prose(a.body), /^(#{1,6}) /gm));
    assert.deepEqual(match(b.body, /\]\(([^)]+)\)/g), match(a.body, /\]\(([^)]+)\)/g));
    assert.deepEqual(match(b.body, /^import (.*)$/gm), match(a.body, /^import (.*)$/gm));
    const before = counts(match(prose(a.body), /(`+[^`\n]+`+)/g));
    const after = counts(match(prose(b.body), /(`+[^`\n]+`+)/g));
    for (const [token, n] of Object.entries(before)) assert.ok(after[token] >= n, `unchanged inline token: ${token}`);
    assert.equal(match(prose(b.body), /^\s*\|/gm).length, match(prose(a.body), /^\s*\|/gm).length);
    assert.equal(match(prose(b.body), /^\s*(?:[-*+] |\d+[.)] )/gm).length, match(prose(a.body), /^\s*(?:[-*+] |\d+[.)] )/gm).length);
    const visible = prose(b.body).replace(/`+[^`\n]*`+/g, '').replace(/https?:\/\/[^\s<>]+/g, '');
    assert.doesNotMatch(visible.replace('“你好”', ''), /[\u4e00-\u9fff]|ZXQ\d+P\d+QXZ|TODO_TRANSLATE/);
  });
}
test('English corpus covers every public Chinese blog and note exactly once', () => {
  assert.equal(pairs.filter(p => p.source.startsWith('src/content/blog/')).length, 55);
  assert.equal(pairs.filter(p => p.source.startsWith('src/data/notes/')).length, 9);
  for (const dir of ['src/content/blog', 'src/data/notes']) {
    const source = fs.readdirSync(new URL(dir, root)).filter(n => /\.mdx?$/.test(n)).map(n => `${dir}/${n}`).filter(n => { const {data} = read(n); return data.lang !== 'en' && !data.draft; });
    assert.deepEqual(source.sort(), pairs.filter(p=>p.source.startsWith(dir+'/')).map(p=>p.source).sort());
  }
  assert.equal(new Set(pairs.map(p=>p.target)).size, 64);
});
test('Article components share translated server and client copy', () => {
  for (const name of ['TrustBoundarySimulator', 'MiniappAuditFeature', 'MiniappAuditDiagram', 'Gist']) {
    const source = fs.readFileSync(new URL(`src/components/${name}.astro`, root), 'utf8');
    assert.match(source, /articleCopy/); assert.match(source, /localeFromPath/);
  }
  assert.equal(articleCopy('en', '危险文件写入'), 'Dangerous file write');
  assert.equal(articleCopy('zh-CN', '危险文件写入'), '危险文件写入');
  assert.equal(articleCopy('en', '普通分包'), 'Regular subpackage');
});

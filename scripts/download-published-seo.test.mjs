import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { downloadPublishedSeo } from "./download-published-seo.mjs";
const origin = "https://www.bx33661.com";
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "published-seo-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  return dir;
}
test("daily mirror validates published canonical content", async (t) => {
  const dir = await fixture(t);
  const request = async (url) => ({
    ok: true,
    text: async () =>
      url.endsWith("sitemap.xml")
        ? `<urlset><loc>${origin}/blog/a/</loc></urlset>`
        : `<link rel="canonical" href="${origin}/blog/a/"><main>Article</main>`,
  });
  await downloadPublishedSeo(origin, dir, request);
  assert.match(
    await fs.readFile(path.join(dir, "blog/a/index.html"), "utf8"),
    /Article/,
  );
});
test("foreign sitemap URL is rejected before fetching", async (t) => {
  const dir = await fixture(t);
  let calls = 0;
  await assert.rejects(
    downloadPublishedSeo(origin, dir, async () => {
      calls++;
      return {
        ok: true,
        text: async () => "<loc>https://evil.example/blog/a/</loc>",
      };
    }),
    /Noncanonical/,
  );
  assert.equal(calls, 1);
});
test("mismatching canonical and noindex stop daily push input", async (t) => {
  const dir = await fixture(t);
  for (const html of [
    `<link rel="canonical" href="${origin}/other/"><main>x</main>`,
    `<link rel="canonical" href="${origin}/blog/a/"><meta name="robots" content="noindex"><main>x</main>`,
  ]) {
    await assert.rejects(
      downloadPublishedSeo(origin, dir, async (url) => ({
        ok: true,
        text: async () =>
          url.endsWith("sitemap.xml") ? `<loc>${origin}/blog/a/</loc>` : html,
      })),
      /canonical mismatch|noindex/,
    );
  }
});

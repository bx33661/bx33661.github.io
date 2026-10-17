import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";

test("brand master is a pure vector and header/footer preserve its proportions", async () => {
  const svg = await fs.readFile("public/brand/bx-logo.svg", "utf8");
  assert.equal((svg.match(/<path\b/g) ?? []).length, 24);
  assert.doesNotMatch(svg, /<image\b|<script\b|<foreignObject\b|data:/i);
  for (const file of ["Header", "Footer"]) {
    const source = await fs.readFile(`src/components/${file}.astro`, "utf8");
    assert.match(source, /\/brand\/bx-logo\.svg/);
    assert.match(source, /object-contain/);
    assert.match(source, /bg-\[#f4f0e6\]/);
  }
});

test("platform icons have their declared sizes and opaque backgrounds", async () => {
  for (const [name, size] of [["bx-logo-32.png", 32], ["bx-logo-192.png", 192], ["bx-logo-512.png", 512], ["apple-touch-icon.png", 180]]) {
    const meta = await sharp(`public/brand/${name}`).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
    assert.equal(meta.hasAlpha, false);
  }
  const ico = await fs.readFile("public/brand/favicon.ico");
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
});

test("favicon, app manifest and social image reference the new brand assets", async () => {
  const layout = await fs.readFile("src/layouts/Layout.astro", "utf8");
  assert.match(layout, /type="image\/svg\+xml" href="\/brand\/bx-logo\.svg"/);
  assert.match(layout, /href="\/brand\/bx-logo-32\.png"/);
  assert.match(layout, /href="\/brand\/apple-touch-icon\.png"/);
  const manifest = JSON.parse(await fs.readFile("public/site.webmanifest", "utf8"));
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("/brand/"));
    await fs.access("public" + icon.src);
  }
  assert.match(await fs.readFile("src/config.ts", "utf8"), /ogImage: "brand\/bx-logo-512\.png"/);
});

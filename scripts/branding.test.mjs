import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import { SITE } from "../src/config.ts";

test("brand master is a pure vector and header/footer bind SITE.brandLogo cleanly", async () => {
  const svg = await fs.readFile("public/brand/bx-logo.svg", "utf8");
  assert.equal((svg.match(/<path\b/g) ?? []).length, 24);
  assert.doesNotMatch(svg, /<image\b|<script\b|<foreignObject\b|data:/i);
  assert.equal(SITE.brandLogo, "/brand/bx-logo.svg");
  for (const file of ["Header", "Footer"]) {
    const source = await fs.readFile(`src/components/${file}.astro`, "utf8");
    assert.match(source, /SITE\.brandLogo/);
    assert.match(source, /object-contain/);
    assert.match(source, /bg-\[#f4f0e6\]/);
  }
});

test("platform icons have their declared sizes and opaque backgrounds", async () => {
  for (const [name, size] of [
    ["bx-logo-32.png", 32],
    ["bx-logo-192.png", 192],
    ["bx-logo-512.png", 512],
    ["apple-touch-icon.png", 180],
  ]) {
    const meta = await sharp(`public/brand/${name}`).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
    assert.equal(meta.hasAlpha, false);
  }
  const ico = await fs.readFile("public/brand/favicon.ico");
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
});

test("favicon, dynamic webmanifest and social image reference the brand assets", async () => {
  const layout = await fs.readFile("src/layouts/Layout.astro", "utf8");
  assert.match(layout, /SITE\.faviconSvg/);
  assert.match(layout, /SITE\.faviconPng/);
  assert.match(layout, /SITE\.appleTouchIcon/);
  assert.equal(SITE.faviconSvg, "/brand/bx-logo.svg");
  assert.equal(SITE.faviconPng, "/brand/bx-logo-32.png");
  assert.equal(SITE.appleTouchIcon, "/brand/apple-touch-icon.png");
  assert.equal(SITE.ogImage, "brand/bx-logo-512.png");
  const manifestRoute = await fs.readFile("src/pages/site.webmanifest.ts", "utf8");
  assert.match(manifestRoute, /SITE\.friendCard\.avatar/);
  assert.match(manifestRoute, /SITE\.ogImage/);
  await fs.access("public/brand/bx-logo-192.png");
  await fs.access("public/brand/bx-logo-512.png");
});

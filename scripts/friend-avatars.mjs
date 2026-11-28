#!/usr/bin/env node
/**
 * Mirror friend avatars locally (public/static/friends/*.webp) so the Friends page
 * doesn't depend on third-party image hosts at view time.
 * Avatars that fail to download keep their remote URL (and the letter fallback).
 *
 * Usage: npm run friends:avatars
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outDir = path.join(root, "public/static/friends");
const mapFile = path.join(root, "src/data/friend-avatars.json");
const source = fs.readFileSync(path.join(root, "src/config/friends.ts"), "utf8");

const entries = [...source.matchAll(/name: "([^"]+)",\s*url: "[^"]+",[\s\S]*?avatar: "([^"]+)"/g)]
  .map(([, name, avatar]) => ({ name, avatar }))
  .filter(({ avatar }) => /^https?:\/\//.test(avatar));

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "friend";

fs.mkdirSync(outDir, { recursive: true });
const previous = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, "utf8")) : {};
const map = {};

for (const { name, avatar } of entries) {
  const file = `${slug(name)}.webp`;
  try {
    const response = await fetch(avatar, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const input = Buffer.from(await response.arrayBuffer());
    await sharp(input).resize(128, 128, { fit: "cover" }).webp({ quality: 82 }).toFile(path.join(outDir, file));
    map[avatar] = `/static/friends/${file}`;
    console.log(`✓ ${name}`);
  } catch (error) {
    // Keep an earlier mirror if this run could not reach the host.
    if (previous[avatar] && fs.existsSync(path.join(root, "public", previous[avatar]))) {
      map[avatar] = previous[avatar];
      console.log(`· ${name}: kept existing mirror (${error.message})`);
    } else {
      console.log(`✗ ${name}: ${error.message} — remote URL kept`);
    }
  }
}

fs.writeFileSync(mapFile, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Mirrored ${Object.keys(map).length}/${entries.length} avatars → ${path.relative(root, mapFile)}`);

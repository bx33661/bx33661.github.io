import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Published PNG URLs stay available; these variants are generated build assets.
const originals = [
  "public/blog/l3hctf-best-profile/01-profile-bypass-flow.png",
  "public/blog/miniapp-audit/08-xcode-development-ui.png",
  "public/blog/miniapp-audit/13-endpoints-parameters-analysis.png",
];
const widths = [800, 1600];
for (const original of originals) {
  const metadata = await sharp(original).metadata();
  for (const width of widths) {
    const output = original.replace(/\.png$/, `-${width}.webp`);
    await sharp(original).resize({ width, withoutEnlargement: true }).webp({ lossless: true, effort: 6 }).toFile(output);
    const size = (await fs.stat(output)).size;
    console.log(`${path.relative(process.cwd(), output)} ${metadata.width}x${metadata.height} -> ${width}w ${size} bytes`);
  }
}

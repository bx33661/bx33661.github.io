import fsp from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { mapConcurrent } from "./lib/concurrency.mjs";

const SOURCE_DIR = path.resolve("src/data/galleries");
const OUTPUT_DIR = path.resolve("public/gallery/optimized");
const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const TARGET_WIDTHS = [640, 960, 1280, 1600];

const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const stripExtension = (fileName) => fileName.replace(/\.[^.]+$/, "");

const OUTPUT_FORMATS = [
  { extension: "avif", build: (pipeline) => pipeline.avif({ quality: 52, effort: 5 }) },
  { extension: "webp", build: (pipeline) => pipeline.webp({ quality: 74, effort: 6 }) },
  { extension: "jpg", build: (pipeline) => pipeline.jpeg({ quality: 76, mozjpeg: true }) },
];

const getRenditionWidths = (sourceWidth) => {
  const maxWidth = TARGET_WIDTHS[TARGET_WIDTHS.length - 1];
  const widths = TARGET_WIDTHS.filter((step) => step <= sourceWidth);
  if (sourceWidth <= maxWidth && !widths.includes(sourceWidth)) widths.push(sourceWidth);
  if (widths.length === 0) widths.push(sourceWidth);
  return widths.sort((a, b) => a - b);
};

const needsUpdate = async (sourceStat, targetFile) => {
  try {
    const targetStat = await fsp.stat(targetFile);
    return sourceStat.mtimeMs > targetStat.mtimeMs ? null : targetStat.size;
  } catch {
    return null;
  }
};

const listSourceImages = async (dir = SOURCE_DIR) => {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const imageFiles = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) imageFiles.push(...(await listSourceImages(fullPath)));
    else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      imageFiles.push(path.relative(SOURCE_DIR, fullPath));
    }
  }
  return imageFiles.sort((a, b) => a.localeCompare(b));
};

const optimizeOneFile = async (sourceRelativePath) => {
  const sourceFile = path.join(SOURCE_DIR, sourceRelativePath);
  const baseName = stripExtension(path.basename(sourceRelativePath));
  const [sourceMetadata, sourceStat] = await Promise.all([sharp(sourceFile).metadata(), fsp.stat(sourceFile)]);
  if (!sourceMetadata.width) throw new Error(`Unable to read width: ${sourceRelativePath}`);

  const widths = getRenditionWidths(sourceMetadata.width);
  let generated = 0;
  let outputBytes = 0;

  await mapConcurrent(widths, 2, async (width) => {
    const pendingTargets = [];
    for (const target of OUTPUT_FORMATS) {
      const outputFile = path.join(OUTPUT_DIR, `${baseName}-w${width}.${target.extension}`);
      const cachedSize = await needsUpdate(sourceStat, outputFile);
      if (cachedSize !== null) outputBytes += cachedSize;
      else pendingTargets.push({ ...target, outputFile });
    }
    if (pendingTargets.length === 0) return;

    // Decode and resize once per width, cloning into each output format.
    const resized = sharp(sourceFile).rotate().resize({ width, withoutEnlargement: true });
    const sizes = await Promise.all(
      pendingTargets.map(async (target) => {
        await target.build(resized.clone()).toFile(target.outputFile);
        return (await fsp.stat(target.outputFile)).size;
      }),
    );
    for (const size of sizes) outputBytes += size;
    generated += sizes.length;
  });

  return { fileName: sourceRelativePath, sourceBytes: sourceStat.size, outputBytes, generated };
};

const run = async () => {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  const imageFiles = await listSourceImages();
  const results = await mapConcurrent(imageFiles, 3, optimizeOneFile);

  let sourceTotal = 0;
  let outputTotal = 0;
  let generatedTotal = 0;
  for (const result of results) {
    sourceTotal += result.sourceBytes;
    outputTotal += result.outputBytes;
    generatedTotal += result.generated;
    console.log(
      `[gallery] ${result.fileName} -> variants=${result.generated} total=${formatBytes(result.outputBytes)}`,
    );
  }

  console.log("");
  console.log(`[gallery] source total: ${formatBytes(sourceTotal)}`);
  console.log(`[gallery] optimized total: ${formatBytes(outputTotal)}`);
  console.log(`[gallery] files generated/updated: ${generatedTotal}`);
};

run().catch((error) => {
  console.error("[gallery] optimize failed");
  console.error(error);
  process.exit(1);
});

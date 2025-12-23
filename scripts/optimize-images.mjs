import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const exts = new Set(['.png', '.jpg', '.jpeg']);
const minBytes = 300 * 1024; // only process files >300KB
const targets = [
  path.resolve('public'),
  path.resolve('dist')
];

async function* walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

async function optimize(file) {
  const ext = path.extname(file).toLowerCase();
  if (!exts.has(ext)) return { skipped: true };
  const stat = await fsp.stat(file);
  if (stat.size < minBytes) return { skipped: true };

  const tmp = file + '.tmp';
  try {
    const img = sharp(file);
    if (ext === '.png') {
      await img.png({ quality: 80, compressionLevel: 9, effort: 10 }).toFile(tmp);
    } else {
      await img.jpeg({ quality: 72, mozjpeg: true }).toFile(tmp);
    }
    const outStat = await fsp.stat(tmp);
    if (outStat.size < stat.size * 0.98) {
      await fsp.rename(tmp, file);
      return { optimized: true, before: stat.size, after: outStat.size };
    } else {
      await fsp.unlink(tmp);
      return { optimized: false, before: stat.size, after: outStat.size };
    }
  } catch (e) {
    try { await fsp.unlink(tmp); } catch {}
    return { error: e };
  }
}

(async () => {
  let saved = 0, count = 0;
  for (const root of targets) {
    if (!fs.existsSync(root)) continue;
    for await (const file of walk(root)) {
      const res = await optimize(file);
      if (res.optimized) {
        count++;
        saved += (res.before - res.after);
        console.log(`[optimized] ${file} ${(res.before/1024/1024).toFixed(2)}MB -> ${(res.after/1024/1024).toFixed(2)}MB`);
      }
    }
  }
  console.log(`Done. Files optimized: ${count}, total saved: ${(saved/1024/1024).toFixed(2)}MB`);
})();

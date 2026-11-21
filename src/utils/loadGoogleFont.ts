import fs from "node:fs";
import path from "node:path";

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

const localFontCache = new Map<number, ArrayBuffer>();
const googleFontCache = new Map<string, Promise<ArrayBuffer>>();

function loadLocalFont(weight: number): ArrayBuffer {
  const key = weight >= 600 ? 700 : 400;
  const cached = localFontCache.get(key);
  if (cached) return cached;

  const file = key === 700 ? "_montserrat_bold.ttf" : "_montserrat_regular.ttf";
  const fontPath = path.join(process.cwd(), "src/assets/fonts", file);
  const buf = fs.readFileSync(fontPath);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  localFontCache.set(key, arrayBuffer);
  return arrayBuffer;
}

function loadGoogleFont(font: string, text: string, weight: 400 | 700): Promise<ArrayBuffer> {
  const cacheKey = `${font}:${weight}:${text}`;
  const cached = googleFontCache.get(cacheKey);
  if (cached) return cached;

  const API = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const task = (async () => {
    try {
      const css = await (
        await fetch(API, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
          },
        })
      ).text();

      const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
      if (!resource) throw new Error("Failed to parse dynamic font CSS");

      const res = await fetch(resource[1]);
      if (!res.ok) throw new Error(`Failed to download dynamic font. Status: ${res.status}`);
      return await res.arrayBuffer();
    } catch {
      // Offline / flaky network during build: use bundled Montserrat as fallback
      return loadLocalFont(weight);
    }
  })();

  googleFontCache.set(cacheKey, task);
  return task;
}

export default async function loadGoogleFonts(text: string): Promise<SatoriFont[]> {
  const weights: readonly (400 | 700)[] = [400, 700];
  return Promise.all(
    weights.map(async (weight) => ({
      name: "Noto Sans SC",
      data: await loadGoogleFont("Noto+Sans+SC", text, weight),
      weight,
      style: "normal" as const,
    })),
  );
}

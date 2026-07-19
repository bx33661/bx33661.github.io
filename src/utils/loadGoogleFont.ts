import fs from "node:fs";
import path from "node:path";

function loadLocalFont(weight: number): ArrayBuffer {
  const file =
    weight >= 600 ? "_montserrat_bold.ttf" : "_montserrat_regular.ttf";
  const fontPath = path.join(process.cwd(), "public/fonts", file);
  const buf = fs.readFileSync(fontPath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

async function loadGoogleFont(
  font: string,
  text: string,
  weight: number,
): Promise<ArrayBuffer> {
  const API = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;

  try {
    const css = await (
      await fetch(API, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      })
    ).text();

    const resource = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
    );

    if (!resource) throw new Error("Failed to parse dynamic font CSS");

    const res = await fetch(resource[1]);

    if (!res.ok) {
      throw new Error("Failed to download dynamic font. Status: " + res.status);
    }

    return res.arrayBuffer();
  } catch {
    // Offline / flaky network during build: use bundled Montserrat as fallback
    return loadLocalFont(weight);
  }
}

async function loadGoogleFonts(
  text: string,
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const fontsConfig = [
    { name: "Noto Sans", font: "Noto+Sans", weight: 400, style: "normal" },
    {
      name: "Noto Sans",
      font: "Noto+Sans",
      weight: 700,
      style: "normal",
    },
  ];

  const fonts = await Promise.all(
    fontsConfig.map(async ({ name, font, weight, style }) => {
      const data = await loadGoogleFont(font, text, weight);
      return { name, data, weight, style };
    }),
  );

  return fonts;
}

export default loadGoogleFonts;

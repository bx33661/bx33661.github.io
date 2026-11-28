import type { Element, Root } from "hast";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import { withBase } from "./url.ts";

/**
 * Infer intrinsic width/height for local `/blog/` images from `public/` at build time,
 * upgrade to responsive `-800.webp` / `-1600.webp` `<picture>` when variants exist on disk,
 * and prefix URLs with Astro's configured `base`.
 */
export function rehypeArticleImages() {
  const metadata = new Map<string, Promise<{ width: number; height: number } | null>>();
  const resolvePublicFile = (src: string) => {
    const publicRoot = resolve("public");
    let filename: string;
    try {
      filename = resolve(publicRoot, `.${decodeURIComponent(src.split(/[?#]/)[0])}`);
    } catch {
      return null;
    }
    return filename.startsWith(publicRoot + sep) ? filename : null;
  };
  const dimensionsFor = (src: string) => {
    const filename = resolvePublicFile(src);
    if (!filename) return Promise.resolve(null);
    let pending = metadata.get(filename);
    if (!pending) {
      pending = sharp(filename)
        .metadata()
        .then((info) => {
          const { width, height } = info.autoOrient;
          return width > 0 && height > 0 ? { width, height } : null;
        })
        .catch(() => null);
      metadata.set(filename, pending);
    }
    return pending;
  };
  return async (tree: Root) => {
    const visit = async (node: Root | Element) => {
      if (!Array.isArray(node.children)) return;
      if (
        node.type === "element" &&
        String(node.properties.className ?? "")
          .split(/[\s,]+/)
          .includes("not-prose")
      )
        return;
      node.children = await Promise.all(
        node.children.map(async (child) => {
          if (child.type === "element" && child.tagName === "img") {
            const src = child.properties?.src;
            if (typeof src === "string" && src.startsWith("/blog/")) {
              child.properties.loading ??= "lazy";
              child.properties.decoding ??= "async";
              if (!child.properties.width || !child.properties.height) {
                const size = await dimensionsFor(src);
                if (size) {
                  child.properties.width ??= size.width;
                  child.properties.height ??= size.height;
                }
              }
              const filename = resolvePublicFile(src);
              const cleanSrc = src.split(/[?#]/)[0];
              if (
                filename &&
                /\.png$/i.test(cleanSrc) &&
                !(node.type === "element" && node.tagName === "picture") &&
                existsSync(filename.replace(/\.png$/i, "-800.webp")) &&
                existsSync(filename.replace(/\.png$/i, "-1600.webp"))
              ) {
                const base = cleanSrc.replace(/\.png$/i, "");
                child.properties.src = withBase(src);
                return {
                  type: "element",
                  tagName: "picture",
                  properties: {},
                  children: [
                    {
                      type: "element",
                      tagName: "source",
                      properties: {
                        type: "image/webp",
                        srcSet: [800, 1600].map((width) => `${withBase(`${base}-${width}.webp`)} ${width}w`).join(", "),
                        sizes: "(max-width: 720px) calc(100vw - 2rem), 990px",
                      },
                      children: [],
                    },
                    child,
                  ],
                };
              }
              child.properties.src = withBase(src);
            }
          }
          if (child.type === "element") await visit(child);
          return child;
        }),
      );
    };
    await visit(tree);
  };
}

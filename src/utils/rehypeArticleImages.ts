import type { Element, Root } from "hast";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import { withBase } from "./url.ts";

/**
 * Infer intrinsic width/height for local `/blog/` images from `public/` at build time
 * to prevent cumulative layout shift (CLS), and prefix `src` with Astro's `base`.
 */
export function rehypeArticleImages() {
  const metadata = new Map<string, Promise<{ width: number; height: number } | null>>();
  const dimensionsFor = (src: string) => {
    const publicRoot = resolve("public");
    let filename: string;
    try {
      filename = resolve(publicRoot, `.${decodeURIComponent(src.split(/[?#]/)[0])}`);
    } catch {
      return Promise.resolve(null);
    }
    if (!filename.startsWith(publicRoot + sep)) return Promise.resolve(null);
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

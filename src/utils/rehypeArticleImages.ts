import type { Element, Root } from "hast";
import { resolve, sep } from "node:path";
import sharp from "sharp";

/**
 * Keep published PNG URLs as fallbacks while serving responsive, lossless WebP
 * screenshots to browsers. All other article images are deferred until needed.
 */
const responsive = new Map([
  ["/blog/l3hctf-best-profile/01-profile-bypass-flow.png", [3420, 1736]],
  ["/blog/miniapp-audit/08-xcode-development-ui.png", [3422, 2148]],
  ["/blog/miniapp-audit/13-endpoints-parameters-analysis.png", [2788, 1786]],
]);

export function rehypeArticleImages() {
  const metadata = new Map<
    string,
    Promise<{ width: number; height: number } | null>
  >();
  const dimensionsFor = (src: string) => {
    const publicRoot = resolve("public");
    let filename: string;
    try {
      filename = resolve(
        publicRoot,
        `.${decodeURIComponent(src.split(/[?#]/)[0])}`,
      );
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
              const isFirstScreen =
                src === "/blog/l3hctf-best-profile/01-profile-bypass-flow.png";
              child.properties.loading = isFirstScreen ? "eager" : "lazy";
              child.properties.decoding = "async";
              // Preserve authored aspect ratios; infer only missing local dimensions.
              if (!child.properties.width || !child.properties.height) {
                const size = await dimensionsFor(src);
                if (size) {
                  child.properties.width ??= size.width;
                  child.properties.height ??= size.height;
                }
              }
              const dimensions = responsive.get(src);
              if (
                dimensions &&
                !(node.type === "element" && node.tagName === "picture")
              ) {
                const base = src.replace(/\.png$/, "");
                child.properties.width = dimensions[0];
                child.properties.height = dimensions[1];
                if (isFirstScreen) child.properties.fetchPriority = "high";
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
                        srcSet: [800, 1600]
                          .map((width) => `${base}-${width}.webp ${width}w`)
                          .join(", "),
                        sizes: "(max-width: 720px) calc(100vw - 2rem), 990px",
                      },
                      children: [],
                    },
                    child,
                  ],
                };
              }
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

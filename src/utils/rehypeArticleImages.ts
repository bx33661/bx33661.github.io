import type { Element, Root } from "hast";

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
  return (tree: Root) => {
    const visit = (node: Root | Element) => {
      if (!Array.isArray(node.children)) return;
      node.children = node.children.map((child) => {
        if (child.type === "element" && child.tagName === "img") {
          const src = child.properties?.src;
          if (typeof src === "string" && src.startsWith("/blog/")) {
            const isFirstScreen = src === "/blog/l3hctf-best-profile/01-profile-bypass-flow.png";
            child.properties.loading = isFirstScreen ? "eager" : "lazy";
            child.properties.decoding = "async";
            const dimensions = responsive.get(src);
            if (dimensions) {
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
                      srcSet: [800, 1600].map((width) => `${base}-${width}.webp ${width}w`).join(", "),
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
        if (child.type === "element") visit(child);
        return child;
      });
    };
    visit(tree);
  };
}

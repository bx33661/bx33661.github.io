import type { Root, Element } from "hast";

/**
 * Rehype plugin that demotes all <h1> to <h2> inside Markdown/MDX content.
 * This avoids duplicate <h1> on pages where the post title is already rendered
 * as the page's primary <h1>.
 */
export function rehypeDemoteHeadings() {
  return (tree: Root) => {
    const visit = (node: Root | Element) => {
      if (node.type === "element" && node.tagName === "h1") {
        node.tagName = "h2";
      }
      if ("children" in node && Array.isArray(node.children)) {
        node.children.forEach(child => {
          if (child.type === "element") {
            visit(child as Element);
          }
        });
      }
    };
    visit(tree);
  };
}

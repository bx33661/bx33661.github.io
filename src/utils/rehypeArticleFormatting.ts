import { SITE } from "../config.ts";
import type { Element, Root } from "hast";

const classes = (node: Element) => {
  const value = node.properties.className;
  return Array.isArray(value) ? value.map(String) : String(value ?? "").split(/\s+/);
};

/** Server-rendered overflow regions; don't change KaTeX internals or MDX islands. */
export function rehypeArticleFormatting() {
  const isZh = SITE.i18n.defaultLocale === "zh-CN";
  const labels = {
    table: isZh ? "表格，可横向滚动" : "Table; scroll horizontally",
    math: isZh ? "数学公式，可横向滚动" : "Math formula; scroll horizontally",
    inlineMath: isZh ? "行内公式，可横向滚动" : "Inline formula; scroll horizontally",
  };

  return (tree: Root) => {
    const visit = (node: Root | Element) => {
      node.children = node.children.map((child) => {
        if (child.type !== "element") return child;
        const tokens = classes(child);
        if (
          tokens.includes("not-prose") ||
          tokens.some((token) => ["article-table-scroll", "article-math-block", "article-inline-math"].includes(token))
        )
          return child;

        const displayMath = tokens.includes("katex-display");
        const inlineMath = tokens.includes("katex");
        if (!displayMath && !inlineMath) visit(child);
        const kind =
          child.tagName === "table" ? "table" : displayMath ? "math-block" : inlineMath ? "inline-math" : null;
        if (!kind) return child;
        const inline = kind === "inline-math";
        return {
          type: "element",
          tagName: inline ? "span" : "div",
          properties: {
            className: [`article-${kind === "table" ? "table-scroll" : kind}`],
            tabIndex: 0,
            ...(inline ? {} : { role: "region" }),
            ariaLabel: kind === "table" ? labels.table : inline ? labels.inlineMath : labels.math,
          },
          children: [child],
        } satisfies Element;
      });
    };
    visit(tree);
  };
}

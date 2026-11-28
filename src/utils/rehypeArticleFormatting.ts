import { SITE } from "../config.ts";
import type { Element, ElementContent, Root, Text } from "hast";

const classes = (node: Element) => {
  const value = node.properties.className;
  return Array.isArray(value) ? value.map(String) : String(value ?? "").split(/\s+/);
};

function plainText(node: Element | ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(plainText).join("");
  return "";
}

function inferResourceKind(label: string, url: string): string {
  if (/plugin|插件|extension/i.test(label) || /\/plugins?\//i.test(url)) return "plugin";
  if (/demo|演示|官网|website|live|preview/i.test(label)) return "demo";
  if (/paper|论文|arxiv|pdf/i.test(label) || /arxiv\.org|doi\.org|\.pdf$/i.test(url)) return "paper";
  if (/github\.com/i.test(url) || /repo|仓库|源码/i.test(label)) return "github";
  return "link";
}

function tryUpgradeLeadingResourceQuote(tree: Root, ariaLabel: string) {
  const firstElementIndex = tree.children.findIndex(
    (child) => !(child.type === "text" && child.value.trim() === ""),
  );
  if (firstElementIndex < 0) return;
  const candidate = tree.children[firstElementIndex];
  if (candidate?.type !== "element" || candidate.tagName !== "blockquote") return;
  const candidateClasses = classes(candidate);
  if (candidateClasses.includes("article-callout") || candidateClasses.includes("not-prose")) return;

  const elementChildren = candidate.children.filter(
    (child): child is Element => child.type === "element",
  );
  const strayText = candidate.children.some(
    (child) => child.type === "text" && child.value.trim() !== "",
  );
  if (strayText || elementChildren.length < 2 || elementChildren.length > 6) return;
  if (!elementChildren.every((el) => el.tagName === "p")) return;

  const parsedItems: { label: string; href: string; note: string; kind: string }[] = [];
  for (const p of elementChildren) {
    const meaningful = p.children.filter(
      (n) => !(n.type === "text" && n.value.trim() === ""),
    );
    if (meaningful.length < 2 || meaningful.length > 3) return;
    const first = meaningful[0];
    const last = meaningful[meaningful.length - 1];
    if (first?.type !== "element" || first.tagName !== "strong") return;
    if (last?.type !== "element" || last.tagName !== "a") return;
    if (meaningful.length === 3) {
      const mid = meaningful[1];
      if (mid?.type !== "text" || !/^\s*[:：·\-—]\s*$/.test(mid.value)) return;
    }
    const rawLabel = plainText(first).replace(/\s*[:：]\s*$/, "").trim();
    const href = String(last.properties?.href ?? "").trim();
    const note = plainText(last).trim();
    if (!rawLabel || !/^https?:\/\//i.test(href) || !note) return;
    parsedItems.push({
      label: rawLabel,
      href,
      note,
      kind: inferResourceKind(rawLabel, href),
    });
  }

  tree.children[firstElementIndex] = {
    type: "element",
    tagName: "nav",
    properties: {
      className: ["post-resources", "not-prose"],
      "data-pagefind-ignore": "",
      ariaLabel,
    },
    children: parsedItems.map(
      (item): Element => ({
        type: "element",
        tagName: "a",
        properties: {
          href: item.href,
          target: "_blank",
          rel: ["noopener", "noreferrer"],
          className: ["post-resource-card"],
        },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: {
              className: ["post-resource-icon"],
              "data-resource-kind": item.kind,
              ariaHidden: "true",
            },
            children: [],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["post-resource-body"] },
            children: [
              {
                type: "element",
                tagName: "span",
                properties: { className: ["post-resource-label"] },
                children: [{ type: "text", value: item.label } satisfies Text],
              },
              {
                type: "element",
                tagName: "span",
                properties: { className: ["post-resource-note"] },
                children: [{ type: "text", value: item.note } satisfies Text],
              },
            ],
          },
          {
            type: "element",
            tagName: "span",
            properties: { className: ["post-resource-arrow"], ariaHidden: "true" },
            children: [{ type: "text", value: "↗" } satisfies Text],
          },
        ],
      }),
    ),
  };
}

/** Server-rendered overflow regions; don't change KaTeX internals or MDX islands. */
export function rehypeArticleFormatting() {
  const isZh = SITE.i18n.defaultLocale === "zh-CN";
  const labels = {
    table: isZh ? "表格，可横向滚动" : "Table; scroll horizontally",
    math: isZh ? "数学公式，可横向滚动" : "Math formula; scroll horizontally",
    inlineMath: isZh ? "行内公式，可横向滚动" : "Inline formula; scroll horizontally",
    resources: isZh ? "项目与相关资源" : "Project & resources",
  };

  return (tree: Root) => {
    tryUpgradeLeadingResourceQuote(tree, labels.resources);
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

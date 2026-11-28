import type { Element, ElementContent } from "hast";

interface LongCodeContext {
  source?: string;
}

function countAstLines(node: Element): number {
  let lines = 0;
  const walk = (item: ElementContent) => {
    if (item.type !== "element") return;
    const classes = item.properties?.class ?? item.properties?.className;
    const classList = Array.isArray(classes) ? classes.map(String) : String(classes ?? "").split(/\s+/);
    if (classList.includes("line")) {
      lines += 1;
      return;
    }
    for (const child of item.children ?? []) walk(child);
  };
  for (const child of node.children ?? []) walk(child);
  return lines;
}

/**
 * Shiki transformer marking code blocks reaching `minLines` as collapsible at build time
 * so initial CSS can cap height immediately without layout shift upon hydration.
 */
export const transformerLongCode = (minLines = 36) => ({
  name: "long-code",
  pre(this: LongCodeContext, node: Element) {
    const sourceLines =
      typeof this.source === "string" && this.source.length > 0
        ? this.source.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n").length
        : 0;
    const lineCount = sourceLines || countAstLines(node);
    if (lineCount < minLines) return;
    node.properties["data-code-collapsible"] = "true";
    node.properties["data-code-lines"] = String(lineCount);
  },
});

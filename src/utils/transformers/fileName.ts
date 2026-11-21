import type { Element, Parent } from "hast";

interface TransformerContext {
  options?: { meta?: { __raw?: string } };
  addClassToHast: (node: Element, classes: string) => void;
}

export interface FileNameTransformerOptions {
  style?: "v1" | "v2";
  hideDot?: boolean;
}

/**
 * Shiki transformer adding `file="filename"` badges on code blocks.
 * Leaves blocks without a `file=` meta attribute untouched.
 */
export const transformerFileName = ({ style = "v2", hideDot = false }: FileNameTransformerOptions = {}) => ({
  pre(this: TransformerContext, node: Element) {
    const raw = this.options?.meta?.__raw?.split(/\s+/);
    if (!raw) return;

    const metaMap = new Map<string, string>();
    for (const item of raw) {
      const eqIndex = item.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = item.slice(0, eqIndex);
      const value = item.slice(eqIndex + 1).replace(/["'`]/g, "");
      if (value) metaMap.set(key, value);
    }

    const file = metaMap.get("file");
    if (!file) return;

    const fileNameOffset = style === "v1" ? "0.75rem" : "-0.75rem";
    const existingStyle = typeof node.properties.style === "string" ? node.properties.style.trim() : "";
    const prefix = existingStyle && !existingStyle.endsWith(";") ? `${existingStyle};` : existingStyle;
    node.properties.style = `${prefix}--file-name-offset: ${fileNameOffset};`;

    this.addClassToHast(node, style === "v1" ? "mt-8 rounded-tl-none" : "mt-8");

    (node as Parent).children.push({
      type: "element",
      tagName: "span",
      properties: {
        "data-code-filename": file,
        class: [
          "code-file-badge absolute py-1 text-foreground text-xs font-medium leading-4",
          hideDot
            ? "px-2"
            : "pl-4 pr-2 before:inline-block before:size-1 before:bg-green-500 before:rounded-full before:absolute before:top-[45%] before:left-2",
          style === "v1"
            ? "left-0 -top-6 rounded-t-md border border-b-0 bg-muted/50"
            : "left-2 top-(--file-name-offset) border rounded-md bg-background",
        ],
      },
      children: [{ type: "text", value: file }],
    });
  },
});

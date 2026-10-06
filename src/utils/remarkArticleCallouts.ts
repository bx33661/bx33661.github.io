import type { Root, Blockquote, Paragraph, RootContent } from "mdast";
import type {} from "mdast-util-to-hast";

const labels = {
  NOTE: "说明",
  TIP: "提示",
  IMPORTANT: "重要",
  WARNING: "注意",
  CAUTION: "警告",
} as const;

/** GitHub-style alerts, while keeping ordinary quotes and their content intact. */
export function remarkArticleCallouts() {
  return (tree: Root) => {
    const visit = (node: Root | RootContent) => {
      if (node.type === "blockquote") {
        const quote = node as Blockquote;
        const paragraph = quote.children[0];
        const first =
          paragraph?.type === "paragraph" ? paragraph.children[0] : null;
        if (paragraph?.type === "paragraph" && first?.type === "text") {
          const match =
            /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r?\n|$)/i.exec(
              first.value,
            );
          if (match) {
            const kind = match[1].toUpperCase() as keyof typeof labels;
            first.value = first.value.slice(match[0].length);
            if (!first.value) paragraph.children.shift();
            if (!paragraph.children.length) quote.children.shift();
            quote.data = {
              ...quote.data,
              hProperties: {
                ...quote.data?.hProperties,
                className: ["article-callout"],
                "data-callout": kind.toLowerCase(),
              },
            };
            const title: Paragraph = {
              type: "paragraph",
              data: { hProperties: { className: ["article-callout-title"] } },
              children: [{ type: "text", value: labels[kind] }],
            };
            quote.children.unshift(title);
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) visit(child as RootContent);
      }
    };
    visit(tree);
  };
}

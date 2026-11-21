import type { Root, Paragraph, RootContent } from "mdast";
import type {} from "mdast-util-to-hast";

const CALLOUT_LABELS = {
  NOTE: "说明",
  TIP: "提示",
  IMPORTANT: "重要",
  WARNING: "注意",
  CAUTION: "警告",
} as const;

type CalloutKind = keyof typeof CALLOUT_LABELS;

function isCalloutKind(value: string): value is CalloutKind {
  return Object.hasOwn(CALLOUT_LABELS, value);
}

/** GitHub-style alerts, while keeping ordinary quotes and their content intact. */
export function remarkArticleCallouts() {
  return (tree: Root) => {
    const visit = (node: Root | RootContent) => {
      if (node.type === "blockquote") {
        const paragraph = node.children[0];
        const first = paragraph?.type === "paragraph" ? paragraph.children[0] : null;
        if (paragraph?.type === "paragraph" && first?.type === "text") {
          const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\r?\n|$)/i.exec(first.value);
          const candidate = match?.[1].toUpperCase();
          if (match && candidate && isCalloutKind(candidate)) {
            first.value = first.value.slice(match[0].length);
            if (!first.value) paragraph.children.shift();
            if (!paragraph.children.length) node.children.shift();
            node.data = {
              ...node.data,
              hProperties: {
                ...node.data?.hProperties,
                className: ["article-callout"],
                "data-callout": candidate.toLowerCase(),
              },
            };
            const title: Paragraph = {
              type: "paragraph",
              data: { hProperties: { className: ["article-callout-title"] } },
              children: [{ type: "text", value: CALLOUT_LABELS[candidate] }],
            };
            node.children.unshift(title);
          }
        }
      }
      if ("children" in node) {
        for (const child of node.children) visit(child);
      }
    };
    visit(tree);
  };
}

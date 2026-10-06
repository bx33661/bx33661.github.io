import { unified, type ShikiConfig } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./transformers/fileName.js";
import { rehypeDemoteHeadings } from "./rehypeDemoteHeadings.ts";
import { rehypeArticleImages } from "./rehypeArticleImages.ts";
import { remarkArticleCallouts } from "./remarkArticleCallouts.ts";
import { rehypeArticleFormatting } from "./rehypeArticleFormatting.ts";

/** Shared by the actual MD/MDX build and format regression fixtures. */
export const articleMarkdown = {
  processor: unified({
    gfm: true,
    remarkPlugins: [
      remarkMath,
      remarkArticleCallouts,
      remarkToc,
      [remarkCollapse, { test: "Table of contents" }],
    ],
    remarkRehype: {
      footnoteLabel: "注释",
      footnoteBackLabel: "返回正文",
    },
    rehypePlugins: [
      rehypeDemoteHeadings,
      rehypeArticleImages,
      [rehypeKatex, { output: "htmlAndMathml", trust: false }],
      rehypeArticleFormatting,
    ],
  }),
  shikiConfig: {
    themes: { light: "min-light", dark: "github-dark-default" },
    defaultColor: false,
    wrap: false,
    transformers: [
      transformerFileName({ style: "v2", hideDot: false }),
      transformerNotationHighlight(),
      transformerNotationWordHighlight(),
      transformerNotationDiff({ matchAlgorithm: "v3" }),
    ],
  } satisfies ShikiConfig,
};

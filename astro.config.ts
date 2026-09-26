import { defineConfig, envField, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import mermaid from "astro-mermaid";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { rehypeDemoteHeadings } from "./src/utils/rehypeDemoteHeadings";
import { rehypeArticleImages } from "./src/utils/rehypeArticleImages";
import { SITE } from "./src/config.ts";
import securityToolbarIntegration from "./src/plugins/security-toolbar";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  prefetch: {
    defaultStrategy: "hover",
  },
  integrations: [
    react(),
    mermaid({ autoTheme: true, enableLog: false }),
    mdx({
      extendMarkdownConfig: true,
    }),
    securityToolbarIntegration(),
  ],
  // Astro 7 defaults to Sätteri; keep unified so existing remark/rehype plugins still work.
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkMath,
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeDemoteHeadings, rehypeArticleImages, rehypeKatex],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "github-dark-default" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Wotfard",
      cssVariable: "--font-wotfard-native",
      options: {
        variants: [{ src: ["./src/assets/fonts/wotfard-regular-webfont.woff2"], weight: 400, style: "normal" }],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Cartograph CF",
      cssVariable: "--font-cartograph-native",
      options: {
        variants: [{ src: ["./src/assets/fonts/cartograph-cf-regular-webfont.woff2"], weight: 400, style: "normal" }],
      },
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
});

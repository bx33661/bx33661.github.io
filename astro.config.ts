import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import mermaid from "astro-mermaid";
import tailwindcss from "@tailwindcss/vite";
import { articleMarkdown } from "./src/utils/articleMarkdown";
import { SITE } from "./src/config.ts";
import securityToolbarIntegration from "./src/plugins/security-toolbar";

export default defineConfig({
  site: process.env.SITE || SITE.website,
  base: process.env.BASE_URL || SITE.base || "/",
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
  markdown: articleMarkdown,
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep generated JS same-origin/external so ClientRouter respects strict CSP.
      assetsInlineLimit: (filePath) => (/\.m?js$/.test(filePath) ? false : undefined),
    },
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
      name: "Plus Jakarta Sans",
      cssVariable: "--font-sans-native",
      options: {
        variants: [
          {
            src: ["./node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2"],
            weight: "200 800",
            style: "normal",
          },
          {
            src: ["./node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-wght-normal.woff2"],
            weight: "200 800",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "JetBrains Mono",
      cssVariable: "--font-mono-native",
      options: {
        variants: [
          {
            src: ["./node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"],
            weight: "100 800",
            style: "normal",
          },
          {
            src: ["./node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-ext-wght-normal.woff2"],
            weight: "100 800",
            style: "normal",
          },
        ],
      },
    },
  ],
});

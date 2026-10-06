import { defineConfig, envField, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import mermaid from "astro-mermaid";
import tailwindcss from "@tailwindcss/vite";
import { articleMarkdown } from "./src/utils/articleMarkdown";
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
  markdown: articleMarkdown,
  vite: {
    plugins: [tailwindcss()],
    build: {
      // ClientRouter inserts a data: module barrier for inline modules. Keep
      // generated JS same-origin/external so navigation respects our CSP;
      // images and CSS retain Vite's normal inline-size behavior.
      assetsInlineLimit: (filePath) => /\.m?js$/.test(filePath) ? false : undefined,
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

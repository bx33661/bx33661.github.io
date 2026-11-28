import type { APIRoute } from "astro";
import { SITE } from "@/config.ts";
import { DEFAULT_LOCALE, defaultDescriptionForLocale } from "@/i18n";
import { withBase } from "@/utils/url";

export const GET: APIRoute = () => {
  const manifest = {
    name: SITE.title,
    short_name: SITE.title,
    description: defaultDescriptionForLocale(DEFAULT_LOCALE),
    icons: [
      {
        src: withBase("/brand/orbit-logo-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBase("/brand/orbit-logo-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBase(SITE.appleTouchIcon),
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    start_url: withBase("/"),
    theme_color: "#121212",
    background_color: "#121212",
    display: "standalone",
    orientation: "portrait-primary",
    scope: withBase("/"),
    lang: DEFAULT_LOCALE,
    categories: ["technology", "education", "productivity"],
    screenshots: [
      {
        src: withBase("/og.png"),
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    shortcuts: [
      {
        name: "Posts",
        short_name: "Posts",
        description: "Browse the latest technical articles",
        url: withBase("/blog/"),
        icons: [{ src: withBase("/brand/orbit-logo-192.png"), sizes: "192x192" }],
      },
      ...(SITE.features.galleries
        ? [
            {
              name: "Galleries",
              short_name: "Galleries",
              description: "Explore visual collections",
              url: withBase("/galleries/"),
              icons: [{ src: withBase("/brand/orbit-logo-192.png"), sizes: "192x192" }],
            },
          ]
        : []),
    ],
    related_applications: [
      {
        platform: "web",
        url: SITE.href,
      },
    ],
    prefer_related_applications: false,
  };

  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};

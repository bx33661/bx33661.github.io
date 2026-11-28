import type { APIRoute } from "astro";
import { SITE } from "@/config.ts";
import { withBase } from "@/utils/url";

export const GET: APIRoute = ({ site }) => {
  const origin = new URL((site ?? SITE.website).toString()).origin;
  const sitemaps = ["sitemap-index.xml", "sitemap.xml", "image-sitemap.xml"].map(
    (file) => `Sitemap: ${origin}${withBase(`/${file}`)}`,
  );

  const offlinePath = withBase("/offline/");
  const body = `User-agent: *
Allow: /
Disallow: ${offlinePath}

${sitemaps.join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

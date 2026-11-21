import type { APIRoute } from "astro";
import { SITE } from "@/config.ts";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? SITE.website;
  const sitemaps = ["sitemap-index.xml", "sitemap.xml", "image-sitemap.xml"].map(
    (file) => `Sitemap: ${new URL(file, base).href}`,
  );

  const body = `User-agent: Baiduspider
Allow: /
Disallow: /offline/

User-agent: *
Allow: /
Disallow: /offline/

${sitemaps.join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

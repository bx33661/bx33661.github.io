import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapIndexURL: URL, sitemapURL: URL, imageSitemapURL: URL) => `
User-agent: Baiduspider
Allow: /
Disallow: /search/
Disallow: /offline/

User-agent: *
Allow: /
Disallow: /search/
Disallow: /offline/

Sitemap: ${sitemapIndexURL.href}
Sitemap: ${sitemapURL.href}
Sitemap: ${imageSitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapIndexURL = new URL("sitemap-index.xml", site);
  const sitemapURL = new URL("sitemap.xml", site);
  const imageSitemapURL = new URL("image-sitemap.xml", site);
  return new Response(getRobotsTxt(sitemapIndexURL, sitemapURL, imageSitemapURL));
};

import type { APIRoute } from 'astro'

const getRobotsTxt = (sitemapURL: URL, sitemapIndexURL: URL, imageSitemapURL: URL) => `
User-agent: *
Allow: /

# Keep crawler focus on public content
Disallow: /admin/
Disallow: /api/
Disallow: /tmp/
Disallow: /temp/

Sitemap: ${sitemapIndexURL.href}
Sitemap: ${sitemapURL.href}
Sitemap: ${imageSitemapURL.href}
`

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap.xml', site)
  const sitemapIndexURL = new URL('sitemap-index.xml', site)
  const imageSitemapURL = new URL('image-sitemap.xml', site)
  return new Response(getRobotsTxt(sitemapURL, sitemapIndexURL, imageSitemapURL))
}

import { SITE } from '@/config.ts'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const site = context.site ?? SITE.website
  const baseUrl = site.toString().endsWith('/') ? site.toString().slice(0, -1) : site.toString()

  const sitemaps = [
    {
      loc: `${baseUrl}/sitemap.xml`
    },
    {
      loc: `${baseUrl}/image-sitemap.xml`
    }
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    sitemap => `  <sitemap>
    <loc>${sitemap.loc}</loc>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
} 

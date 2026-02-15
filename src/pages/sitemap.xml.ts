import { SITE } from '@/consts'
import type { APIContext } from 'astro'
import { getAllPostSlugs, getAllProjectSlugs, getAllTags } from '@/lib/data-utils'

export async function GET(context: APIContext) {
  try {
    const postSlugs = await getAllPostSlugs()
    const projects = await getAllProjectSlugs()
    const tags = await getAllTags()
    const site = context.site ?? SITE.href
    const baseUrl = site.toString().endsWith('/') ? site.toString().slice(0, -1) : site.toString()

    const staticPages = [
      {
        url: `${baseUrl}/`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: `${baseUrl}/projects`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        url: `${baseUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: '0.8'
      }
    ]

    const blogPosts = postSlugs.map(({ slug, post }) => ({
      url: `${baseUrl}/blog/${slug}/`,
      lastmod: post.data.date.toISOString(),
      changefreq: 'monthly',
      priority: '0.6'
    }))

    const projectPosts = projects.map(({ slug, project }) => ({
      url: `${baseUrl}/projects/${slug}/`,
      lastmod: (project.data.endDate ?? new Date()).toISOString(),
      changefreq: 'monthly',
      priority: '0.6'
    }))

    const tagUrls = Array.from(tags, ([tag]) => ({
      url: `${baseUrl}/tags/${tag}/`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '0.5'
    }))

    const allUrls = [...staticPages, ...projectPosts, ...blogPosts, ...tagUrls]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls
  .map(
    page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    // 静默处理错误，避免在生产环境中暴露敏感信息
    // 可选：发送到错误监控服务
    return new Response('Internal Server Error', { status: 500 })
  }
}

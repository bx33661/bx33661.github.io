import { SITE } from '@/consts'
import type { APIContext } from 'astro'
import {
  getAllNotes,
  getAllNoteSlugs,
  getAllPosts,
  getAllPostSlugs,
  getAllTags,
} from '@/lib/data-utils'

function buildUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment)
}

export async function GET(context: APIContext) {
  try {
    const postSlugs = await getAllPostSlugs()
    const noteSlugs = await getAllNoteSlugs()
    const allPosts = await getAllPosts()
    const allNotes = await getAllNotes()
    const tags = await getAllTags()
    const site = context.site ?? SITE.href
    const baseUrl = site.toString().endsWith('/') ? site.toString().slice(0, -1) : site.toString()
    const now = new Date().toISOString()

    const staticPages = [
      {
        url: buildUrl(baseUrl, '/'),
        lastmod: now,
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        url: buildUrl(baseUrl, '/blog/'),
        lastmod: now,
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        url: buildUrl(baseUrl, '/notes/'),
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        url: buildUrl(baseUrl, '/album/'),
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        url: buildUrl(baseUrl, '/about/'),
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        url: buildUrl(baseUrl, '/archive/'),
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.7'
      },
      {
        url: buildUrl(baseUrl, '/friends/'),
        lastmod: now,
        changefreq: 'monthly',
        priority: '0.6'
      },
      {
        url: buildUrl(baseUrl, '/tags/'),
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.6'
      },
      {
        url: buildUrl(baseUrl, '/notes/list/'),
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.6'
      }
    ]

    const blogPosts = postSlugs.map(({ slug, post }) => ({
      url: buildUrl(baseUrl, `/blog/${encodePathSegment(slug)}/`),
      lastmod: post.data.date.toISOString(),
      changefreq: 'monthly',
      priority: '0.7'
    }))

    const blogPageSize = 5
    const blogPageCount = Math.ceil(allPosts.length / blogPageSize)
    const blogPages = Array.from({ length: Math.max(blogPageCount - 1, 0) }, (_, index) => ({
      url: buildUrl(baseUrl, `/blog/${index + 2}/`),
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.6'
    }))

    const notes = noteSlugs.map(({ slug, note }) => ({
      url: buildUrl(baseUrl, `/notes/${encodePathSegment(slug)}/`),
      lastmod: note.data.date.toISOString(),
      changefreq: 'monthly',
      priority: '0.6'
    }))

    const notesPageSize = 5
    const notesPageCount = Math.ceil(allNotes.length / notesPageSize)
    const notePages = Array.from({ length: Math.max(notesPageCount - 1, 0) }, (_, index) => ({
      url: buildUrl(baseUrl, `/notes/list/${index + 2}/`),
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.5'
    }))

    const tagUrls = Array.from(tags, ([tag]) => ({
      url: buildUrl(baseUrl, `/tags/${encodePathSegment(tag)}/`),
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.5'
    }))

    const allUrls = [
      ...staticPages,
      ...blogPosts,
      ...blogPages,
      ...notes,
      ...notePages,
      ...tagUrls
    ]

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

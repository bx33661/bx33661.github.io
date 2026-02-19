import { SITE } from '@/consts'
import { GALLERY_IMAGES, buildGalleryImageSources } from '@/data/gallery'
import type { APIContext } from 'astro'
import { getAllNoteSlugs, getAllPostSlugs } from '@/lib/data-utils'

export async function GET(context: APIContext) {
  try {
    const postSlugs = await getAllPostSlugs()
    const notes = await getAllNoteSlugs()
    const site = context.site ?? SITE.href
    const baseUrl = site.toString().endsWith('/') ? site.toString().slice(0, -1) : site.toString()

    const images: Array<{
      loc: string
      image: Array<{
        loc: string
        title: string
        caption: string
      }>
    }> = []

    // 博客文章图片
    for (const { slug, post } of postSlugs) {
      const encodedSlug = encodeURIComponent(slug)
      images.push({
        loc: `${baseUrl}/blog/${encodedSlug}/`,
        image: [
          {
            loc: `${baseUrl}/image/${encodedSlug}.png`,
            title: post.data.title,
            caption: post.data.description || post.data.title
          }
        ]
      })
    }

    // 相册图片（只收录线上发布的优化图）
    images.push({
      loc: `${baseUrl}/album/`,
      image: GALLERY_IMAGES.map((item) => {
        const sources = buildGalleryImageSources(item)
        return {
          loc: `${baseUrl}${sources.originalSrc}`,
          title: item.title,
          caption: item.alt,
        }
      }),
    })

    // 笔记图片
    for (const { slug, note } of notes) {
      const encodedSlug = encodeURIComponent(slug)
      images.push({
        loc: `${baseUrl}/notes/${encodedSlug}/`,
        image: [
          {
            loc: `${baseUrl}/image/${encodedSlug}.png`,
            title: note.data.title,
            caption: note.data.description || note.data.title
          }
        ]
      })
    }

    // 静态图片
    images.push({
      loc: `${baseUrl}/`,
      image: [
        {
          loc: `${baseUrl}/logo.png`,
          title: `${SITE.title} - Site Image`,
          caption: SITE.description
        },
        {
          loc: `${baseUrl}/logo.ico`,
          title: `${SITE.title} Logo`,
          caption: `${SITE.title}网站标志`
        }
      ]
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images
  .map(
    page => `  <url>
    <loc>${page.loc}</loc>
${page.image
  .map(
    img => `    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:title><![CDATA[${img.title}]]></image:title>
      <image:caption><![CDATA[${img.caption}]]></image:caption>
    </image:image>`
  )
  .join('\n')}
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
    return new Response('Internal Server Error', { status: 500 })
  }
} 

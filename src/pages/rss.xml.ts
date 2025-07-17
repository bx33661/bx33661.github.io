import { SITE } from '@/consts'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPostSlugs } from '@/lib/data-utils'

export async function GET(context: APIContext) {
  try {
    const postSlugs = await getAllPostSlugs()

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: context.site ?? SITE.href,
      items: postSlugs.map(({ slug, post }) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/blog/${slug}/`,
      })),
    })
  } catch (error) {
    // 静默处理错误，避免在生产环境中暴露敏感信息
    // 可选：发送到错误监控服务
    return new Response('Internal Server Error', { status: 500 })
  }
}

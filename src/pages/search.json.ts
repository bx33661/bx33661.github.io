import type { APIRoute } from 'astro'
import { getAllPosts, getAllPostSlugs } from '@/lib/data-utils'

export const GET: APIRoute = async () => {
    const posts = await getAllPosts()
    const slugs = await getAllPostSlugs()

    const searchIndex = posts.map((post) => {
        const slugData = slugs.find(({ post: p }) => p.id === post.id)
        return {
            title: post.data.title,
            description: post.data.description,
            slug: slugData?.slug || post.data.slug || 'unknown',
            tags: post.data.tags || [],
            date: post.data.pubDatetime.toISOString(),
            // Include a snippet of content for search
            content: post.body?.slice(0, 500) || '',
        }
    })

    return new Response(JSON.stringify(searchIndex), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}

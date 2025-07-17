import { getCollection, type CollectionEntry } from 'astro:content'
import { generateUniqueSlug } from './utils'

export async function getAllPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

/**
 * 获取文章的slug，如果没有则生成一个随机的
 * @param post 文章对象
 * @param existingSlugs 已存在的slug数组
 * @returns 文章的slug
 */
export function getPostSlug(post: CollectionEntry<'blog'>, existingSlugs: string[] = []): string {
  // 如果文章已经有slug，直接返回
  if (post.data.slug) {
    return post.data.slug
  }
  
  // 否则生成一个唯一的随机slug
  return generateUniqueSlug(existingSlugs)
}

/**
 * 为所有文章生成slug映射
 * @returns Promise<Map<string, CollectionEntry<'blog'>>> slug到文章的映射
 */
export async function getPostSlugMap(): Promise<Map<string, CollectionEntry<'blog'>>> {
  const posts = await getAllPosts()
  const slugMap = new Map<string, CollectionEntry<'blog'>>()
  const usedSlugs: string[] = []
  
  // 首先处理已有slug的文章
  for (const post of posts) {
    if (post.data.slug) {
      slugMap.set(post.data.slug, post)
      usedSlugs.push(post.data.slug)
    }
  }
  
  // 然后为没有slug的文章生成随机slug
  for (const post of posts) {
    if (!post.data.slug) {
      const slug = generateUniqueSlug(usedSlugs)
      slugMap.set(slug, post)
      usedSlugs.push(slug)
    }
  }
  
  return slugMap
}

/**
 * 通过slug获取文章
 * @param slug 文章的slug
 * @returns 文章对象或null
 */
export async function getPostBySlug(slug: string): Promise<CollectionEntry<'blog'> | null> {
  const slugMap = await getPostSlugMap()
  return slugMap.get(slug) || null
}

/**
 * 获取所有文章的slug路径（用于静态路由生成）
 * @returns Promise<Array<{slug: string, post: CollectionEntry<'blog'>}>>
 */
export async function getAllPostSlugs(): Promise<Array<{slug: string, post: CollectionEntry<'blog'>}>> {
  const slugMap = await getPostSlugMap()
  return Array.from(slugMap.entries()).map(([slug, post]) => ({ slug, post }))
}

function getDayKey(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export async function getRecentPosts(
  count: number,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  const postsByDay = posts.reduce<Record<string, CollectionEntry<'blog'>[]>>((acc, post) => {
    const key = getDayKey(post.data.date)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(post)
    return acc
  }, {})

  const randomPostsPerDay = Object.values(postsByDay).map(postsForDay => {
    const randomIndex = Math.floor(Math.random() * postsForDay.length)
    return postsForDay[randomIndex]
  })

  const shuffled = randomPostsPerDay.sort(() => Math.random() - 0.5)

  return shuffled.slice(0, count)
}

export async function getAdjacentPosts(currentSlug: string): Promise<{
  prev: { post: CollectionEntry<'blog'>; slug: string } | null
  next: { post: CollectionEntry<'blog'>; slug: string } | null
}> {
  const slugs = await getAllPostSlugs()
  const currentIndex = slugs.findIndex(({ slug }) => slug === currentSlug)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const nextItem = currentIndex > 0 ? slugs[currentIndex - 1] : null
  const prevItem = currentIndex < slugs.length - 1 ? slugs[currentIndex + 1] : null

  return {
    next: nextItem ? { post: nextItem.post, slug: nextItem.slug } : null,
    prev: prevItem ? { post: prevItem.post, slug: prevItem.slug } : null,
  }
}

export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts()

  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag: string) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getSortedTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags()

  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export function groupPostsByYear(
  posts: CollectionEntry<'blog'>[],
): Record<string, CollectionEntry<'blog'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
      const year = post.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export async function getPostsByAuthor(
  authorId: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.authors?.includes(authorId))
}

export async function getPostsByTag(
  tag: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.tags?.includes(tag))
}

export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects')
  return projects
    .sort((a, b) => (b.data.startDate?.valueOf() ?? 0) - (a.data.startDate?.valueOf() ?? 0))
} 

export async function getProjectsFeaturedTags(maxCount: number): Promise<string[]> {
  const projects = await getAllProjects()
  const tags = new Set<string>()

  for (const project of projects) {
    if (project.data.tags) {
      for (const tag of project.data.tags) {
        tags.add(tag)
      }
    }
    if (tags.size >= maxCount) {
      break
    }
  }

  return Array.from(tags).slice(0, maxCount)
}
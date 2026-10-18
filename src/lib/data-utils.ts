import { getCollection, type CollectionEntry } from 'astro:content'
import { withCache } from './cache-utils'
import postFilter from '@/utils/postFilter'
import { isEntryLocale, type Locale } from '@/i18n'
import {
  resolveLegacyPostSlug,
  resolveLegacyNoteSlug,
} from '@/utils/legacySlug'
function getBlogDate(post: CollectionEntry<'blog'>): Date {
  const maybe = post.data as { pubDatetime?: Date; date?: Date }
  return maybe.pubDatetime || maybe.date || new Date(0)
}


function ensureUniqueSlug<T extends { id: string }>(
  desiredSlug: string,
  entry: T,
  slugMap: Map<string, T>,
): string {
  if (!slugMap.has(desiredSlug)) {
    return desiredSlug
  }

  let suffix = 2
  let candidate = `${desiredSlug}-${suffix}`
  while (slugMap.has(candidate) && slugMap.get(candidate)?.id !== entry.id) {
    suffix++
    candidate = `${desiredSlug}-${suffix}`
  }
  return candidate
}

export async function getAllPosts(locale: Locale = 'zh-CN'): Promise<CollectionEntry<'blog'>[]> {
  return withCache(`all-public-posts:${locale}`, async () => {
    const posts = await getCollection('blog')
    return posts
      .filter(postFilter)
      .filter((post) => isEntryLocale(post.data, locale))
      .sort((a, b) => getBlogDate(b).valueOf() - getBlogDate(a).valueOf())
  })
}

/**
 * 获取文章的slug，如果没有则按文件id生成稳定slug
 * @param post 文章对象
 * @returns 文章的slug
 */
export function getPostSlug(post: CollectionEntry<'blog'>): string {
  return resolveLegacyPostSlug(post)
}

/**
 * 为所有文章生成slug映射
 * @returns Promise<Map<string, CollectionEntry<'blog'>>> slug到文章的映射
 */
export async function getPostSlugMap(locale: Locale = 'zh-CN'): Promise<Map<string, CollectionEntry<'blog'>>> {
  const posts = await getAllPosts(locale)
  const slugMap = new Map<string, CollectionEntry<'blog'>>()

  for (const post of posts) {
    const desiredSlug = getPostSlug(post)
    const uniqueSlug = ensureUniqueSlug(desiredSlug, post, slugMap)
    slugMap.set(uniqueSlug, post)
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
export async function getAllPostSlugs(locale: Locale = 'zh-CN'): Promise<Array<{slug: string, post: CollectionEntry<'blog'>}>> {
  const slugMap = await getPostSlugMap(locale)
  return Array.from(slugMap.entries()).map(([slug, post]) => ({ slug, post }))
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

  return Array.from(tagCounts.entries())
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
      const year = getBlogDate(post).getFullYear().toString()
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

// Notes相关函数
export async function getAllNotes(locale: Locale = 'zh-CN'): Promise<CollectionEntry<'notes'>[]> {
  return withCache(`all-notes:${locale}`, async () => {
    const notes = await getCollection('notes')
    return notes
      .filter((note) => !note.data.draft)
      .filter((note) => isEntryLocale(note.data, locale))
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
  })
}

/**
 * 获取笔记的slug，如果没有则按文件id生成稳定slug
 * @param note 笔记对象
 * @returns 笔记的slug
 */
export function getNoteSlug(note: CollectionEntry<'notes'>): string {
  return resolveLegacyNoteSlug(note)
}

/**
 * 为所有笔记生成slug映射
 * @returns Promise<Map<string, CollectionEntry<'notes'>>> slug到笔记的映射
 */
export async function getNoteSlugMap(locale: Locale = 'zh-CN'): Promise<Map<string, CollectionEntry<'notes'>>> {
  const notes = await getAllNotes(locale)
  const slugMap = new Map<string, CollectionEntry<'notes'>>()

  for (const note of notes) {
    const desiredSlug = getNoteSlug(note)
    const uniqueSlug = ensureUniqueSlug(desiredSlug, note, slugMap)
    slugMap.set(uniqueSlug, note)
  }

  return slugMap
}

/**
 * 通过slug获取笔记
 * @param slug 笔记的slug
 * @returns 笔记对象或null
 */
export async function getNoteBySlug(slug: string): Promise<CollectionEntry<'notes'> | null> {
  const slugMap = await getNoteSlugMap()
  return slugMap.get(slug) || null
}

/**
 * 获取所有笔记的slug路径（用于静态路由生成）
 * @returns Promise<Array<{slug: string, note: CollectionEntry<'notes'>}>>
 */
export async function getAllNoteSlugs(locale: Locale = 'zh-CN'): Promise<Array<{slug: string, note: CollectionEntry<'notes'>}>> {
  const slugMap = await getNoteSlugMap(locale)
  return Array.from(slugMap.entries()).map(([slug, note]) => ({ slug, note }))
}

export async function getAdjacentNotes(currentSlug: string): Promise<{
  prev: { post: CollectionEntry<'notes'>; slug: string } | null
  next: { post: CollectionEntry<'notes'>; slug: string } | null
}> {
  const slugs = await getAllNoteSlugs()
  const currentIndex = slugs.findIndex(({ slug }) => slug === currentSlug)

  if (currentIndex === -1) {
    return { prev: null, next: null }
  }

  const nextItem = currentIndex > 0 ? slugs[currentIndex - 1] : null
  const prevItem = currentIndex < slugs.length - 1 ? slugs[currentIndex + 1] : null

  return {
    next: nextItem ? { post: nextItem.note, slug: nextItem.slug } : null,
    prev: prevItem ? { post: prevItem.note, slug: prevItem.slug } : null,
  }
}

/**
 * 获取所有笔记分类
 * @returns Promise<Map<string, number>> 分类名称到数量的映射
 */
export async function getAllNoteCategories(): Promise<Map<string, number>> {
  const notes = await getAllNotes()
  const categories = new Map<string, number>()
  
  for (const note of notes) {
    const category = note.data.category || '未分类'
    categories.set(category, (categories.get(category) || 0) + 1)
  }
  
  return categories
}

/**
 * 按分类获取笔记
 * @param category 分类名称
 * @returns Promise<CollectionEntry<'notes'>[]>
 */
export async function getNotesByCategory(category: string): Promise<CollectionEntry<'notes'>[]> {
  const notes = await getAllNotes()
  return notes.filter(note => (note.data.category || '未分类') === category)
}

/**
 * 获取笔记的所有标签
 * @returns Promise<Map<string, number>> 标签名称到数量的映射
 */
export async function getAllNoteTags(): Promise<Map<string, number>> {
  const notes = await getAllNotes()
  const tags = new Map<string, number>()
  
  for (const note of notes) {
    if (note.data.tags) {
      for (const tag of note.data.tags) {
        tags.set(tag, (tags.get(tag) || 0) + 1)
      }
    }
  }
  
  return tags
}

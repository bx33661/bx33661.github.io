import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, '')
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed()
  return `${readingTimeMinutes} min read`
}

/**
 * 生成随机字符串用作文章URL slug
 * @param length 字符串长度，默认8位
 * @returns 随机字符串
 */
export function generateRandomSlug(length: number = 8): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * 检查slug是否唯一（避免冲突）
 * @param slug 要检查的slug
 * @param existingSlugs 已存在的slug数组
 * @returns 是否唯一
 */
export function isSlugUnique(slug: string, existingSlugs: string[]): boolean {
  return !existingSlugs.includes(slug)
}

/**
 * 生成唯一的随机slug
 * @param existingSlugs 已存在的slug数组
 * @param length 字符串长度
 * @returns 唯一的随机slug
 */
export function generateUniqueSlug(existingSlugs: string[], length: number = 8): string {
  let slug: string
  let attempts = 0
  const maxAttempts = 100
  
  do {
    slug = generateRandomSlug(length)
    attempts++
    if (attempts > maxAttempts) {
      // 如果尝试太多次，增加长度
      length++
      attempts = 0
    }
  } while (!isSlugUnique(slug, existingSlugs))
  
  return slug
}

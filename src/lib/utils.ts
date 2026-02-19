import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, locale: string = 'zh-CN') {
  return Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * 格式化相对时间
 * @param date 日期
 * @param locale 语言环境
 */
export function formatRelativeTime(date: Date, locale: string = 'zh-CN'): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second')
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute')
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour')
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day')
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month')
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year')
  }
}

export function readingTime(html: string) {
  return `${readingTimeMinutes(html)} 分钟阅读`
}

export function readingTimeMinutes(markdown: string): number {
  if (!markdown?.trim()) {
    return 1
  }

  const fencedCodeRegex = /```[\s\S]*?```/g
  const inlineCodeRegex = /`[^`\n]+`/g
  const imageRegex = /!\[[^\]]*]\([^)]+\)/g
  const linkRegex = /\[([^\]]+)\]\([^)]+\)/g
  const cjkRegex = /[\u3400-\u4dbf\u4e00-\u9fff]/g
  const headingRegex = /^#{1,6}\s+/gm
  const listItemRegex = /^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/gm
  const tableRowRegex = /^\|.*\|\s*$/gm

  const codeBlocks = markdown.match(fencedCodeRegex) || []
  const inlineCodeCount = (markdown.replace(fencedCodeRegex, ' ').match(inlineCodeRegex) || []).length
  const imageCount = (markdown.match(imageRegex) || []).length
  const headingCount = (markdown.match(headingRegex) || []).length
  const listItemCount = (markdown.match(listItemRegex) || []).length
  const tableRowCount = (markdown.match(tableRowRegex) || []).length

  const codeContent = codeBlocks
    .map((block) => block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, ''))
    .join('\n')
  const codeLineCount = codeContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean).length
  const codeTokenCount = (codeContent.match(/[A-Za-z_][\w.-]*/g) || []).length

  const proseText = markdown
    .replace(fencedCodeRegex, ' ')
    .replace(inlineCodeRegex, ' ')
    .replace(imageRegex, ' ')
    .replace(linkRegex, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^>\s?/gm, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/^[-*+]\s+/gm, ' ')
    .replace(/^\d+\.\s+/gm, ' ')
    .replace(/[*_~]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const cjkCount = (proseText.match(cjkRegex) || []).length
  const nonCjkWordCount = (
    proseText
      .replace(cjkRegex, ' ')
      .match(/[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*/g) || []
  ).length

  // 技术文章通常包含术语、表格、代码块和步骤列表，阅读速度会显著低于纯叙述文本。
  const proseMinutes = cjkCount / 230 + nonCjkWordCount / 165
  const codeMinutes = codeLineCount / 26 + codeTokenCount / 400
  const inlineCodeMinutes = inlineCodeCount / 18
  const imageMinutes = Math.min(imageCount * 0.22, 6)
  const structureMinutes =
    headingCount * 0.05 + listItemCount * 0.01 + tableRowCount * 0.025 + codeBlocks.length * 0.1

  const totalMinutes = Math.ceil(
    proseMinutes + codeMinutes + inlineCodeMinutes + imageMinutes + structureMinutes
  )
  return Math.max(1, totalMinutes)
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 限制时间（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T
  }

  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }

  return obj
}

/**
 * 生成唯一ID
 * @param prefix 前缀
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 截断文本
 * @param text 文本
 * @param length 最大长度
 * @param suffix 后缀
 */
export function truncateText(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text
  return text.substring(0, length - suffix.length) + suffix
}

/**
 * 检查是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 获取URL参数
 * @param name 参数名
 * @param url URL字符串
 */
export function getUrlParam(name: string, url?: string): string | null {
  if (typeof window === 'undefined') return null

  const urlObj = new URL(url || window.location.href)
  return urlObj.searchParams.get(name)
}

/**
 * 设置URL参数
 * @param name 参数名
 * @param value 参数值
 * @param url URL字符串
 */
export function setUrlParam(name: string, value: string, url?: string): string {
  const urlObj = new URL(url || window.location.href)
  urlObj.searchParams.set(name, value)
  return urlObj.toString()
}

/**
 * 缓存工具函数
 * 用于优化数据获取性能
 */

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

/**
 * 缓存装饰器函数
 * @param key 缓存键
 * @param ttl 缓存时间（毫秒），默认5分钟
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cached = cache.get(key)
  const now = Date.now()

  // 检查缓存是否有效
  if (cached && now - cached.timestamp < cached.ttl) {
    return Promise.resolve(cached.data)
  }

  // 执行函数并缓存结果
  return fn().then(result => {
    cache.set(key, {
      data: result,
      timestamp: now,
      ttl
    })
    return result
  })
}

/**
 * 清除指定缓存
 * @param key 缓存键
 */
export function clearCache(key: string): void {
  cache.delete(key)
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  cache.clear()
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}
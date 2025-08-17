/**
 * 性能监控工具
 * 用于监控和优化应用性能
 */

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()

  /**
   * 开始性能监控
   * @param name 监控名称
   */
  start(name: string): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    })
  }

  /**
   * 结束性能监控
   * @param name 监控名称
   * @returns 持续时间（毫秒）
   */
  end(name: string): number {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return 0
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration
    })

    return duration
  }

  /**
   * 获取性能指标
   * @param name 监控名称
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name)
  }

  /**
   * 获取所有性能指标
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 清除指定指标
   * @param name 监控名称
   */
  clear(name: string): void {
    this.metrics.delete(name)
  }

  /**
   * 清除所有指标
   */
  clearAll(): void {
    this.metrics.clear()
  }

  /**
   * 记录并输出性能指标
   * @param name 监控名称
   */
  log(name: string): void {
    const metric = this.getMetric(name)
    if (metric && metric.duration) {
      console.log(`[Performance] ${name}: ${metric.duration.toFixed(2)}ms`)
    }
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

/**
 * 性能监控装饰器
 * @param name 监控名称
 */
export function withPerformanceMonitoring<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.start(name)
  
  return fn().finally(() => {
    const duration = performanceMonitor.end(name)
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }
  })
}

/**
 * 测量函数执行时间
 * @param fn 要测量的函数
 * @param name 监控名称
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  name?: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now()
  const result = await fn()
  const duration = performance.now() - startTime
  
  if (name && import.meta.env.DEV) {
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
  }
  
  return { result, duration }
}
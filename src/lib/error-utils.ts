/**
 * 错误处理工具
 * 统一处理应用中的错误
 */

export interface ErrorInfo {
  message: string
  code?: string
  stack?: string
  timestamp: Date
  context?: Record<string, any>
}

export class AppError extends Error {
  public readonly code: string
  public readonly timestamp: Date
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.timestamp = new Date()
    this.context = context
  }

  toJSON(): ErrorInfo {
    return {
      message: this.message,
      code: this.code,
      stack: this.stack,
      timestamp: this.timestamp,
      context: this.context
    }
  }
}

/**
 * 错误日志记录器
 */
class ErrorLogger {
  private errors: ErrorInfo[] = []
  private maxErrors = 100

  log(error: Error | AppError, context?: Record<string, any>): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
      stack: error.stack,
      timestamp: new Date(),
      context: error instanceof AppError ? error.context : context
    }

    this.errors.unshift(errorInfo)
    
    // 保持错误日志数量在限制内
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // 在开发环境下输出到控制台
    if (import.meta.env.DEV) {
      console.error('[Error]', errorInfo)
    }
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }

  getErrorsByCode(code: string): ErrorInfo[] {
    return this.errors.filter(error => error.code === code)
  }
}

// 全局错误日志记录器
export const errorLogger = new ErrorLogger()

/**
 * 安全执行函数，捕获并记录错误
 * @param fn 要执行的函数
 * @param fallback 出错时的回退值
 * @param context 错误上下文
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    errorLogger.log(error as Error, context)
    return fallback
  }
}

/**
 * 同步版本的安全执行函数
 */
export function safeExecuteSync<T>(
  fn: () => T,
  fallback: T,
  context?: Record<string, any>
): T {
  try {
    return fn()
  } catch (error) {
    errorLogger.log(error as Error, context)
    return fallback
  }
}

/**
 * 创建错误边界装饰器
 * @param fallback 出错时的回退值
 * @param context 错误上下文
 */
export function withErrorBoundary<T>(
  fallback: T,
  context?: Record<string, any>
) {
  return function (
    _target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args)
      } catch (error) {
        errorLogger.log(error as Error, {
          ...context,
          method: propertyName,
          args
        })
        return fallback
      }
    }
  }
}

/**
 * 验证函数参数
 * @param value 要验证的值
 * @param validator 验证函数
 * @param errorMessage 错误消息
 */
export function validateParam<T>(
  value: T,
  validator: (value: T) => boolean,
  errorMessage: string
): T {
  if (!validator(value)) {
    throw new AppError(errorMessage, 'VALIDATION_ERROR', { value })
  }
  return value
}

/**
 * 常用验证器
 */
export const validators = {
  notNull: <T>(value: T): boolean => value != null,
  notEmpty: (value: string): boolean => value.trim().length > 0,
  isArray: (value: any): boolean => Array.isArray(value),
  isObject: (value: any): boolean => typeof value === 'object' && value !== null,
  isString: (value: any): boolean => typeof value === 'string',
  isNumber: (value: any): boolean => typeof value === 'number' && !isNaN(value),
  isEmail: (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  isUrl: (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}
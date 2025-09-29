/**
 * 环境变量配置
 * 统一管理所有环境变量
 */

// 开发环境配置
export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD

// 站点配置
export const SITE_URL = import.meta.env.SITE || 'https://www.bx33661.com'
export const BASE_URL = import.meta.env.BASE_URL || '/'

// 分析工具配置
export const GOOGLE_ANALYTICS_ID = import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID
export const GTM_ID = import.meta.env.PUBLIC_GTM_ID
export const POSTHOG_KEY = import.meta.env.PUBLIC_POSTHOG_KEY
export const POSTHOG_HOST = import.meta.env.PUBLIC_POSTHOG_HOST

// 评论系统配置
export const GISCUS_REPO = import.meta.env.PUBLIC_GISCUS_REPO
export const GISCUS_REPO_ID = import.meta.env.PUBLIC_GISCUS_REPO_ID
export const GISCUS_CATEGORY = import.meta.env.PUBLIC_GISCUS_CATEGORY
export const GISCUS_CATEGORY_ID = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID

// 搜索配置
export const ALGOLIA_APP_ID = import.meta.env.PUBLIC_ALGOLIA_APP_ID
export const ALGOLIA_SEARCH_KEY = import.meta.env.PUBLIC_ALGOLIA_SEARCH_KEY
export const ALGOLIA_INDEX_NAME = import.meta.env.PUBLIC_ALGOLIA_INDEX_NAME

// 其他配置
export const ENABLE_COMMENTS = import.meta.env.PUBLIC_ENABLE_COMMENTS === 'true'
export const ENABLE_ANALYTICS = import.meta.env.PUBLIC_ENABLE_ANALYTICS === 'true'
export const ENABLE_SEARCH = import.meta.env.PUBLIC_ENABLE_SEARCH === 'true'

/**
 * 验证必需的环境变量
 */
export function validateEnv() {
  const requiredEnvs = []
  
  if (isProd) {
    if (!SITE_URL) requiredEnvs.push('SITE')
  }
  
  if (requiredEnvs.length > 0) {
    throw new Error(`Missing required environment variables: ${requiredEnvs.join(', ')}`)
  }
}

/**
 * 获取环境配置摘要
 */
export function getEnvSummary() {
  return {
    isDev,
    isProd,
    siteUrl: SITE_URL,
    baseUrl: BASE_URL,
    features: {
      comments: ENABLE_COMMENTS,
      analytics: ENABLE_ANALYTICS,
      search: ENABLE_SEARCH,
    }
  }
}
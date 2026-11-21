/**
 * 环境变量配置
 * 统一管理当前实际使用的环境变量
 */

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

export const SITE_URL = import.meta.env.SITE || "https://www.bx33661.com";
export const BASE_URL = import.meta.env.BASE_URL || "/";

export const GISCUS_REPO = import.meta.env.PUBLIC_GISCUS_REPO;
export const GISCUS_REPO_ID = import.meta.env.PUBLIC_GISCUS_REPO_ID;
export const GISCUS_CATEGORY = import.meta.env.PUBLIC_GISCUS_CATEGORY;
export const GISCUS_CATEGORY_ID = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID;

export const ENABLE_COMMENTS = import.meta.env.PUBLIC_ENABLE_COMMENTS === "true";
export const ENABLE_ANALYTICS = import.meta.env.PUBLIC_ENABLE_ANALYTICS === "true";
export const ENABLE_SEARCH = import.meta.env.PUBLIC_ENABLE_SEARCH === "true";

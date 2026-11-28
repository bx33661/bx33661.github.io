import { SITE } from "@/config.ts";

export const isDev = import.meta.env.DEV;
export const isProd = import.meta.env.PROD;

export const SITE_URL = import.meta.env.SITE || SITE.href;
export const BASE_URL = import.meta.env.BASE_URL || SITE.base || "/";

export const GISCUS_REPO = import.meta.env.PUBLIC_GISCUS_REPO;
export const GISCUS_REPO_ID = import.meta.env.PUBLIC_GISCUS_REPO_ID;
export const GISCUS_CATEGORY = import.meta.env.PUBLIC_GISCUS_CATEGORY;
export const GISCUS_CATEGORY_ID = import.meta.env.PUBLIC_GISCUS_CATEGORY_ID;

export const ENABLE_COMMENTS = import.meta.env.PUBLIC_ENABLE_COMMENTS === "true";
export const ENABLE_ANALYTICS = import.meta.env.PUBLIC_ENABLE_ANALYTICS === "true";
export const ENABLE_SEARCH = import.meta.env.PUBLIC_ENABLE_SEARCH !== "false" && SITE.features.search;

export const UMAMI_SCRIPT_URL = (import.meta.env.PUBLIC_UMAMI_SCRIPT_URL || "").trim();
export const UMAMI_WEBSITE_ID = (import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || "").trim();
export const PLAUSIBLE_DOMAIN = (import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN || "").trim();
export const PLAUSIBLE_SCRIPT_URL = (
  import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js"
).trim();
export const GA_MEASUREMENT_ID = (import.meta.env.PUBLIC_GA_MEASUREMENT_ID || "").trim();

function extractOrigin(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.origin;
    }
  } catch {
    return null;
  }
  return null;
}

/** Collect CSP origins only for explicitly enabled and configured analytics providers. */
export function getEnabledAnalyticsOrigins(): string[] {
  if (!ENABLE_ANALYTICS) return [];
  const origins = new Set<string>();

  if (UMAMI_SCRIPT_URL && UMAMI_WEBSITE_ID) {
    const origin = extractOrigin(UMAMI_SCRIPT_URL);
    if (origin) origins.add(origin);
  }
  if (PLAUSIBLE_DOMAIN && PLAUSIBLE_SCRIPT_URL) {
    const origin = extractOrigin(PLAUSIBLE_SCRIPT_URL);
    if (origin) origins.add(origin);
  }
  if (GA_MEASUREMENT_ID) {
    origins.add("https://www.googletagmanager.com");
    origins.add("https://www.google-analytics.com");
  }

  return [...origins];
}

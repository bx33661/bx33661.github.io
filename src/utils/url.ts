import { SITE } from "../config.ts";

function normalizeBase(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/, "");
}

/** Normalized base path without trailing slash ("" when deployed at root "/"). */
export function getBasePath(): string {
  const procBase = typeof process !== "undefined" ? process.env?.BASE_URL : undefined;
  const metaBase = typeof import.meta !== "undefined" ? import.meta.env?.BASE_URL : undefined;
  const envBase = procBase || (metaBase && metaBase !== "/" ? metaBase : undefined) || metaBase;
  return normalizeBase(envBase || SITE.base || "/");
}

/** Prefix an internal root-relative path with the configured Astro `base`. */
export function withBase(path: string): string {
  if (!path) return getBasePath() || "/";
  if (/^(?:[a-z]+:|\/\/|#)/i.test(path)) return path;

  const base = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  if (normalized === base || normalized.startsWith(`${base}/`)) return normalized;
  return normalized === "/" ? `${base}/` : `${base}${normalized}`;
}

/** Strip the configured Astro `base` prefix from a URL pathname. */
export function stripBase(pathname: string): string {
  const base = getBasePath();
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!base) return normalized;
  if (normalized === base || normalized === `${base}/`) return "/";
  if (normalized.startsWith(`${base}/`)) {
    return normalized.slice(base.length) || "/";
  }
  return normalized;
}

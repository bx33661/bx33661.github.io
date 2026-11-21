import { SITE } from "@/config.ts";
import type { Locale } from "@/i18n";

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    dateFormatterCache.set(key, formatter);
  }
  return formatter;
}

/** Format a Date using explicit locale + site timezone (`YYYY/MM/DD` style). */
export function formatSiteDate(date: Date, locale: Locale | string, timeZone: string = SITE.timezone): string {
  return getDateFormatter(locale, timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Format a Date in Datetime display style (`22 Mar, 2025`) respecting timezone. */
export function formatArticleDatetime(date: Date | string, timeZone: string = SITE.timezone): string {
  const value = date instanceof Date ? date : new Date(date);
  const parts = getDateFormatter("en-US", timeZone, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(value);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${partMap.day} ${partMap.month}, ${partMap.year}`;
}

/** Extract numeric year, zero-based month, and day of month in SITE.timezone. */
export function getSiteDateParts(
  date: Date,
  timeZone: string = SITE.timezone,
): { year: number; month: number; day: number } {
  const parts = getDateFormatter("en-CA", timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(partMap.year),
    month: Number(partMap.month) - 1,
    day: Number(partMap.day),
  };
}

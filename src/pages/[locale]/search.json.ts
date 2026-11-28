import type { APIRoute } from "astro";
import { SITE } from "@/config.ts";
import { BILINGUAL_ENABLED, SECONDARY_LOCALE, SECONDARY_PREFIX } from "@/i18n";
import { buildSearchIndexResponse } from "@/utils/searchIndex";

export function getStaticPaths() {
  return BILINGUAL_ENABLED && SITE.features.search ? [{ params: { locale: SECONDARY_PREFIX } }] : [];
}

export const GET: APIRoute = () =>
  buildSearchIndexResponse(SECONDARY_LOCALE, { includeNotes: SITE.features.notes });

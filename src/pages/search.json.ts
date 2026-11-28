import type { APIRoute } from "astro";
import { SITE } from "@/config.ts";
import { DEFAULT_LOCALE } from "@/i18n";
import { buildSearchIndexResponse } from "@/utils/searchIndex";

export const GET: APIRoute = () =>
  buildSearchIndexResponse(DEFAULT_LOCALE, { includeNotes: SITE.features.notes });

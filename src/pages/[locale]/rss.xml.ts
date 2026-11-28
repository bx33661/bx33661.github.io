import type { APIContext } from "astro";
import { BILINGUAL_ENABLED, SECONDARY_LOCALE, SECONDARY_PREFIX } from "@/i18n";
import { buildRssResponse } from "@/utils/rss";

export function getStaticPaths() {
  return BILINGUAL_ENABLED ? [{ params: { locale: SECONDARY_PREFIX } }] : [];
}

export async function GET(context: APIContext) {
  return buildRssResponse(SECONDARY_LOCALE, context);
}

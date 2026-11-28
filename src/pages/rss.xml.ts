import type { APIContext } from "astro";
import { DEFAULT_LOCALE } from "@/i18n";
import { buildRssResponse } from "@/utils/rss";

export async function GET(context: APIContext) {
  return buildRssResponse(DEFAULT_LOCALE, context);
}

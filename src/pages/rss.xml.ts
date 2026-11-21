import type { APIContext } from "astro";
import { buildRssResponse } from "@/utils/rss";

export async function GET(context: APIContext) {
  return buildRssResponse("zh-CN", context);
}

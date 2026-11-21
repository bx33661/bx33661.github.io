import type { APIRoute } from "astro";
import { buildSearchIndexResponse } from "@/utils/searchIndex";

export const GET: APIRoute = () => buildSearchIndexResponse("zh-CN", { includeNotes: false });

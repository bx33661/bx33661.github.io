import type { APIRoute } from "astro";
import { buildSearchIndexResponse } from "@/utils/searchIndex";

export const GET: APIRoute = () => buildSearchIndexResponse("en", { includeNotes: true });

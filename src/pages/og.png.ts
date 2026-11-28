import type { APIRoute } from "astro";
import { generateOgImageForSite, pngResponse } from "@/utils/generateOgImages";

export const GET: APIRoute = async () => pngResponse(await generateOgImageForSite());

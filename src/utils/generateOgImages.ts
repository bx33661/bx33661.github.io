import { Resvg } from "@resvg/resvg-js";
import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config.ts";
import { DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getPath } from "./getPath";
import { ogImageForPost, ogImageForSite } from "./og-templates/card";
import { withBase } from "./url";

function svgBufferToPngBuffer(svg: string): Uint8Array {
  const resvg = new Resvg(svg);
  return resvg.render().asPng();
}

export async function generateOgImageForPost(post: CollectionEntry<"blog">): Promise<Uint8Array> {
  return svgBufferToPngBuffer(await ogImageForPost(post));
}

export async function generateOgImageForSite(): Promise<Uint8Array> {
  return svgBufferToPngBuffer(await ogImageForSite());
}

export function pngResponse(buffer: Uint8Array | Buffer): Response {
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
}

export function resolvePostOgImagePath(
  post: CollectionEntry<"blog">,
  postSlug: string,
  locale: Locale = DEFAULT_LOCALE,
): string | undefined {
  const { ogImage, cover } = post.data;
  if (ogImage?.src) return ogImage.src;
  if (cover) return withBase(cover);
  if (SITE.features.dynamicOgImage && locale === DEFAULT_LOCALE) {
    return withBase(`${getPath(post.id, post.filePath, true, postSlug)}index.png`);
  }
  return undefined;
}

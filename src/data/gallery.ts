import type { ImageMetadata } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { withBase } from "@/utils/url";

export interface GalleryImageItem {
  file: string;
  alt: string;
  title: string;
  date: string;
  width: number;
  height: number;
  shape?: "about-shot--wide" | "about-shot--tall" | "";
}

export interface GalleryImageWithSources extends GalleryImageItem {
  originalSrc: string;
  optimizedSrc: string;
  avifSrcSet: string;
  webpSrcSet: string;
  jpgSrcSet: string;
  renditionWidths: number[];
  largestWidth: number;
}

export interface GallerySliderItem {
  src: string;
  srcSet: string;
  sizes: string;
  thumb: string;
  full: string;
  alt: string;
  title: string;
  date: string;
  width: number;
  height: number;
}

export interface PublishedGallery {
  slug: string;
  gallery: CollectionEntry<"galleries">;
}

export interface GalleryFolderImage {
  src: ImageMetadata;
  alt: string;
}

const GALLERY_RENDITION_WIDTHS = [640, 960, 1280, 1600] as const;
const CARD_MAX_WIDTH = 960;
const CARD_TARGET_WIDTH = 640;

const ALL_GALLERY_ASSET_IMAGES = import.meta.glob<{ default: ImageMetadata }>(
  "/src/data/galleries/**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}",
  { eager: true },
);

const stripExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, "");

const getRenditionWidths = (sourceWidth: number) => {
  const maxWidth = GALLERY_RENDITION_WIDTHS[GALLERY_RENDITION_WIDTHS.length - 1];
  const widths: number[] = GALLERY_RENDITION_WIDTHS.filter((step) => step <= sourceWidth);
  if (sourceWidth <= maxWidth && !widths.includes(sourceWidth)) {
    widths.push(sourceWidth);
  }
  if (widths.length === 0) widths.push(sourceWidth);
  return widths.sort((a, b) => a - b);
};

const buildSrcSet = (baseName: string, widths: number[], format: "avif" | "webp" | "jpg") =>
  widths.map((width) => `${withBase(`/gallery/optimized/${baseName}-w${width}.${format}`)} ${width}w`).join(", ");

export const toGallerySlug = (id: string): string =>
  id
    .replace(/\\/g, "/")
    .replace(/\/index\.(md|mdx)$/, "")
    .replace(/\.(md|mdx)$/, "");

export async function getPublishedGalleries(): Promise<PublishedGallery[]> {
  const galleries = await getCollection("galleries", ({ data }) => !data.draft);
  return galleries
    .map((gallery) => ({ slug: toGallerySlug(gallery.id), gallery }))
    .filter(({ slug }) => slug.length > 0);
}

export function getGalleryFolderImages(slug: string, fallbackTitle: string): GalleryFolderImage[] {
  const prefix = `/src/data/galleries/${slug}/`;
  return Object.entries(ALL_GALLERY_ASSET_IMAGES)
    .filter(([imagePath]) => {
      if (!imagePath.startsWith(prefix)) return false;
      const filename = imagePath.split("/").pop() ?? "";
      return !filename.startsWith("index.");
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([imagePath, mod]) => {
      const filename = imagePath.split("/").pop() ?? "";
      return {
        src: mod.default,
        alt: resolveGalleryImageAlt(filename, fallbackTitle),
      };
    });
}

export const buildGalleryImageSources = (item: GalleryImageItem): GalleryImageWithSources => {
  const baseName = stripExtension(item.file);
  const renditionWidths = getRenditionWidths(item.width);
  const largestWidth = renditionWidths[renditionWidths.length - 1];
  const largeJpg = withBase(`/gallery/optimized/${baseName}-w${largestWidth}.jpg`);

  return {
    ...item,
    originalSrc: largeJpg,
    optimizedSrc: largeJpg,
    avifSrcSet: buildSrcSet(baseName, renditionWidths, "avif"),
    webpSrcSet: buildSrcSet(baseName, renditionWidths, "webp"),
    jpgSrcSet: buildSrcSet(baseName, renditionWidths, "jpg"),
    renditionWidths,
    largestWidth,
  };
};

export function buildGallerySliderImages(): GallerySliderItem[] {
  return GALLERY_IMAGES.map((item) => {
    const baseName = stripExtension(item.file);
    const widths = getRenditionWidths(item.width);
    const cardWidths = widths.filter((w) => w <= CARD_MAX_WIDTH);
    const displayWidth = widths.find((w) => w >= CARD_TARGET_WIDTH) ?? widths[widths.length - 1];
    const largestWidth = widths[widths.length - 1];
    const cardSrc = withBase(`/gallery/optimized/${baseName}-w${displayWidth}.jpg`);

    return {
      src: cardSrc,
      srcSet: buildSrcSet(baseName, cardWidths, "webp") || buildSrcSet(baseName, cardWidths, "jpg"),
      sizes: "(max-width: 480px) 300px, (max-width: 768px) 350px, 500px",
      thumb: cardSrc,
      full: withBase(`/gallery/optimized/${baseName}-w${largestWidth}.jpg`),
      alt: item.alt,
      title: item.title,
      date: item.date,
      width: item.width,
      height: item.height,
    };
  });
}

export const GALLERY_IMAGES: GalleryImageItem[] = [
  {
    file: "01-celestial-horizon.jpg",
    alt: "Celestial Horizon — geometric orbital study",
    title: "Celestial Horizon",
    date: "2026-11-01",
    width: 1600,
    height: 1066,
    shape: "about-shot--wide",
  },
  {
    file: "02-meridian-study.jpg",
    alt: "Meridian Study — paper ink and cobalt arcs",
    title: "Meridian Study",
    date: "2026-10-20",
    width: 1200,
    height: 1500,
    shape: "about-shot--tall",
  },
  {
    file: "03-quiet-observatory.jpg",
    alt: "Quiet Observatory — night sky constellation grid",
    title: "Quiet Observatory",
    date: "2026-10-08",
    width: 1600,
    height: 1066,
    shape: "",
  },
  {
    file: "04-twilight-grid.jpg",
    alt: "Twilight Grid — minimal horizon lines",
    title: "Twilight Grid",
    date: "2026-09-24",
    width: 1200,
    height: 1500,
    shape: "",
  },
];

const GALLERY_IMAGE_BY_FILE = new Map(GALLERY_IMAGES.map((item) => [item.file, item]));

export function resolveGalleryImageAlt(filename: string, fallback: string): string {
  const curated = GALLERY_IMAGE_BY_FILE.get(filename);
  if (curated) {
    return curated.alt || curated.title;
  }
  return (
    stripExtension(filename)
      .replace(/^\d+[-_]?/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim() || fallback
  );
}

import type { ArticleSeries } from "@/utils/article-discovery";

/**
 * Curated reading series using stable article slugs in explicit order.
 * Entries marked `draft: true` or missing are omitted automatically.
 */
export const articleSeries: readonly ArticleSeries[] = [
  {
    title: "Astro Orbit Guide",
    slugs: ["getting-started-with-astro-orbit", "bilingual-and-series-architecture"],
  },
  {
    title: "Astro Orbit 使用指南",
    slugs: ["getting-started-with-astro-orbit-zh", "markdown-math-and-diagrams-showcase-zh"],
  },
];

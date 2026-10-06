import type { ArticleSeries } from "@/utils/article-discovery";

// Add a series here with existing, stable article slugs in explicit reading order.
// Hidden/unpublished entries are omitted by the discovery helper, not linked publicly.
export const articleSeries: readonly ArticleSeries[] = [
  {
    title: "Redis 学习与实践",
    slugs: ["redis-core-guide", "redis-lua-script-part2"],
  },
];

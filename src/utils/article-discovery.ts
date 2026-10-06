export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  href: string;
  tags: string[];
  publishedAt: Date;
  updatedAt?: Date | null;
  draft?: boolean;
};

export type ArticleSeries = { title: string; slugs: readonly string[] };

/** Keep display semantics consistent with chronological sorting. */
export function getArticleDates(publishedAt: Date, updatedAt?: Date | null) {
  const updated = updatedAt && updatedAt > publishedAt ? updatedAt : null;
  return { published: publishedAt, updated, latest: updated ?? publishedAt };
}

const normalizeTag = (tag: string) =>
  tag.trim().normalize("NFKC").toLowerCase();
const topicTags = (tags: string[]) =>
  new Set(
    tags
      .map(normalizeTag)
      .filter((tag) => tag && !["bx", "others", "其他"].includes(tag)),
  );
const isPublic = (post: ArticleSummary, now: Date) =>
  !post.draft && post.publishedAt <= now;

/** Rare shared topics rank above generic ones; no random ordering or cold-start filler. */
export function getRelatedArticles(
  current: ArticleSummary,
  posts: ArticleSummary[],
  limit = 3,
  now = new Date(),
) {
  const publicPosts = posts.filter((post) => isPublic(post, now));
  const currentTags = topicTags(current.tags);
  const frequency = new Map<string, number>();
  for (const post of publicPosts) {
    for (const tag of topicTags(post.tags))
      frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
  }
  return publicPosts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      score: [...topicTags(post.tags)]
        .filter((tag) => currentTags.has(tag))
        .reduce((sum, tag) => sum + 1 / (frequency.get(tag) ?? 1), 0),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        getArticleDates(b.post.publishedAt, b.post.updatedAt).latest.valueOf() -
          getArticleDates(
            a.post.publishedAt,
            a.post.updatedAt,
          ).latest.valueOf() ||
        a.post.id.localeCompare(b.post.id),
    )
    .slice(0, Math.max(0, Math.floor(limit)))
    .map((item) => item.post);
}

/** Series order is editorial data, never guessed from tags or publication dates. */
export function getArticleSeries(
  current: ArticleSummary,
  posts: ArticleSummary[],
  series: readonly ArticleSeries[],
  now = new Date(),
) {
  const entry = series.find((item) => item.slugs.includes(current.slug));
  if (!entry || !isPublic(current, now)) return null;
  const bySlug = new Map(
    posts
      .filter((post) => isPublic(post, now))
      .map((post) => [post.slug, post]),
  );
  const chapters = [...new Set(entry.slugs)].flatMap((slug) => {
    const post = bySlug.get(slug);
    return post ? [post] : [];
  });
  const index = chapters.findIndex((post) => post.id === current.id);
  if (index < 0 || chapters.length < 2) return null;
  return {
    title: entry.title,
    chapters,
    position: index + 1,
    previous: chapters[index - 1] ?? null,
    next: chapters[index + 1] ?? null,
  };
}

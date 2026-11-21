import { localizedPath, type Locale } from "@/i18n";
import { getAllNoteSlugs, getAllPostSlugs } from "@/lib/data-utils";
import { buildSearchExcerpt } from "@/utils/searchExcerpt";

export interface SearchIndexEntry {
  title: string;
  description: string;
  slug: string;
  href: string;
  tags: string[];
  date: string;
  content: string;
}

export async function buildSearchIndexResponse(
  locale: Locale,
  { includeNotes = false }: { includeNotes?: boolean } = {},
): Promise<Response> {
  const [posts, notes] = await Promise.all([
    getAllPostSlugs(locale),
    includeNotes ? getAllNoteSlugs(locale) : Promise.resolve([]),
  ]);

  const entries: SearchIndexEntry[] = [
    ...posts.map(({ slug, post }) => ({
      title: post.data.title,
      description: post.data.description,
      slug,
      href: localizedPath(`/blog/${encodeURIComponent(slug)}/`, locale),
      tags: post.data.tags ?? [],
      date: post.data.pubDatetime.toISOString(),
      content: buildSearchExcerpt(post.body),
    })),
    ...notes.map(({ slug, note }) => ({
      title: note.data.title,
      description: note.data.description,
      slug,
      href: localizedPath(`/notes/${encodeURIComponent(slug)}/`, locale),
      tags: note.data.tags ?? [],
      date: note.data.date.toISOString(),
      content: buildSearchExcerpt(note.body),
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

import { getAllPostSlugs, getAllNoteSlugs } from "@/lib/data-utils";

export async function GET() {
  const [posts, notes] = await Promise.all([getAllPostSlugs("en"), getAllNoteSlugs("en")]);
  const entries = [
    ...posts.map(({ slug, post }) => ({ ...post, section: "blog", slug })),
    ...notes.map(({ slug, note }) => ({ ...note, section: "notes", slug })),
  ].map(({ data, body, slug, section }) => ({
    title: data.title,
    description: data.description,
    tags: data.tags ?? [],
    slug,
    href: `/en/${section}/${encodeURIComponent(slug)}/`,
    content: body?.slice(0, 500) ?? "",
  }));
  return new Response(JSON.stringify(entries), { headers: { "Content-Type": "application/json" } });
}

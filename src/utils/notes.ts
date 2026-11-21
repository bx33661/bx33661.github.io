import type { CollectionEntry } from "astro:content";
import { isEntryLocale, type Locale } from "@/i18n";
import { getAllNoteSlugs } from "@/lib/data-utils";

export const NOTES_PAGE_SIZE = 10;

export type NoteWithSlug = {
  note: CollectionEntry<"notes">;
  slug: string;
};

export async function getAllNotesWithSlugs(locale: Locale = "zh-CN"): Promise<NoteWithSlug[]> {
  const notes = await getAllNoteSlugs(locale);
  return notes.filter(({ note: { data } }) => isEntryLocale(data, locale));
}

export async function getAdjacentNotes(
  currentSlug: string,
  locale: Locale = "zh-CN",
): Promise<{ prev: NoteWithSlug | null; next: NoteWithSlug | null }> {
  const notes = await getAllNotesWithSlugs(locale);
  const currentIndex = notes.findIndex((item) => item.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const next = currentIndex > 0 ? notes[currentIndex - 1] : null;
  const prev = currentIndex < notes.length - 1 ? notes[currentIndex + 1] : null;
  return { prev, next };
}

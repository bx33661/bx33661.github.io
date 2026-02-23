import { getCollection, type CollectionEntry } from "astro:content";
import { resolveLegacyNoteSlug } from "@/utils/legacySlug";

export type NoteWithSlug = {
  note: CollectionEntry<"notes">;
  slug: string;
};

export async function getAllNotesWithSlugs(): Promise<NoteWithSlug[]> {
  const notes = await getCollection("notes", ({ data }) => !data.draft);
  return notes
    .slice()
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((note) => ({ note, slug: resolveLegacyNoteSlug(note) }));
}

export async function getAdjacentNotes(
  currentSlug: string
): Promise<{ prev: NoteWithSlug | null; next: NoteWithSlug | null }> {
  const notes = await getAllNotesWithSlugs();
  const currentIndex = notes.findIndex((item) => item.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const next = currentIndex > 0 ? notes[currentIndex - 1] : null;
  const prev = currentIndex < notes.length - 1 ? notes[currentIndex + 1] : null;
  return { prev, next };
}

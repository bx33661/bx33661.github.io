import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

export type ProjectWithSlug = {
  project: ProjectEntry;
  slug: string;
};

export function getProjectSlug(project: ProjectEntry): string {
  const explicit = project.data.slug?.trim();
  if (explicit) return explicit.replace(/^\/+|\/+$/g, "");

  // glob loader ids are typically filename without extension
  return project.id.replace(/\/index$/i, "").replace(/\.(md|mdx)$/i, "");
}

function compareProjects(a: ProjectEntry, b: ProjectEntry): number {
  const orderA = a.data.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.data.order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;
  return b.data.pubDatetime.valueOf() - a.data.pubDatetime.valueOf();
}

export async function getAllProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection("projects", ({ data }) => !data.draft);
  return projects.slice().sort(compareProjects);
}

export async function getAllProjectsWithSlugs(): Promise<ProjectWithSlug[]> {
  const projects = await getAllProjects();
  return projects.map((project) => ({
    project,
    slug: getProjectSlug(project),
  }));
}

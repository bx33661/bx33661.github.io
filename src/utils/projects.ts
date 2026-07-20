import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

export type ProjectDoc = {
  entry: ProjectEntry;
  /** Project folder key, e.g. "oh-my-vul" */
  projectKey: string;
  /** Page key within project: "" for index, else "problem" */
  pageKey: string;
  /** URL path under /projects/, e.g. "oh-my-vul" or "oh-my-vul/problem" */
  hrefPath: string;
  isRoot: boolean;
};

function stripExt(id: string): string {
  return id.replace(/\.(md|mdx)$/i, "");
}

/** Parse collection id → projectKey + pageKey */
export function parseProjectId(id: string): { projectKey: string; pageKey: string } {
  const clean = stripExt(id).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { projectKey: "unknown", pageKey: "" };
  }

  // Flat legacy: "oh-my-vul.md" → project root
  if (parts.length === 1) {
    return { projectKey: parts[0], pageKey: "" };
  }

  // Folder: "oh-my-vul/index" or "oh-my-vul/problem"
  const projectKey = parts[0];
  const rest = parts.slice(1).join("/");
  const pageKey = rest === "index" ? "" : rest;
  return { projectKey, pageKey };
}

export function getProjectHrefPath(entry: ProjectEntry): string {
  const { projectKey, pageKey } = parseProjectId(entry.id);
  // Explicit slug on root overrides folder name
  if (!pageKey) {
    const explicit = entry.data.slug?.trim().replace(/^\/+|\/+$/g, "");
    if (explicit && !explicit.includes("/")) return explicit;
    return projectKey;
  }
  return `${projectKey}/${pageKey}`;
}

export function isProjectRoot(entry: ProjectEntry): boolean {
  return parseProjectId(entry.id).pageKey === "";
}

function compareOrder(
  a: { order?: number; title: string },
  b: { order?: number; title: string },
): number {
  const orderA = a.order ?? Number.POSITIVE_INFINITY;
  const orderB = b.order ?? Number.POSITIVE_INFINITY;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title, "en");
}

function toDoc(entry: ProjectEntry): ProjectDoc {
  const { projectKey, pageKey } = parseProjectId(entry.id);
  const hrefPath = getProjectHrefPath(entry);
  return {
    entry,
    projectKey,
    pageKey,
    hrefPath,
    isRoot: pageKey === "",
  };
}

export async function getAllProjectEntries(): Promise<ProjectEntry[]> {
  return getCollection("projects", ({ data }) => !data.draft);
}

/** All non-draft docs (roots + children), sorted for stable sitemap */
export async function getAllProjectDocs(): Promise<ProjectDoc[]> {
  const entries = await getAllProjectEntries();
  return entries
    .map(toDoc)
    .sort((a, b) => {
      if (a.projectKey !== b.projectKey) {
        return a.projectKey.localeCompare(b.projectKey);
      }
      if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
      return compareOrder(
        { order: a.entry.data.order, title: a.entry.data.title },
        { order: b.entry.data.order, title: b.entry.data.title },
      );
    });
}

/**
 * Project roots only — for /projects/ showcase cards.
 * Prefer folder index.md; fall back to flat files.
 */
export async function getProjectRoots(): Promise<ProjectDoc[]> {
  const docs = await getAllProjectDocs();
  const roots = docs.filter((d) => d.isRoot);

  return roots.slice().sort((a, b) => {
    const orderA = a.entry.data.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.entry.data.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = a.entry.data.pubDatetime?.valueOf() ?? 0;
    const dateB = b.entry.data.pubDatetime?.valueOf() ?? 0;
    return dateB - dateA;
  });
}

/** All pages belonging to one project, root first then by order */
export async function getProjectDocs(projectKey: string): Promise<ProjectDoc[]> {
  const docs = await getAllProjectDocs();
  const mine = docs.filter((d) => d.projectKey === projectKey);
  return mine.sort((a, b) => {
    if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
    return compareOrder(
      { order: a.entry.data.order, title: a.entry.data.title },
      { order: b.entry.data.order, title: b.entry.data.title },
    );
  });
}

export function getRootMeta(docs: ProjectDoc[]): ProjectEntry["data"] | null {
  const root = docs.find((d) => d.isRoot);
  return root?.entry.data ?? null;
}

/** Sidebar label */
export function getDocNavLabel(doc: ProjectDoc): string {
  if (doc.isRoot) return "Overview";
  return doc.entry.data.navLabel?.trim() || doc.entry.data.title;
}

/** @deprecated use getProjectRoots */
export async function getAllProjects(): Promise<ProjectEntry[]> {
  return (await getProjectRoots()).map((d) => d.entry);
}

/** @deprecated use getProjectRoots */
export async function getAllProjectsWithSlugs() {
  return (await getProjectRoots()).map((d) => ({
    project: d.entry,
    slug: d.hrefPath,
  }));
}

export function getProjectSlug(project: ProjectEntry): string {
  return getProjectHrefPath(project);
}

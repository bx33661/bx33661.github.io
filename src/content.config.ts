import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { SITE } from "@/config.ts";

export const BLOG_PATH = "src/content/blog";
export const NOTES_PATH = "src/data/notes";
export const GALLERY_PATH = "src/data/galleries";
export const PROJECTS_PATH = "src/content/projects";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.coerce.date().optional(),
      modDatetime: z.coerce.date().optional().nullable(),
      date: z.coerce.date().optional(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      slug: z.string().optional(),
      authors: z.array(z.string()).optional(),
    }).transform((data) => ({
      ...data,
      // Normalise: writers use `date`, theme code uses `pubDatetime`
      pubDatetime: data.pubDatetime ?? data.date ?? new Date(0),
    })),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: `./${NOTES_PATH}` }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      slug: z.string().optional(),
    }),
});

const galleries = defineCollection({
  loader: glob({ pattern: "**/index.{md,mdx}", base: `./${GALLERY_PATH}` }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDatetime: z.date(),
      draft: z.boolean().optional(),
      coverImage: image().optional(),
      tags: z.array(z.string()).default([]),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${PROJECTS_PATH}` }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDatetime: z.coerce.date(),
      modDatetime: z.coerce.date().optional().nullable(),
      tags: z.array(z.string()).default([]),
      /** e.g. "TOOLING — 2026" under the title */
      category: z.string().optional(),
      /** e.g. WRK_001 — auto-filled in UI if omitted */
      workId: z.string().optional(),
      status: z.enum(["active", "wip", "archived"]).default("active"),
      repo: z.string().url(),
      demo: z.string().url().optional(),
      cover: image().optional(),
      order: z.number().optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      slug: z.string().optional(),
    }),
});

export const collections = { blog, notes, galleries, projects };

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config.ts";

export const BLOG_PATH = "src/content/blog";
export const NOTES_PATH = "src/data/notes";
export const GALLERY_PATH = "src/data/galleries";

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
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      slug: z.string().optional(),
      password: z.string().optional(),
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

export const collections = { blog, notes, galleries };

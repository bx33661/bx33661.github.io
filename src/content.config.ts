import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { file, glob } from "astro/loaders";
import { SITE } from "@/config.ts";

export const BLOG_PATH = "src/content/blog";
export const NOTES_PATH = "src/data/notes";
export const GALLERY_PATH = "src/data/galleries";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
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
      })
      .transform((data) => ({
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
      formerBlogSlug: z.string().optional(),
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
  loader: glob({ pattern: "**/*.json", base: "./src/data/academic/projects" }),
  schema: z.object({
    order: z.number().int().positive(),
    number: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    href: z.url(),
    linkLabel: z.string(),
    feature: z.object({
      question: z.string(),
      method: z.string(),
      evidence: z.string(),
    }).optional(),
    relatedPosts: z.array(reference("blog")).default([]),
  }),
});

const awards = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/academic/awards" }),
  schema: z.object({
    order: z.number().int().positive(),
    year: z.string().regex(/^\d{4}$/),
    distinction: z.string(),
    competition: z.string(),
    evidenceUrl: z.url().optional(),
  }),
});

const publications = defineCollection({
  loader: file("./src/data/academic/publications.json"),
  schema: z.object({
    title: z.string(),
    year: z.number().int(),
    authors: z.array(z.string()).min(1),
    venue: z.string().optional(),
    doi: z.string().optional(),
    url: z.url().optional(),
    relatedProject: reference("projects").optional(),
  }),
});

export const collections = { blog, notes, galleries, projects, awards, publications };

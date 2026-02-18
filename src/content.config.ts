import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      slug: z.string().optional(), // 可选：不提供时会按文件名生成稳定slug
      password: z.string().optional(), // 文章密码保护，如果设置则需要输入密码才能阅读
    }),
})

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(), // 学习笔记分类
      authors: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      slug: z.string().optional(), // 可选：不提供时会按文件名生成稳定slug
    }),
})

export const collections = { blog, notes }

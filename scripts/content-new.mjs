import fs from 'fs'
import path from 'path'

const VALID_TYPES = new Set(['blog', 'notes', 'projects'])

function parseArgs(argv) {
  const args = {
    type: 'blog',
    title: '',
    slug: '',
    description: '',
    date: '',
    ext: 'md',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i]
    if (part === '--type') {
      args.type = argv[i + 1] || args.type
      i += 1
    } else if (part.startsWith('--type=')) {
      args.type = part.slice('--type='.length)
    } else if (part === '--title') {
      args.title = argv[i + 1] || ''
      i += 1
    } else if (part.startsWith('--title=')) {
      args.title = part.slice('--title='.length)
    } else if (part === '--slug') {
      args.slug = argv[i + 1] || ''
      i += 1
    } else if (part.startsWith('--slug=')) {
      args.slug = part.slice('--slug='.length)
    } else if (part === '--description') {
      args.description = argv[i + 1] || ''
      i += 1
    } else if (part.startsWith('--description=')) {
      args.description = part.slice('--description='.length)
    } else if (part === '--date') {
      args.date = argv[i + 1] || ''
      i += 1
    } else if (part.startsWith('--date=')) {
      args.date = part.slice('--date='.length)
    } else if (part === '--ext') {
      args.ext = argv[i + 1] || args.ext
      i += 1
    } else if (part.startsWith('--ext=')) {
      args.ext = part.slice('--ext='.length)
    }
  }

  return args
}

function stableHash(input) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function toSlug(input, prefix) {
  const normalized = input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized) return normalized
  return `${prefix}-${new Date().toISOString().slice(0, 10)}-${stableHash(input).slice(0, 6)}`
}

function escapeDoubleQuotes(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function resolveDate(inputDate) {
  if (!inputDate) {
    return new Date().toISOString().slice(0, 10)
  }
  const parsed = new Date(inputDate)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${inputDate}. Expected YYYY-MM-DD.`)
  }
  return parsed.toISOString().slice(0, 10)
}

function buildBlogTemplate({ title, description, date, slug }) {
  const safeTitle = escapeDoubleQuotes(title)
  const safeDesc = escapeDoubleQuotes(description || 'Write a concise summary for search and social preview.')
  return `---
title: "${safeTitle}"
description: "${safeDesc}"
date: ${date}
tags:
  - "security"
authors:
  - "bx"
draft: true
slug: "${slug}"
---

## Background

## Key Points

## Reproduction / Practice

## Notes
`
}

function buildNotesTemplate({ title, description, date, slug }) {
  const safeTitle = escapeDoubleQuotes(title)
  const safeDesc = escapeDoubleQuotes(description || 'Write a concise summary for the note.')
  return `---
title: "${safeTitle}"
description: "${safeDesc}"
date: ${date}
category: "learning"
tags:
  - "notes"
authors:
  - "bx"
draft: true
slug: "${slug}"
---

## Topic

## Details

## References
`
}

function buildProjectsTemplate({ title, description, date }) {
  const safeName = escapeDoubleQuotes(title)
  const safeDesc = escapeDoubleQuotes(description || 'Briefly describe what this project solves and how it is built.')
  return `---
name: "${safeName}"
description: "${safeDesc}"
tags:
  - "project"
image: "../../../public/static/placeholder.png"
link: "https://github.com/your-account/your-repo"
startDate: "${date}"
---

## Overview

## Stack

## Highlights
`
}

function buildTemplate(type, payload) {
  if (type === 'blog') return buildBlogTemplate(payload)
  if (type === 'notes') return buildNotesTemplate(payload)
  return buildProjectsTemplate(payload)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const type = String(args.type || 'blog').toLowerCase()

  if (!VALID_TYPES.has(type)) {
    console.error(`[FAIL] --type must be one of: ${Array.from(VALID_TYPES).join(', ')}`)
    process.exit(1)
  }

  const title = String(args.title || '').trim()
  if (!title) {
    console.error('[FAIL] Missing required --title')
    process.exit(1)
  }

  const ext = String(args.ext || 'md').toLowerCase()
  if (!['md', 'mdx'].includes(ext)) {
    console.error('[FAIL] --ext must be md or mdx')
    process.exit(1)
  }

  const date = resolveDate(args.date)
  const slug = toSlug(String(args.slug || title), type === 'projects' ? 'project' : type === 'notes' ? 'note' : 'post')
  const targetDir = path.resolve('src/content', type)
  const targetPath = path.join(targetDir, `${slug}.${ext}`)

  if (!fs.existsSync(targetDir)) {
    console.error(`[FAIL] Collection directory not found: ${targetDir}`)
    process.exit(1)
  }

  if (fs.existsSync(targetPath)) {
    console.error(`[FAIL] File already exists: ${targetPath}`)
    process.exit(1)
  }

  const template = buildTemplate(type, {
    title,
    description: String(args.description || '').trim(),
    date,
    slug,
  })

  fs.writeFileSync(targetPath, template, 'utf8')
  console.log(`[OK] Created ${targetPath}`)
  console.log(`[NEXT] Run: npm run content:check`)
}

try {
  main()
} catch (error) {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

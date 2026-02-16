import fs from 'fs'
import path from 'path'

const CONTENT_ROOT = path.resolve('src/content')
const COLLECTIONS = ['blog', 'notes', 'projects']

const REQUIRED_FIELDS = {
  blog: ['title', 'description', 'date'],
  notes: ['title', 'description', 'date'],
  projects: ['name', 'description', 'tags', 'image', 'link'],
}

function walkMarkdownFiles(rootDir) {
  const result = []
  const stack = [rootDir]

  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
        result.push(fullPath)
      }
    }
  }

  return result
}

function extractFrontmatter(raw) {
  const normalized = raw.replace(/^\uFEFF/, '')
  const match = normalized.match(/^\s*---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/)
  return match ? match[1] : null
}

function hasKey(frontmatter, key) {
  const pattern = new RegExp(`^${key}\\s*:`, 'm')
  return pattern.test(frontmatter)
}

function getScalarValue(frontmatter, key) {
  const pattern = new RegExp(`^${key}\\s*:\\s*(.+)$`, 'm')
  const match = frontmatter.match(pattern)
  if (!match) return ''
  return match[1].trim()
}

function stripQuotes(value) {
  return value.replace(/^['"`](.*)['"`]$/, '$1').trim()
}

function hasNonEmptyArray(frontmatter, key) {
  const inlinePattern = new RegExp(`^${key}\\s*:\\s*\\[(.*)\\]\\s*$`, 'm')
  const inlineMatch = frontmatter.match(inlinePattern)
  if (inlineMatch) {
    return inlineMatch[1].split(',').map((part) => part.trim()).filter(Boolean).length > 0
  }

  const blockPattern = new RegExp(`^${key}\\s*:\\s*\\n([\\s\\S]*?)(?=\\n[A-Za-z_][\\w-]*\\s*:|$)`, 'm')
  const blockMatch = frontmatter.match(blockPattern)
  if (!blockMatch) return false

  const listLines = blockMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))

  return listLines.length > 0
}

function parseDateValue(frontmatter, key) {
  const value = stripQuotes(getScalarValue(frontmatter, key))
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function isTruthyFalse(value) {
  return /^(false|0|no)$/i.test(value.trim())
}

function stableHash(input) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function createDeterministicSlug(source, prefix) {
  const normalized = source
    .replace(/\.(md|mdx)$/i, '')
    .replace(/[\\/]/g, '-')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `${prefix}-${stableHash(source)}`
}

function resolveCollection(filePath) {
  const rel = path.relative(CONTENT_ROOT, filePath)
  const [collection] = rel.split(path.sep)
  return COLLECTIONS.includes(collection) ? collection : null
}

function resolveSlugForFile(collection, filePath, frontmatter) {
  const slugRaw = stripQuotes(getScalarValue(frontmatter, 'slug'))
  if (slugRaw) return slugRaw

  const relFromCollection = path.relative(path.join(CONTENT_ROOT, collection), filePath)
  const prefix = collection === 'notes' ? 'note' : collection === 'projects' ? 'project' : 'post'
  return createDeterministicSlug(relFromCollection, prefix)
}

function checkFile(filePath, errors, warnings, slugRegistry) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const collection = resolveCollection(filePath)
  if (!collection) return

  const relPath = path.relative(process.cwd(), filePath)
  const frontmatter = extractFrontmatter(raw)
  if (!frontmatter) {
    errors.push(`${relPath}: missing frontmatter block`)
    return
  }

  const requiredFields = REQUIRED_FIELDS[collection]
  for (const field of requiredFields) {
    if (!hasKey(frontmatter, field)) {
      errors.push(`${relPath}: missing required field "${field}"`)
      continue
    }

    if (field === 'tags') {
      if (!hasNonEmptyArray(frontmatter, 'tags')) {
        errors.push(`${relPath}: "tags" must be a non-empty array`)
      }
      continue
    }

    const value = stripQuotes(getScalarValue(frontmatter, field))
    if (!value) {
      errors.push(`${relPath}: "${field}" cannot be empty`)
    }
  }

  if (collection === 'blog' || collection === 'notes') {
    const date = parseDateValue(frontmatter, 'date')
    if (!date) {
      errors.push(`${relPath}: invalid "date", expected a parseable date`)
    }

    const title = stripQuotes(getScalarValue(frontmatter, 'title'))
    const description = stripQuotes(getScalarValue(frontmatter, 'description'))
    if (title && title.length > 80) {
      warnings.push(`${relPath}: title is long (${title.length} chars), consider <= 80`)
    }
    if (description && (description.length < 40 || description.length > 180)) {
      warnings.push(`${relPath}: description length is ${description.length}, recommended 40-180`)
    }
    if (!hasNonEmptyArray(frontmatter, 'tags')) {
      warnings.push(`${relPath}: missing/empty tags, recommended for archive and SEO`)
    }
    if (collection === 'blog' && !hasNonEmptyArray(frontmatter, 'authors')) {
      warnings.push(`${relPath}: missing/empty authors`)
    }
  }

  if (collection === 'projects') {
    const link = stripQuotes(getScalarValue(frontmatter, 'link'))
    if (link) {
      try {
        new URL(link)
      } catch {
        errors.push(`${relPath}: invalid project link URL "${link}"`)
      }
    }

    const startDateRaw = stripQuotes(getScalarValue(frontmatter, 'startDate'))
    if (startDateRaw) {
      const parsed = new Date(startDateRaw)
      if (Number.isNaN(parsed.getTime())) {
        errors.push(`${relPath}: invalid "startDate"`)
      }
    }

    const image = stripQuotes(getScalarValue(frontmatter, 'image'))
    if (image && !/^https?:\/\//i.test(image)) {
      const resolvedImage = path.resolve(path.dirname(filePath), image)
      if (!fs.existsSync(resolvedImage)) {
        warnings.push(`${relPath}: local image not found -> ${image}`)
      }
    }
  }

  const draftRaw = getScalarValue(frontmatter, 'draft')
  if (draftRaw && !isTruthyFalse(draftRaw) && collection !== 'projects') {
    warnings.push(`${relPath}: draft is not false, page may be hidden in production`)
  }

  if (collection === 'blog' || collection === 'notes') {
    const slug = resolveSlugForFile(collection, filePath, frontmatter)
    const key = `${collection}:${slug}`
    const existing = slugRegistry.get(key)
    if (existing && existing !== relPath) {
      errors.push(`${relPath}: duplicate slug "${slug}" (already used by ${existing})`)
    } else {
      slugRegistry.set(key, relPath)
    }
  }
}

function main() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    console.error(`[FAIL] Content root not found: ${CONTENT_ROOT}`)
    process.exit(1)
  }

  const errors = []
  const warnings = []
  const slugRegistry = new Map()

  for (const collection of COLLECTIONS) {
    const collectionDir = path.join(CONTENT_ROOT, collection)
    if (!fs.existsSync(collectionDir)) continue
    const files = walkMarkdownFiles(collectionDir)
    for (const filePath of files) {
      checkFile(filePath, errors, warnings, slugRegistry)
    }
  }

  console.log('Content check summary:')
  console.log(`- Errors: ${errors.length}`)
  console.log(`- Warnings: ${warnings.length}`)

  if (errors.length > 0) {
    console.log('')
    for (const error of errors) {
      console.error(`[FAIL] ${error}`)
    }
  }

  if (warnings.length > 0) {
    console.log('')
    for (const warning of warnings) {
      console.warn(`[WARN] ${warning}`)
    }
  }

  if (errors.length > 0) {
    process.exit(1)
  }
}

main()

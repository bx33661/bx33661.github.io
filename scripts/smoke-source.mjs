import fs from 'node:fs'
import path from 'node:path'

const failures = []
const warnings = []

const requireFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${filePath}`)
  }
}

const requireDirectoryHasFiles = (dirPath, filter) => {
  if (!fs.existsSync(dirPath)) {
    failures.push(`missing directory: ${dirPath}`)
    return
  }
  const files = fs.readdirSync(dirPath).filter((name) => filter(name))
  if (files.length === 0) {
    failures.push(`directory has no expected files: ${dirPath}`)
  }
}

const assertNoText = (filePath, pattern, label) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file for check: ${filePath}`)
    return
  }
  const content = fs.readFileSync(filePath, 'utf8')
  if (pattern.test(content)) {
    failures.push(`${label}: ${filePath}`)
  }
}

const assertHasText = (filePath, pattern, label) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file for check: ${filePath}`)
    return
  }
  const content = fs.readFileSync(filePath, 'utf8')
  if (!pattern.test(content)) {
    failures.push(`${label}: ${filePath}`)
  }
}

const repoRoot = process.cwd()

requireFile(path.join(repoRoot, 'src/pages/album/index.astro'))
requireFile(path.join(repoRoot, 'src/data/gallery.ts'))
requireFile(path.join(repoRoot, 'public/sw.js'))
requireFile(path.join(repoRoot, 'public/site.webmanifest'))
requireFile(path.join(repoRoot, 'astro.config.ts'))

requireDirectoryHasFiles(
  path.join(repoRoot, 'assets/gallery-source'),
  (name) => /\.(jpe?g|png)$/i.test(name),
)
requireDirectoryHasFiles(
  path.join(repoRoot, 'public/gallery/optimized'),
  (name) => /\.(avif|webp|jpg)$/i.test(name),
)

assertNoText(
  path.join(repoRoot, 'public/sw.js'),
  /\/projects\b/,
  'stale projects route still present in service worker',
)
assertNoText(
  path.join(repoRoot, 'public/site.webmanifest'),
  /"url"\s*:\s*"\/projects\/?"/,
  'stale projects shortcut still present in manifest',
)
assertHasText(
  path.join(repoRoot, 'astro.config.ts'),
  /defaultStrategy:\s*['"]hover['"]/,
  'Astro prefetch hover strategy not configured',
)

const summary = [
  `- Failures: ${failures.length}`,
  `- Warnings: ${warnings.length}`,
]

console.log('Source smoke check summary:')
for (const line of summary) console.log(line)

for (const warning of warnings) {
  console.warn(`[WARN] ${warning}`)
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[FAIL] ${failure}`)
  }
  process.exit(1)
}

console.log('[OK] source smoke checks passed')

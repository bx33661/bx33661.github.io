import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const distDir = path.join(repoRoot, 'dist')
const failures = []

const requireBuiltFile = (relativePath) => {
  const fullPath = path.join(distDir, relativePath)
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing built file: dist/${relativePath}`)
  }
  return fullPath
}

if (!fs.existsSync(distDir)) {
  console.error('[FAIL] dist directory not found. Run build first.')
  process.exit(1)
}

const requiredFiles = [
  'index.html',
  'album/index.html',
  'sitemap.xml',
  'image-sitemap.xml',
  '_headers',
  '_redirects',
]

for (const file of requiredFiles) {
  requireBuiltFile(file)
}

const projectsRedirectFile = requireBuiltFile('projects/index.html')
if (fs.existsSync(projectsRedirectFile)) {
  const content = fs.readFileSync(projectsRedirectFile, 'utf8')
  if (!/\/album\/?/.test(content)) {
    failures.push('dist/projects/index.html does not contain redirect target /album')
  }
}

const albumIndex = requireBuiltFile('album/index.html')
if (fs.existsSync(albumIndex)) {
  const content = fs.readFileSync(albumIndex, 'utf8')
  if (!/\/gallery\/optimized\//.test(content)) {
    failures.push('album page does not reference optimized gallery assets')
  }
}

const distGalleryDir = path.join(distDir, 'gallery')
if (fs.existsSync(distGalleryDir)) {
  const rootEntries = fs.readdirSync(distGalleryDir, { withFileTypes: true })
  const unexpectedRawImages = rootEntries.filter(
    (entry) => entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name),
  )
  if (unexpectedRawImages.length > 0) {
    failures.push(`raw source images still shipped in dist/gallery: ${unexpectedRawImages.map((f) => f.name).join(', ')}`)
  }
} else {
  failures.push('dist/gallery directory missing')
}

console.log('Dist smoke check summary:')
console.log(`- Failures: ${failures.length}`)

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[FAIL] ${failure}`)
  }
  process.exit(1)
}

console.log('[OK] dist smoke checks passed')

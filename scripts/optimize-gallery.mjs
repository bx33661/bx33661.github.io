import fsp from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = path.resolve('assets/gallery-source')
const OUTPUT_DIR = path.resolve('public/gallery/optimized')
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])
const TARGET_WIDTHS = [640, 960, 1280, 1600]

const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

const stripExtension = (fileName) => fileName.replace(/\.[^.]+$/, '')

const getRenditionWidths = (sourceWidth) => {
  const maxWidth = TARGET_WIDTHS[TARGET_WIDTHS.length - 1]
  const widths = TARGET_WIDTHS.filter((step) => step <= sourceWidth)
  if (sourceWidth <= maxWidth && !widths.includes(sourceWidth)) {
    widths.push(sourceWidth)
  }
  if (widths.length === 0) widths.push(sourceWidth)
  return widths.sort((a, b) => a - b)
}

const needsUpdate = async (sourceFile, targetFile) => {
  try {
    const [sourceStat, targetStat] = await Promise.all([fsp.stat(sourceFile), fsp.stat(targetFile)])
    return sourceStat.mtimeMs > targetStat.mtimeMs
  } catch {
    return true
  }
}

const ensureOutputDirectory = async () => {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true })
}

const optimizeOneFile = async (fileName) => {
  const sourceFile = path.join(SOURCE_DIR, fileName)
  const baseName = stripExtension(fileName)
  const sourceMetadata = await sharp(sourceFile).metadata()

  if (!sourceMetadata.width) {
    throw new Error(`Unable to read width: ${fileName}`)
  }

  const widths = getRenditionWidths(sourceMetadata.width)
  let generated = 0
  let outputBytes = 0

  for (const width of widths) {
    const targets = [
      {
        extension: 'avif',
        build: (pipeline) => pipeline.avif({ quality: 52, effort: 5 }),
      },
      {
        extension: 'webp',
        build: (pipeline) => pipeline.webp({ quality: 74, effort: 6 }),
      },
      {
        extension: 'jpg',
        build: (pipeline) => pipeline.jpeg({ quality: 76, mozjpeg: true }),
      },
    ]

    for (const target of targets) {
      const outputFile = path.join(OUTPUT_DIR, `${baseName}-w${width}.${target.extension}`)
      const shouldWrite = await needsUpdate(sourceFile, outputFile)

      if (!shouldWrite) {
        const stat = await fsp.stat(outputFile)
        outputBytes += stat.size
        continue
      }

      const pipeline = sharp(sourceFile)
        .rotate()
        .resize({
          width,
          withoutEnlargement: true,
        })

      await target.build(pipeline).toFile(outputFile)

      const stat = await fsp.stat(outputFile)
      outputBytes += stat.size
      generated += 1
    }
  }

  const sourceStat = await fsp.stat(sourceFile)
  return {
    fileName,
    sourceBytes: sourceStat.size,
    outputBytes,
    generated,
  }
}

const run = async () => {
  await ensureOutputDirectory()

  const entries = await fsp.readdir(SOURCE_DIR, { withFileTypes: true })
  const imageFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))

  let sourceTotal = 0
  let outputTotal = 0
  let generatedTotal = 0

  for (const fileName of imageFiles) {
    const result = await optimizeOneFile(fileName)
    sourceTotal += result.sourceBytes
    outputTotal += result.outputBytes
    generatedTotal += result.generated

    console.log(
      `[gallery] ${result.fileName} -> variants=${result.generated} total=${formatBytes(result.outputBytes)}`,
    )
  }

  console.log('')
  console.log(`[gallery] source total: ${formatBytes(sourceTotal)}`)
  console.log(`[gallery] optimized total: ${formatBytes(outputTotal)}`)
  console.log(`[gallery] files generated/updated: ${generatedTotal}`)
}

run().catch((error) => {
  console.error('[gallery] optimize failed')
  console.error(error)
  process.exit(1)
})

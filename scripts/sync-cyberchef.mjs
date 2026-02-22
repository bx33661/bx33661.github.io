import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const DEFAULT_VERSION = 'v10.22.1'
const DEFAULT_BRAND_TITLE = 'BX CyberChef'
const DEFAULT_BRAND_ICON = '/apple-touch-icon.png'
const DEFAULT_BRAND_DOWNLOAD_TEXT = 'Download BX CyberChef'

const parseCliVersion = () => {
  const args = process.argv.slice(2)
  const index = args.findIndex((item) => item === '--version')
  if (index === -1) return undefined
  return args[index + 1]
}

const resolveVersion = () => {
  const fromCli = parseCliVersion()
  const version = fromCli || process.env.CYBERCHEF_VERSION || DEFAULT_VERSION
  if (!/^v\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(
      `Invalid CyberChef version: ${version}. Expected format like v10.22.1`,
    )
  }
  return version
}

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true })
}

const downloadZip = async (url, zipPath) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to download CyberChef bundle (${response.status} ${response.statusText})`,
    )
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(zipPath, zipBuffer)
}

const selectExtractedRoot = (extractDir) => {
  const entries = fs.readdirSync(extractDir, { withFileTypes: true })
  const directories = entries.filter((entry) => entry.isDirectory())

  if (directories.length === 1) {
    return path.join(extractDir, directories[0].name)
  }

  return extractDir
}

const ensureIndexHtml = (targetDir) => {
  const defaultIndex = path.join(targetDir, 'index.html')
  if (fs.existsSync(defaultIndex)) return

  const htmlCandidates = fs
    .readdirSync(targetDir)
    .filter((name) => /^CyberChef_v\d+\.\d+\.\d+\.html$/i.test(name))

  if (htmlCandidates.length === 0) {
    throw new Error(
      'CyberChef bundle does not contain index.html or CyberChef_v*.html entry file',
    )
  }

  fs.copyFileSync(path.join(targetDir, htmlCandidates[0]), defaultIndex)
}

const writeVersionMetadata = (targetDir, version) => {
  const metaPath = path.join(targetDir, 'bx-version.json')
  const payload = {
    version,
    syncedAt: new Date().toISOString(),
    source: 'https://github.com/gchq/CyberChef/releases',
  }
  fs.writeFileSync(metaPath, `${JSON.stringify(payload, null, 2)}\n`)
}

const patchBranding = (targetDir) => {
  const indexPath = path.join(targetDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      'Cannot apply CyberChef branding because index.html is missing',
    )
  }

  const brandTitle = process.env.CYBERCHEF_BRAND_TITLE || DEFAULT_BRAND_TITLE
  const brandIcon = process.env.CYBERCHEF_BRAND_ICON || DEFAULT_BRAND_ICON
  const brandDownloadText =
    process.env.CYBERCHEF_BRAND_DOWNLOAD_TEXT || DEFAULT_BRAND_DOWNLOAD_TEXT

  let content = fs.readFileSync(indexPath, 'utf8')
  content = content.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${brandTitle}</title>`,
  )
  content = content.replace(
    /<link rel="icon"[^>]*>/i,
    `<link rel="icon" type="image/png" href="${brandIcon}">`,
  )
  content = content.replaceAll('Download CyberChef', brandDownloadText)

  fs.writeFileSync(indexPath, content)
}

const main = async () => {
  const version = resolveVersion()
  const repoRoot = process.cwd()
  const targetDir = path.join(repoRoot, 'public', 'vendor', 'cyberchef')
  const legacyDir = path.join(repoRoot, 'public', 'tools', 'cyberchef')
  const tempRoot = path.join(repoRoot, '.tmp', 'cyberchef-sync')
  const extractDir = path.join(tempRoot, 'extract')
  const zipPath = path.join(tempRoot, `CyberChef_${version}.zip`)
  const downloadUrl = `https://github.com/gchq/CyberChef/releases/download/${version}/CyberChef_${version}.zip`

  console.log(`[CyberChef] Syncing ${version}`)
  console.log(`[CyberChef] Download: ${downloadUrl}`)

  fs.rmSync(tempRoot, { recursive: true, force: true })
  ensureDir(tempRoot)
  ensureDir(extractDir)

  await downloadZip(downloadUrl, zipPath)

  try {
    execFileSync('unzip', ['-q', zipPath, '-d', extractDir], {
      stdio: 'inherit',
    })
  } catch (error) {
    throw new Error(
      `Failed to unzip CyberChef bundle. Ensure 'unzip' is available. ${String(error)}`,
    )
  }

  const bundleRoot = selectExtractedRoot(extractDir)

  fs.rmSync(targetDir, { recursive: true, force: true })
  fs.rmSync(legacyDir, { recursive: true, force: true })
  ensureDir(path.dirname(targetDir))
  fs.cpSync(bundleRoot, targetDir, { recursive: true })

  ensureIndexHtml(targetDir)
  writeVersionMetadata(targetDir, version)
  patchBranding(targetDir)
  fs.rmSync(tempRoot, { recursive: true, force: true })

  console.log(`[CyberChef] Ready at ${path.relative(repoRoot, targetDir)}`)
}

main().catch((error) => {
  console.error(`[CyberChef] ${error.message}`)
  process.exit(1)
})

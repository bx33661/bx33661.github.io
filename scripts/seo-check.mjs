import fs from 'fs'
import path from 'path'

const DEFAULT_TIMEOUT_MS = 12000
const MAX_CANONICAL_CHECKS = 6

const log = {
  ok: (message) => console.log(`[OK] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  fail: (message) => console.error(`[FAIL] ${message}`),
}

function parseArgs(argv) {
  const args = { site: undefined }
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i]
    if (part === '--site' || part === '--base') {
      args.site = argv[i + 1]
      i += 1
    } else if (part.startsWith('--site=')) {
      args.site = part.slice('--site='.length)
    }
  }
  return args
}

function readSiteHrefFromConfig() {
  const filePath = path.resolve('src/config/site.ts')
  if (!fs.existsSync(filePath)) {
    return undefined
  }

  const raw = fs.readFileSync(filePath, 'utf8')
  const match = raw.match(/href:\s*['"`]([^'"`]+)['"`]/)
  return match?.[1]
}

function normalizeBaseUrl(rawValue) {
  if (!rawValue) return undefined

  const withProtocol = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`
  const url = new URL(withProtocol)
  return `${url.protocol}//${url.host}`
}

function normalizeForCompare(rawValue) {
  const url = new URL(rawValue)
  url.hash = ''
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1)
  }
  return `${url.protocol}//${url.host}${url.pathname}${url.search}`
}

async function fetchText(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'bx-seo-check/1.0',
        Accept: 'text/html,application/xml,text/plain;q=0.9,*/*;q=0.5',
      },
    })

    const body = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      url: response.url,
      body,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      body: '',
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((item) => item[1].trim())
}

function parseRobotsSitemaps(robotsText) {
  return robotsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith('sitemap:'))
    .map((line) => line.slice('sitemap:'.length).trim())
    .filter(Boolean)
}

function extractCanonicalHref(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of linkTags) {
    const relMatch = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)
    if (!relMatch) continue
    const relValue = relMatch[1].toLowerCase()
    if (!relValue.split(/\s+/).includes('canonical')) continue

    const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)
    if (!hrefMatch) continue
    return hrefMatch[1].trim()
  }
  return undefined
}

function dedupe(items) {
  return [...new Set(items)]
}

function resolveUrl(rawValue, baseUrl) {
  try {
    return new URL(rawValue, `${baseUrl}/`).toString()
  } catch {
    return undefined
  }
}

async function ensureReachable(url, label, failures) {
  const result = await fetchText(url)
  if (!result.ok) {
    failures.push(`${label} not reachable (${result.status}) -> ${url}`)
    log.fail(`${label} not reachable (${result.status})`)
    if (result.error) {
      log.warn(`${label} error detail: ${result.error}`)
    }
    return undefined
  }

  log.ok(`${label} reachable (${result.status})`)
  return result.body
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const baseUrl =
    normalizeBaseUrl(args.site) ||
    normalizeBaseUrl(process.env.SEO_CHECK_BASE_URL) ||
    normalizeBaseUrl(readSiteHrefFromConfig())

  if (!baseUrl) {
    log.fail('Cannot determine site URL. Use --site or SEO_CHECK_BASE_URL.')
    process.exit(1)
  }

  console.log(`SEO self-check target: ${baseUrl}`)

  const failures = []
  const warnings = []

  const robotsUrl = `${baseUrl}/robots.txt`
  const sitemapIndexUrl = `${baseUrl}/sitemap-index.xml`
  const sitemapUrl = `${baseUrl}/sitemap.xml`
  const imageSitemapUrl = `${baseUrl}/image-sitemap.xml`

  const robotsText = await ensureReachable(robotsUrl, 'robots.txt', failures)
  const sitemapIndexXml = await ensureReachable(sitemapIndexUrl, 'sitemap-index.xml', failures)
  const sitemapXml = await ensureReachable(sitemapUrl, 'sitemap.xml', failures)
  await ensureReachable(imageSitemapUrl, 'image-sitemap.xml', failures)

  const robotsSitemaps = robotsText ? parseRobotsSitemaps(robotsText) : []
  if (robotsText && robotsSitemaps.length === 0) {
    warnings.push('robots.txt does not contain any Sitemap entries.')
    log.warn('robots.txt has no Sitemap entries.')
  } else if (robotsSitemaps.length > 0) {
    for (const sitemapEntry of dedupe(robotsSitemaps)) {
      const resolved = resolveUrl(sitemapEntry, baseUrl)
      if (!resolved) {
        failures.push(`robots.txt has invalid sitemap URL: ${sitemapEntry}`)
        log.fail(`robots.txt has invalid sitemap URL: ${sitemapEntry}`)
        continue
      }
      await ensureReachable(resolved, `robots sitemap ${resolved}`, failures)
    }
  }

  if (robotsText && /crawl-delay\s*:/i.test(robotsText)) {
    warnings.push('robots.txt still contains Crawl-delay.')
    log.warn('robots.txt contains Crawl-delay; consider removing for Google/Bing best practice.')
  }

  if (robotsText) {
    const expectedSitemaps = [sitemapIndexUrl, sitemapUrl, imageSitemapUrl]
    for (const expected of expectedSitemaps) {
      if (!robotsSitemaps.includes(expected)) {
        warnings.push(`robots.txt missing sitemap declaration: ${expected}`)
        log.warn(`robots.txt missing sitemap declaration: ${expected}`)
      }
    }
  }

  if (sitemapIndexXml) {
    const indexLocs = parseSitemapLocs(sitemapIndexXml)
    if (indexLocs.length === 0) {
      failures.push('sitemap-index.xml has no <loc> entries.')
      log.fail('sitemap-index.xml has no <loc> entries.')
    } else {
      log.ok(`sitemap-index.xml entries: ${indexLocs.length}`)
    }
  }

  const sitemapLocs = sitemapXml ? parseSitemapLocs(sitemapXml) : []
  if (sitemapXml && sitemapLocs.length === 0) {
    failures.push('sitemap.xml has no URL entries.')
    log.fail('sitemap.xml has no URL entries.')
  } else if (sitemapLocs.length > 0) {
    log.ok(`sitemap.xml URL entries: ${sitemapLocs.length}`)
  }

  const canonicalTargets = dedupe([`${baseUrl}/`, ...sitemapLocs]).slice(0, MAX_CANONICAL_CHECKS)
  for (const pageUrl of canonicalTargets) {
    const page = await fetchText(pageUrl)
    if (!page.ok) {
      failures.push(`Page not reachable for canonical check (${page.status}): ${pageUrl}`)
      log.fail(`Page not reachable for canonical check (${page.status}): ${pageUrl}`)
      continue
    }

    const canonicalHref = extractCanonicalHref(page.body)
    if (!canonicalHref) {
      failures.push(`Canonical tag missing: ${pageUrl}`)
      log.fail(`Canonical tag missing: ${pageUrl}`)
      continue
    }

    let canonicalAbs
    try {
      canonicalAbs = new URL(canonicalHref, page.url).toString()
    } catch {
      failures.push(`Canonical URL invalid: ${pageUrl} -> ${canonicalHref}`)
      log.fail(`Canonical URL invalid: ${pageUrl} -> ${canonicalHref}`)
      continue
    }

    const expected = normalizeForCompare(page.url)
    const actual = normalizeForCompare(canonicalAbs)
    if (expected !== actual) {
      warnings.push(`Canonical differs: ${pageUrl} -> ${canonicalAbs}`)
      log.warn(`Canonical differs from final URL: ${pageUrl} -> ${canonicalAbs}`)
    } else {
      log.ok(`Canonical valid: ${pageUrl}`)
    }
  }

  console.log('')
  console.log('SEO self-check summary:')
  console.log(`- Failures: ${failures.length}`)
  console.log(`- Warnings: ${warnings.length}`)

  if (failures.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  log.fail(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})

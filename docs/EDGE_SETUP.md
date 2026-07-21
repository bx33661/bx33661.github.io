# Edge Setup (301 + Security Headers)

## Why

GitHub Pages serves static files and **cannot** emit custom HTTP 301s or response headers from repo files alone.

- `public/_redirects` and `public/_headers` are for Netlify / Cloudflare Pages–style hosts.
- On GitHub Pages they are **ignored**.
- HTML-level redirects (static Astro pages under `src/pages/album/**`, `src/pages/archive.astro`, etc.) and the CSP `<meta>` in `Layout.astro` still apply without an edge layer.

If you put a CDN / reverse proxy in front of Pages (Cloudflare, Fastly, etc.), configure redirects and security headers there.

## Active site routes (do not redirect these)

These are first-class pages. **Do not** 301 them away:

| Path | Module |
|------|--------|
| `/projects/`, `/projects/*` | Research / tooling showcase (content collection) |
| `/galleries/`, `/galleries/*` | Photo galleries |
| `/blog/`, `/blog/*` | Blog |
| `/notes/`, `/notes/*` | Notes |
| `/friends/` | Friends |
| `/search/` | Pagefind search |

> **Historical note:** An earlier draft of this doc told the edge to send `/projects*` → `/galleries/`. That is obsolete. Projects is a real module now; applying that rule would break the site.

## Recommended edge redirects (301)

Only for **legacy** paths that no longer have a dedicated page tree (or only have a soft HTML refresh):

```text
/bento          → /galleries/          301
/bento/         → /galleries/          301
/tags           → /blog/tags/          301
/tags/          → /blog/tags/          301
/tags/*         → /blog/tags/:splat    301
/album          → /galleries/          301
/album/         → /galleries/          301
/album/*        → /galleries/:splat    301   # optional if old album slugs match
/archive        → /archives/           301
/archive/       → /archives/           301
```

Repo mirrors (platform-dependent):

- `public/_redirects` — Netlify/Cloudflare Pages syntax (`/tags/*`, `/bento`).
- Static HTML refresh fallbacks (work on GitHub Pages without edge):
  - `src/pages/album/**`
  - `src/pages/archive.astro`
  - `src/pages/tags/**` → `/blog/tags/**` (known tag slugs only; unknown tags still 404 without edge)

## Security headers

Apply on the edge for all paths:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com https://giscus.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' data: https://gstatic.loli.net; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://analytics.ahrefs.com https://app.posthog.com https://giscus.app; frame-src https://giscus.app; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
```

Same set lives in `public/_headers` and the HTML CSP meta in `Layout.astro` (Giscus pre-allowed so comments can be turned on without a CSP chase).

Notes:

- GitHub Pages does **not** apply `public/_headers`. HSTS / `X-Frame-Options` / real CSP **response** headers need an edge.
- Main Astro pages also emit an HTML-level CSP + referrer policy as defense in depth.
- Keep edge CSP in sync with `public/_headers` / `Layout.astro` when adding third parties.

## Validation

```bash
curl -sI https://www.bx33661.com/ | rg -i 'strict-transport|x-frame|content-security|HTTP/'
curl -sI https://www.bx33661.com/projects/
curl -sI https://www.bx33661.com/tags/web
curl -sI https://www.bx33661.com/bento
```

Expected when edge is configured:

- `/projects/` → **200** (not a redirect to galleries)
- `/tags/*` → **301** → `/blog/tags/*`
- `/bento` → **301** → `/galleries/`
- Homepage response includes the security headers above

On bare GitHub Pages (no edge):

- `/projects/` → 200
- `/tags/`, `/tags/<known-slug>/` → HTML refresh → `/blog/tags/...`
- `/album/`, `/archive` → HTML refresh redirects
- Security headers above are absent from the HTTP response (CSP meta still in HTML)

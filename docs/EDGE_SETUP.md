# Edge Setup (301 + Security Headers)

## Why

GitHub Pages serves static files and cannot emit custom HTTP 301/response headers by repo config alone.
To preserve SEO migration quality, configure redirects and security headers at your edge/CDN layer.

## Redirects (301)

Apply these redirects at edge:

- `/projects` -> `/galleries/` (301)
- `/projects/` -> `/galleries/` (301)
- `/projects/*` -> `/galleries/` (301)

The repo also includes:

- `public/_redirects` for Netlify/Cloudflare Pages style platforms that support this file.
- Static Astro fallback pages under `src/pages/projects/**`, so GitHub Pages visitors still land on `/galleries/` even without edge redirects.

## Security Headers

Apply these headers at edge for all paths:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' data: https://gstatic.loli.net; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://analytics.ahrefs.com https://app.posthog.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'`

The repo includes this header set in `public/_headers` for Netlify/Cloudflare Pages style platforms that support it. GitHub Pages does not apply `public/_headers`; keep these rules at the edge/CDN if strict response headers are required. Main Astro pages also emit an HTML-level CSP/referrer policy as defense in depth, but HTTP-only headers such as HSTS and X-Frame-Options still require an edge/CDN.

## Validation

After edge rules are published, verify:

```bash
curl -I https://www.bx33661.com/projects
curl -I https://www.bx33661.com/projects/algorithm-practice
curl -I https://www.bx33661.com/
```

Expected:

- `/projects*` returns `301` with `Location: /galleries/` when edge redirects are enabled
- without edge redirects on GitHub Pages, `/projects*` serves a static HTML redirect to `/galleries/`
- homepage response contains the security headers above

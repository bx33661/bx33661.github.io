<h1 align="center">Astro Orbit</h1>

<p align="center">
  <strong>Bilingual editorial technical blog &amp; personal knowledge base template built with Astro 7, Tailwind CSS 4, MDX, and Pagefind.</strong><br/>
  English · <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro 7" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://pagefind.app"><img src="https://img.shields.io/badge/Search-Pagefind-1158D1?style=for-the-badge" alt="Pagefind" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## Features

- **Editorial Paper & Deep-Space Aesthetic**: 6 built-in accent color presets (`cobalt`, `emerald`, `amber`, `violet`, `rose`, `slate`) or custom hex tokens, light/dark mode with native View Transitions reveal, and a pre-compiled single-pass WebGPU star-map shader. Accent colors sync automatically with dynamic OG cards.
- **Bilingual or Single-Language**: English default (`/`) with optional Chinese edition (`/zh/`), or flip `defaultLocale: "zh-CN"` with `/en/`. Set `bilingual: false` to build a pure single-language site. All UI chrome, Markdown callouts, footnotes, and Dev Toolbar checks adapt cleanly to the active locale.
- **Zero-Code Config Engine (`src/config.ts`)**: Configure **Notes**, **Projects** (with GitHub heatmap), **Friends**, **Galleries**, **Archives**, **Search**, **Social links**, **Share channels**, and **Analytics** (Umami / Plausible / GA4 with dynamic CSP allowlisting) from one typed file + `.env`.
- **Rich Authoring Pipeline**: MDX & GFM, KaTeX math, Mermaid diagrams, GitHub-style callouts, Shiki code highlighting with filenames/diffs/long-code folding, reading-time estimation, and build-time local image dimension inference.
- **Zero-Backend Full-Text Search**: Pagefind static search (`⌘K` modal + `/search/` page) in production and instant JSON search in `astro dev`, fully compatible with subpath deployments (`BASE_URL`).
- **Self-Hosted Open-Source Fonts**: Plus Jakarta Sans & JetBrains Mono loaded locally via Astro 7's native Fonts API.
- **Developer Toolkit**: Interactive `npm run setup`, one-command demo cleanup (`npm run clean:demo`), `npm run content:new`, `npm run content:check`, `npm run template:check`, and an in-browser Astro Dev Toolbar auditor.

---

## Quick Start

```bash
# Using Astro CLI
npm create astro@latest -- --template bx33661/astro-orbit

# Or clone directly
cd astro-orbit
npm install

# Run the interactive setup wizard (writes src/config.ts)
npm run setup

# Optional: remove starter demo posts & galleries
npm run clean:demo -- --yes

# Start local dev server
npm run dev
```

Open `http://localhost:4321` in your browser.

---

## Configuration (`src/config.ts`)

All site identity, copy, theme presets, social links, language behavior, and feature flags live in [`src/config.ts`](./src/config.ts). For full recipes (theme presets, Umami/Plausible/GA4 analytics, Giscus comments, subpath deploy), see the **[Customization Guide](./docs/CUSTOMIZATION.md)**:

### 1. Site Identity & Subpath

```ts
const SITE_ORIGIN = "https://your-domain.com";
const SITE_BASE = "/"; // Set "/my-repo/" for GitHub Pages project sites
```

### 2. Language Mode

```ts
const DEFAULT_LOCALE: SiteLocale = "en"; // "en" or "zh-CN"
const BILINGUAL = true; // Set false for single-language sites
```

- When `DEFAULT_LOCALE = "en"` and `BILINGUAL = true`, English lives at `/` and Chinese lives at `/zh/`.
- When `DEFAULT_LOCALE = "zh-CN"` and `BILINGUAL = true`, Chinese lives at `/` and English lives at `/en/`.
- When `BILINGUAL = false`, secondary routes are omitted and the language switcher is hidden.

### 3. Feature Toggles

```ts
const FEATURES = {
  notes: true,
  projects: true,
  friends: true,
  galleries: true,
  archives: true,
  search: true,
  githubHeatmap: true,
  pwa: true,
  dynamicOgImage: true,
  lightAndDarkMode: true,
  showBackButton: true,
} as const;
```

### 4. Related Data Files

| File | Purpose |
|---|---|
| [`src/config.ts`](./src/config.ts) | Site metadata, homepage monograph, verification tags, feature flags |
| [`src/config/friends.ts`](./src/config/friends.ts) | Dynamic friend link groups rendered on `/friends/` |
| [`src/data/projects.ts`](./src/data/projects.ts) | Project cards rendered on `/` and `/projects/` |
| [`src/data/article-series.ts`](./src/data/article-series.ts) | Ordered multi-part article series |
| [`src/data/gallery.ts`](./src/data/gallery.ts) | Curated slider images & metadata for `/galleries/` |

---

## Content Structure

```text
src/
  content/blog/          # Long-form articles (.md / .mdx)
  data/notes/            # Short study notes & memos (.md / .mdx)
  data/galleries/        # Gallery folders (<slug>/index.md + images)
public/
  brand/                 # Logo SVG, PNGs, apple-touch-icon, favicon.ico
  blog/                  # Local images referenced in articles
  gallery/optimized/     # Generated AVIF / WebP / JPG renditions
```

Create new content and validate frontmatter:

```bash
npm run content:new
npm run content:check
```

Optimize gallery photos after adding files under `src/data/galleries/`:

```bash
npm run gallery:optimize
```

Refresh your GitHub contribution heatmap snapshot (`gh` CLI required):

```bash
npm run github:contributions -- your-github-username
```

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run setup` | Interactive setup wizard for `src/config.ts` |
| `npm run clean:demo` | Remove starter demo posts, notes & gallery assets (`--dry-run` / `--yes`) |
| `npm run dev` | Start dev server with duplicate-process guard |
| `npm run build` | Build static site (`dist/`) + Pagefind search index |
| `npm run preview` | Preview built `dist/` locally |
| `npm run cli` | Open the Astro Orbit CLI overview |
| `npm run content:new` | Scaffold a new blog post or note (`draft: true`) |
| `npm run content:check` | Validate frontmatter, slugs, and local image paths |
| `npm run template:check` | Check for remaining starter placeholder values |
| `npm run verify:quick` | Run ESLint, `astro check`, unit tests, and content check |
| `npm run verify:full` | Run `verify:quick`, production build, and `smoke:dist` |

---

## Deployment

### GitHub Pages (Included Workflow)

Push to `main` to trigger [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).
- Root domain (`https://<user>.github.io/` or custom domain): leave `BASE_URL=/`.
- Project subpath (`https://<user>.github.io/<repo>/`): set repository variable `BASE_URL=/<repo>/` and `SITE=https://<user>.github.io/`.

### Vercel / Cloudflare Pages / Netlify

Pre-configured [`vercel.json`](./vercel.json) and [`netlify.toml`](./netlify.toml) files are included with long-lived immutable cache headers:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node version**: `22` (`.nvmrc` included)

---

## License

[MIT](./LICENSE)

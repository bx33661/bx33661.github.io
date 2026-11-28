<div align="center">
  <img src="./public/brand/orbit-logo.svg" width="84" height="84" alt="Astro Orbit logo" />
  <h1>Astro Orbit</h1>
  <p>
    <strong>A bilingual editorial technical blog &amp; personal knowledge base template built with Astro 7, Tailwind CSS 4, MDX, and Pagefind.</strong>
  </p>

  <p>
    <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
  </p>

  <p>
    <a href="https://bx33661.github.io/astro-orbit/">Live Demo</a> ·
    <a href="#quick-start">Quick Start</a> ·
    <a href="./docs/CUSTOMIZATION.md">Customization Guide</a> ·
    <a href="https://github.com/bx33661/astro-orbit/issues/new?template=bug_report.yml">Report Bug</a>
  </p>

  <p>
    <a href="https://github.com/bx33661/astro-orbit/actions/workflows/ci.yml"><img src="https://github.com/bx33661/astro-orbit/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="https://github.com/bx33661/astro-orbit/actions/workflows/deploy.yml"><img src="https://github.com/bx33661/astro-orbit/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages" /></a>
    <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white" alt="Astro 7" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
    <a href="https://pagefind.app"><img src="https://img.shields.io/badge/Search-Pagefind-1158D1?style=flat-square" alt="Pagefind" /></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" alt="MIT License" /></a>
  </p>
</div>

<p align="center">
  <a href="https://bx33661.github.io/astro-orbit/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./docs/screenshots/hero-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset="./docs/screenshots/hero-light.png" />
      <img alt="Astro Orbit Hero Preview" src="./docs/screenshots/hero-light.png" width="100%" />
    </picture>
  </a>
</p>

---

## Visual Tour

<table>
  <tr>
    <td width="50%" align="center">
      <img src="./docs/screenshots/article-showcase.png" alt="Article Reading Pipeline" />
      <br />
      <strong>Long-Form Reading</strong> · KaTeX, Mermaid, Shiki &amp; Callouts
    </td>
    <td width="50%" align="center">
      <img src="./docs/screenshots/search-modal.png" alt="Pagefind Instant Search" />
      <br />
      <strong>Zero-Backend Search</strong> · Static Pagefind (<code>⌘K</code> Modal)
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="./docs/screenshots/projects.png" alt="Projects & GitHub Heatmap" />
      <br />
      <strong>Projects &amp; Activity</strong> · Showcase Grid &amp; Contribution Calendar
    </td>
    <td width="50%" align="center">
      <img src="./docs/screenshots/gallery.png" alt="Fullscreen Art Gallery" />
      <br />
      <strong>Galleries</strong> · Ambient Slider, Lightbox &amp; AVIF/WebP Renditions
    </td>
  </tr>
</table>

---

## Why Astro Orbit?

- **Paper-Inspired Design &amp; WebGPU Observatory**: Editorial typography, light/dark themes with button-centered View Transitions reveal, liquid-glass navigation, and a zero-overhead precompiled WebGPU star-map shader.
- **Native Bilingual or Single-Language**: English at `/` and Chinese at `/zh/` out of the box—flip `DEFAULT_LOCALE` or set `BILINGUAL = false` in one line. Every navigation label, callout, footnote, gallery control, and dev check stays localized.
- **Zero-Code Theme Engine (`src/config.ts`)**: Switch between 6 curated accent presets (or supply custom hex colors) and watch CSS tokens and dynamic Satori OG images update in lockstep.
- **Complete Technical Authoring Pipeline**: MDX, GFM tables, KaTeX math, Mermaid diagrams, GitHub callouts, Shiki code blocks with filenames and folding, series navigation, and build-time image sizing.
- **Offline-Ready Static Search &amp; PWA**: Client-side Pagefind full-text indexing across locales (`en` + `zh-cn`), full subpath (`BASE_URL`) support, RSS feeds, and webmanifest generation.
- **Privacy-First &amp; Self-Hosted Fonts**: Open-source Plus Jakarta Sans &amp; JetBrains Mono bundled via Astro 7's native Fonts API, strict CSP with dynamic allowlisting for optional Umami / Plausible / GA4 analytics and Giscus comments.

---

## Quick Start

Create a new project via the Astro CLI, run the setup wizard, and remove demo content whenever you are ready:

```bash
# 1. Scaffold from the template
npm create astro@latest -- --template bx33661/astro-orbit

# 2. Configure title, author, URL, theme preset, languages & modules
npm run setup

# 3. Optional: remove starter demo posts & galleries (adds a clean hello-world.md)
npm run clean:demo -- --yes

# 4. Start the local dev server
npm run dev
```

Open `http://localhost:4321` in your browser. Requires **Node.js `>=22.12.0`**.

---

## Theme Presets

Set `THEME_PRESET` in [`src/config.ts`](./src/config.ts) (or set `accentLight` / `accentDark` for custom brand colors). Generated Open Graph cards automatically adopt your active palette.

| Preset | Light Accent | Dark Accent | Character |
|---|---|---|---|
| `cobalt` *(default)* | ![#1158d1](https://img.shields.io/badge/-%231158d1-1158d1?style=flat-square) | ![#78b8ff](https://img.shields.io/badge/-%2378b8ff-78b8ff?style=flat-square) | Deep sky ink &amp; crisp astronomical blue |
| `emerald` | ![#0f766e](https://img.shields.io/badge/-%230f766e-0f766e?style=flat-square) | ![#4ade80](https://img.shields.io/badge/-%234ade80-4ade80?style=flat-square) | Botanical teal &amp; luminous mint |
| `amber` | ![#b45309](https://img.shields.io/badge/-%23b45309-b45309?style=flat-square) | ![#fbbf24](https://img.shields.io/badge/-%23fbbf24-fbbf24?style=flat-square) | Warm ochre &amp; observatory gold |
| `violet` | ![#6d28d9](https://img.shields.io/badge/-%236d28d9-6d28d9?style=flat-square) | ![#c084fc](https://img.shields.io/badge/-%23c084fc-c084fc?style=flat-square) | Editorial indigo &amp; ultraviolet |
| `rose` | ![#be123c](https://img.shields.io/badge/-%23be123c-be123c?style=flat-square) | ![#fb7185](https://img.shields.io/badge/-%23fb7185-fb7185?style=flat-square) | Carmine print &amp; coral glow |
| `slate` | ![#334155](https://img.shields.io/badge/-%23334155-334155?style=flat-square) | ![#94a3b8](https://img.shields.io/badge/-%2394a3b8-94a3b8?style=flat-square) | Monochrome ink &amp; cool graphite |

---

## One-Click Deploy

<p>
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbx33661%2Fastro-orbit"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></a>
  &nbsp;
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/bx33661/astro-orbit"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a>
</p>

- **GitHub Pages**: Enable **Settings → Pages → Source: GitHub Actions**. [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) automatically detects your `SITE` and subpath `BASE_URL`.
- **Vercel / Netlify / Cloudflare Pages**: Pre-configured with [`vercel.json`](./vercel.json) and [`netlify.toml`](./netlify.toml) (build command `npm run build`, output directory `dist`, Node `22`).

---

<details>
<summary><strong>Configuration Highlights (<code>src/config.ts</code>)</strong></summary>

All primary identity, copy, styling, and module toggles live in [`src/config.ts`](./src/config.ts)—see [`docs/CUSTOMIZATION.md`](./docs/CUSTOMIZATION.md) for the full recipe book:

- **Language &amp; Routing**: `DEFAULT_LOCALE` (`"en"` | `"zh-CN"`), `BILINGUAL` (`true` | `false`)
- **Appearance**: `THEME_PRESET`, `THEME_DEFAULT_MODE` (`"system"` | `"light"` | `"dark"`), optional `accentLight` / `accentDark`
- **Socials &amp; Share**: `SITE.socials` (`github`, `x`, `linkedin`, `mail`, `telegram`, `globe`, `rss`) and `SITE.shareLinks`
- **Feature Toggles (`FEATURES`)**: `notes`, `projects`, `friends`, `galleries`, `archives`, `search`, `githubHeatmap`, `pwa`, `dynamicOgImage`, `lightAndDarkMode`, `showBackButton`
- **Optional Integrations ([`.env.example`](./.env.example))**: Umami, Plausible, GA4 analytics (`PUBLIC_ENABLE_ANALYTICS=true`) and Giscus comments (`PUBLIC_ENABLE_COMMENTS=true`)

</details>

<details>
<summary><strong>Project Structure</strong></summary>

```text
src/
  config.ts              # Single source of truth for site settings, theme, socials, & modules
  config/friends.ts      # Friend directory groups
  content/blog/          # Long-form articles (.md / .mdx)
  data/notes/            # Study notes (.md / .mdx)
  data/galleries/        # Gallery albums (<slug>/index.md + source images)
  data/projects.ts       # Project showcase entries
  data/article-series.ts # Curated multi-part series
public/
  brand/                 # Logo SVGs, PNGs, apple-touch-icon, favicon.ico
  gallery/optimized/     # Generated responsive AVIF / WebP / JPG assets
scripts/                 # Interactive setup, clean:demo, content tooling, and Node tests
```

</details>

<details>
<summary><strong>CLI Scripts Reference</strong></summary>

| Command | Description |
|---|---|
| `npm run setup` | Interactive wizard to customize `src/config.ts` |
| `npm run clean:demo` | Remove starter demo posts, notes &amp; gallery assets (`--dry-run` / `--yes`) |
| `npm run dev` | Start dev server with duplicate-process guard |
| `npm run build` | Build static site (`dist/`) + Pagefind search index |
| `npm run preview` | Preview built `dist/` locally |
| `npm run cli` | Open the Astro Orbit CLI overview |
| `npm run content:new` | Scaffold a new blog post or note draft (`--title`, `--type`, `--lang`) |
| `npm run content:check` | Validate frontmatter, slugs, and local image paths |
| `npm run gallery:optimize` | Generate responsive AVIF / WebP / JPG renditions |
| `npm run github:contributions` | Refresh GitHub heatmap snapshot (`gh` CLI required) |
| `npm run template:check` | Audit remaining starter placeholder defaults (`--strict` for CI) |
| `npm run verify:full` | Run ESLint, `astro check`, unit tests, `content:check`, `build`, and `smoke:dist` |

</details>

---

## Contributing & License

Contributions, bug reports, and ideas are welcome—see [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

Released under the [MIT License](./LICENSE).

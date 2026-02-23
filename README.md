# Devosfera Blog

Heavily customized version of the [AstroPaper](https://github.com/satnaing/astro-paper) theme with a **Terminal/Cyberpunk** aesthetic, image galleries, global search modal, and dozens of visual and interactive improvements.

**🌐 Live demo:** [devosfera.vercel.app](https://devosfera.vercel.app)

![Devosfera OG](public/devosfera-og.webp)

---

## Table of contents

1. [Features](#-features)
2. [Project structure](#-project-structure)
3. [Installation & local development](#-installation--local-development)
4. [Commands](#-commands)
5. [Creating content](#-creating-content)
   - [Posts](#posts-srcdatablog)
   - [Image galleries](#galleries-srcdatagalleries)
6. [GalleryEmbed component](#%EF%B8%8F-galleryembed-component)
7. [Configuration](#%EF%B8%8F-configuration)
8. [Key components](#-key-components)
9. [Upstream issues resolved](#-upstream-issues-resolved)
10. [License](#-license)

---

## ✨ Features

### Core (inherited from AstroPaper)

- Type-safe Markdown, 100/100 Lighthouse performance, accessible and responsive
- Full SEO (meta tags, Open Graph, sitemap, RSS), light/dark mode
- Dynamically generated OG images with Satori

### Terminal/Cyberpunk design

- Hero with animated prompt `~/ready-to-go $`, shimmer title and `// posts` decorative separators
- Global backdrop: grid + ambient glow + cursor glow + noise texture (all pages)
- Glassmorphism on navbar, TOC, cards and modals

### Custom typography

| Role          | Font                      |
| :------------ | :------------------------ |
| Body          | `Wotfard` (local)         |
| Code / Mono   | `Cascadia Code` (local)   |
| Italics / H3  | `Sriracha` (Google Fonts) |

### Global search (⌘K)

- Modal via `⌘K` / `Ctrl+K` powered by **Pagefind** (static index)
- Animated aurora, reactive cursor glow, full keyboard navigation

### Image galleries (`/galleries`)

- Albums in `src/data/galleries/<slug>/`; images optimized at build-time (srcset, WebP, lazy)
- Native lightbox with `<dialog>`, responsive grid 2→4 cols
- `<GalleryEmbed>` to embed galleries inside MDX posts without importing
- Controlled by `showGalleries` in `src/config.ts` — see [GALLERIES.md](GALLERIES.md)

### Branded audio player

- Intro audio player in the hero with terminal aesthetic (wave bars, progress bar)
- Fully togglable and configurable from `src/config.ts`

### Redesigned pages

| Page        | Highlights                                          |
| :---------- | :-------------------------------------------------- |
| `/` Home    | Terminal hero, featured grid, section counters      |
| `/archives` | Vertical timeline with glow                         |
| `/tags`     | Grid with proportional progress bar                 |
| `/search`   | Reactive aurora, restyled Pagefind                  |
| Posts       | Glassmorphism TOC, prev/next navigation with aurora |

---

## 🚀 Project structure

```
/
├── public/
│   ├── audio/             # Audio files (intro, etc.)
│   └── pagefind/          # Search index (generated at build)
├── src/
│   ├── assets/            # Local fonts, SVG icons and logo
│   ├── components/        # Reusable Astro components
│   ├── data/
│   │   ├── blog/          # Posts .md / .mdx
│   │   └── galleries/     # Galleries (one folder per album)
│   ├── layouts/           # Root layout, PostDetails, etc.
│   ├── pages/             # Astro routes
│   ├── styles/            # global.css, typography.css
│   └── utils/             # Filters, OG with Satori, Shiki transformers
└── astro.config.ts
```

---

## 👨🏻‍💻 Installation & local development

**Requirements:** Node.js 20+ and pnpm.

```bash
# 1. Install dependencies
pnpm install

# 2. Development server
pnpm run dev
# → http://localhost:4321
```

The Pagefind search index is **only available in the production build**. To test it locally:

```bash
pnpm run build && pnpm run preview
```

### Docker

```bash
docker build -t devosfera-blog .
docker run -p 4321:80 devosfera-blog
```

---

## 🧞 Commands

| Command            | Action                                                   |
| :----------------- | :------------------------------------------------------- |
| `pnpm install`     | Install dependencies                                     |
| `pnpm run dev`     | Local dev server at `localhost:4321`                     |
| `pnpm run build`   | Production build (`astro check` + build + Pagefind)      |
| `pnpm run preview` | Preview the production build                             |
| `pnpm run format`  | Format with Prettier                                     |
| `pnpm run lint`    | Lint with ESLint                                         |

> `pnpm run build` internally runs `pagefind --site dist && cp -r dist/pagefind public/`. The search index ends up in `public/pagefind/` ready for preview.

---

## 📝 Creating content

### Posts (`src/data/blog/`)

Create a `.md` or `.mdx` file with the following frontmatter:

```yaml
---
title: "Post title"
pubDatetime: 2026-01-15T10:00:00Z   # required — ISO 8601 with timezone
description: "Short description for SEO and cards"
tags: ["astro", "dev"]
featured: false       # highlight on the home page
draft: false          # hidden in production
timezone: "America/Guatemala"  # overrides SITE.timezone
hideEditPost: false
---
```

**MDX**: JSX components can be used directly. `<GalleryEmbed>` is available without importing it (see next section).

**Table of Contents**: add `## Table of contents` to the post body to auto-generate the TOC with `remark-toc` + `remark-collapse`.

**Annotated code blocks** (via Shiki transformers):

```
// [!code highlight]      → highlight the line
// [!code ++]             → added line (diff)
// [!code --]             → removed line (diff)
// fileName: file.ts      → display the filename above the block
```

---

### Galleries (`src/data/galleries/`)

Create a **folder** with the desired slug. Place an `index.md` and image files inside:

```
src/data/galleries/
└── my-trip-to-tokyo/
    ├── index.md
    ├── 01-shibuya.jpg
    ├── 02-asakusa.jpg
    └── 03-fuji.png
```

The folder name becomes the URL: `/galleries/my-trip-to-tokyo`.

Images are displayed **sorted alphabetically**. Use numeric prefixes (`01-`, `02-`, …) to control the order.

#### Gallery frontmatter

```yaml
---
title: "My Trip to Tokyo"           # required
description: "Travel photos..."     # required
pubDatetime: 2026-01-20T00:00:00Z   # required
draft: false
coverImage: ./01-shibuya.jpg        # optional — explicit cover image
tags:
  - japan
  - travel
---
```

> Galleries have no body text; all visual content comes from the images in the folder.

#### Cover image

- **With `coverImage`**: Astro resolves and optimizes the relative path. If that image is already in the folder it won't be shown twice on the detail page.
- **Without `coverImage`**: the first image (alphabetically) is used as the cover in listing cards.

#### Automatic alt text

The alt text is derived from the filename:

```
01-sunset-kyoto.jpg     →  "Sunset Kyoto"
002_fuji_mountain.png   →  "Fuji Mountain"
IMG_4532.JPG            →  gallery title (fallback)
```

---

## 🖼️ GalleryEmbed component

Embed a gallery inside any `.mdx` post — **no import needed**:

```mdx
{/* First 6 photos, 3 columns (default) */}
<GalleryEmbed slug="my-trip-to-tokyo" />

{/* Only 4 photos in 2 columns, no footer link */}
<GalleryEmbed slug="my-trip-to-tokyo" limit={4} cols={2} showLink={false} />

{/* All photos */}
<GalleryEmbed slug="my-trip-to-tokyo" limit={0} />
```

| Prop       | Type          | Default | Description                                               |
| :--------- | :------------ | :------ | :-------------------------------------------------------- |
| `slug`     | `string`      | —       | **Required.** Folder name in `src/data/galleries/`        |
| `limit`    | `number`      | `6`     | Max images to show. `0` = all                             |
| `showLink` | `boolean`     | `true`  | Show link to the full gallery at the bottom               |
| `cols`     | `2 \| 3 \| 4` | `3`     | Number of grid columns                                    |

Each `<GalleryEmbed>` creates its own lightbox `<dialog id="ge-lb-{slug}">`, allowing **multiple embeds in the same post** without conflicts. Invalid slugs render a warning block instead of breaking the build.

---

## ⚙️ Configuration

All site configuration lives in `src/config.ts` (the `SITE` constant):

```ts
export const SITE = {
  website: "https://devosfera.vercel.app/",
  author: "Andrés",
  desc: "A space where curiosity turns into code",
  title: "Devosfera",
  timezone: "America/Guatemala",  // default timezone for posts
  showArchives: true,
  showGalleries: true,   // false → hides /galleries and the nav link
  showBackButton: true,
  dynamicOgImage: true,
  introAudio: {
    enabled: true,               // show/hide the hero audio player
    src: "/audio/intro-web.mp3", // path relative to /public
    label: "INTRO.MP3",
    duration: 30,                // seconds
  },
};
```

Social links and "Share" links are defined in `src/constants.ts`.

> For details on visual effects, typography and the design system see [CUSTOMIZATIONS.md](CUSTOMIZATIONS.md).

---

## 🧩 Key components

| Component               | Description                                                                      |
| :---------------------- | :------------------------------------------------------------------------------- |
| `Header.astro`          | Glassmorphism navbar with animated SVG logo, `⌘K` trigger, fullscreen mobile menu |
| `SearchModal.astro`     | Global Cmd+K modal with Aurora background, reactive cursor glow and Pagefind     |
| `GalleryCard.astro`     | Card for the `/galleries` listing with optimized cover image                     |
| `GalleryEmbed.astro`    | Gallery embed for MDX posts with its own lightbox                                |
| `Card.astro`            | Post card with reactive cursor glow (`.card-glow-effect`)                        |
| `BackToTopButton.astro` | `fixed` button with SVG progress ring, unified mobile/desktop design             |
| `BackButton.astro`      | Glassmorphism pill with inline breadcrumb and chevron animation                  |
| `ShareLinks.astro`      | Square glassmorphism share buttons, open in new tab                              |
| `Footer.astro`          | Brand column + social links + copyright, gradient separators                     |

---

## 🐛 Upstream issues resolved

Bugs and feature requests from the official [AstroPaper](https://github.com/satnaing/astro-paper) repository implemented in this version:

| Issue                                                      | Description                                                                                                                                                                                                             | Files                                        | Credits                                                                                                                                                   |
| :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#614](https://github.com/satnaing/astro-paper/issues/614) | **Back to Top shifts the pagination button** when `ShareLinks` is empty                                                                                                                                                 | `BackToTopButton.astro`                      | —                                                                                                                                                         |
| [#574](https://github.com/satnaing/astro-paper/issues/574) | **Markdown tables overflow the layout on mobile** — fixed with `w-full table-auto` and `word-wrap` on cells                                                                                                             | `typography.css`                             | [@GladerJ](https://github.com/GladerJ) — [solution](https://github.com/satnaing/astro-paper/issues/574#issuecomment-3427381261)                           |
| [#569](https://github.com/satnaing/astro-paper/issues/569) | **Back to Top inconsistent on desktop** — unified circular design with progress ring and `fixed` positioning                                                                                                            | `BackToTopButton.astro`, `PostDetails.astro` | —                                                                                                                                                         |
| [#566](https://github.com/satnaing/astro-paper/issues/566) | **Share links don't open in a new tab** — added `target="_blank"` and `rel="noopener noreferrer"`                                                                                                                       | `ShareLinks.astro`                           | [PR #611](https://github.com/satnaing/astro-paper/pull/611) by [@zerone0x](https://github.com/zerone0x)                                                   |
| [#131](https://github.com/satnaing/astro-paper/issues/131) | **No MDX support** — added `@astrojs/mdx` integration with `extendMarkdownConfig: true`                                                                                                                                | `astro.config.ts`, `content.config.ts`       | —                                                                                                                                                         |
| [#495](https://github.com/satnaing/astro-paper/issues/495) | **Inconsistent post filtering by timezone** — fixed using `dayjs` + `utc`/`timezone` plugins; also fixed a bug in the reference solution that used `.millisecond()` instead of `.valueOf()`                            | `postFilter.ts`                              | [@kj-9](https://github.com/kj-9) — [reference fix](https://github.com/satnaing/astro-paper/compare/main...kj-9:astro-paper:fix-post-filter-date)          |
| [#553](https://github.com/satnaing/astro-paper/issues/553) | **No galleries section** — implemented full `/galleries` section with lightbox, `GalleryEmbed`, image optimization and `showGalleries` flag. See [GALLERIES.md](GALLERIES.md)                                           | multiple — see GALLERIES.md                  | —                                                                                                                                                         |

---

## 📜 License

Based on [AstroPaper](https://github.com/satnaing/astro-paper) by [Sat Naing](https://satnaing.dev), licensed under MIT.
Customizations © 0xdres.

# Projects Page Design

**Date:** 2026-07-20  
**Status:** Approved  
**Site:** `bx33661.github.io` (Astro 7.1.2)

## Goal

Add a **Projects** section as a security-research / tooling showcase. Visitors should quickly see what you build, then open a detail page for background, approach, and highlights.

## Decisions

| Topic | Choice |
|-------|--------|
| Positioning | Research / tooling showcase (not pure resume wall) |
| Depth | List + detail page per project |
| First projects | oh-my-vul, Wireshark-MCP, PureAutoCodeQL |
| Content model | Markdown/MDX content collection (blog-parallel) |
| Nav | Primary nav item `Projects` between Notes and About |
| Card | Cover + title + one-liner + tags + status + GitHub |
| Detail body | README skeleton + research narrative |
| Related posts | Out of scope for v1 |
| Approach | Blog-isomorphic collection (Approach 1) |

## Out of scope (v1)

- Blog post linking (manual or automatic)
- Live GitHub stars / stats APIs
- Filters, search, pagination (only a few projects)
- Rigid multi-section frontmatter schema (Approach 2)
- About page redesign
- Per-project dynamic OG image generation

## Information architecture

### Routes

| Path | Role |
|------|------|
| `/projects/` | Card grid list |
| `/projects/oh-my-vul/` | Detail |
| `/projects/wireshark-mcp/` | Detail |
| `/projects/pure-auto-codeql/` | Detail |

Slugs are kebab-case.

### Content layout

```text
src/content/projects/
  oh-my-vul.md
  wireshark-mcp.md
  pure-auto-codeql.md

public/projects/          # optional covers
```

### Frontmatter schema

```ts
{
  title: string
  description: string
  pubDatetime: date
  modDatetime?: date | null
  tags: string[]                 // default []
  status: "active" | "wip" | "archived"  // default "active"
  repo: string                   // URL, required
  demo?: string                  // URL
  cover?: image()
  order?: number                 // lower first
  featured?: boolean
  draft?: boolean
  slug?: string
}
```

### Sort

1. Exclude `draft === true`
2. `order` ascending (missing order sorts after numbered ones)
3. Tie-break: `pubDatetime` descending

Suggested first orders: oh-my-vul `1`, wireshark-mcp `2`, pure-auto-codeql `3`.

### Detail body convention (markdown headings, not schema)

- Overview
- Problem
- Approach
- Highlights
- Stack (optional)
- Links (optional if hero already has repo/demo)

## UI

### List `/projects/`

- Header: title `Projects`, short subtitle about research/tools
- Responsive grid: 1 col mobile, 2 cols `sm+`
- Card: cover (or monogram placeholder), title, status pill, description (1–2 lines), tags, GitHub secondary link
- Whole card navigates to detail; GitHub is a separate external link

### Detail `/projects/<slug>/`

- Back to Projects (existing back/breadcrumb patterns OK)
- `ProjectHero`: cover, title, description, status, tags, Repo / Demo buttons
- Prose body via `render()` + `<Content />` (same family as notes)
- v1: no Giscus, share bar, or edit-post chrome

### Visual constraints

- Reuse site CSS variables (`--accent`, `--border`, `--muted`, …)
- List feels like a showcase grid; detail feels like readable long-form
- Motion: light hover only
- UI copy Chinese; project proper nouns keep English names

## Technical plan (Astro 7.1.2)

### New / replace

- `src/content.config.ts` — add `projects` collection
- `src/utils/projects.ts` — list/sort/slug helpers
- `src/components/ProjectCard.astro`
- `src/components/ProjectHero.astro`
- `src/pages/projects/index.astro` — real list
- `src/pages/projects/[...slug].astro` — detail (`getStaticPaths` + `render`)
- Remove stale `src/pages/projects/[...path].astro`

### Nav

- `Header.astro` desktop + mobile: insert Projects → `/projects/`

### Legacy cleanup (required)

Current site treats `/projects` as deprecated → galleries. Must reverse:

| Location | Action |
|----------|--------|
| `public/_redirects` | Remove `/projects*` → `/galleries/` rules |
| `scripts/smoke-dist.mjs` | Assert real projects list, not galleries redirect |
| `scripts/smoke-source.mjs` | Stop treating `/projects` as universally stale (keep sw/manifest sanity as needed) |
| `scripts/content-check.mjs` | Validate new fields (`repo`, `status`, …) |
| `scripts/content-new.mjs` | Support `--type projects` |
| `src/pages/sitemap.xml.ts` | Include `/projects/` + detail slugs |
| README table | Optional one-line module entry |

### SEO

- List/detail titles + descriptions via `Layout`
- Canonical = current URL
- Sitemap includes non-draft projects
- Default site OG OK for v1; cover may be used later

### Quality gate

- `npm run check`
- `npm run build` && `npm run smoke:dist`
- Manual: nav → list → detail → GitHub

## Success criteria

1. Primary nav reaches Projects; three cards communicate what each project is
2. Detail pages have research-oriented copy + repo links
3. Adding a project ≈ one markdown file + optional cover
4. Style consistent with existing site tokens
5. Checks/build/smoke pass after legacy redirect removal

## Implementation order

1. Schema + utils + three content files
2. List/detail pages + card/hero components
3. Header nav
4. Redirects / smoke / content-check / sitemap / content-new
5. Verify check + build

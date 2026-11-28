# Customization Guide

Astro Orbit keeps site identity, copy, styling presets, feature toggles, and social configuration in one typed entry file: [`src/config.ts`](../src/config.ts).

---

## 1. Initial Setup & Removing Demo Content

Run the interactive wizard first, then optionally clear the starter demo posts and gallery assets:

```bash
npm run setup
npm run clean:demo -- --dry-run   # preview what will be removed
npm run clean:demo -- --yes       # apply cleanup and create hello-world.md
```

---

## 2. Accent Color Presets & Default Light/Dark Mode

In [`src/config.ts`](../src/config.ts):

```ts
const THEME_PRESET: ThemePreset = "cobalt"; // "cobalt" | "emerald" | "amber" | "violet" | "rose" | "slate"
const THEME_DEFAULT_MODE: ThemeDefaultMode = "system"; // "system" | "light" | "dark"
```

Need exact brand hex values? Set `SITE.theme.accentLight` and `SITE.theme.accentDark`:

```ts
theme: {
  preset: THEME_PRESET as ThemePreset,
  defaultMode: THEME_DEFAULT_MODE as ThemeDefaultMode,
  accentLight: "#0f766e",
  accentDark: "#4ade80",
},
```

- Changes apply automatically to CSS `--accent`, FOUC first-paint script, and **dynamic OG card generation** (`og-templates/card.ts`).

---

## 3. Social Links & Post Share Buttons

Edit `SITE.socials` and `SITE.shareLinks` directly in [`src/config.ts`](../src/config.ts):

```ts
socials: [
  { name: "GitHub", href: "https://github.com/your-handle", icon: "github" },
  { name: "X", href: "https://x.com/your-handle", icon: "x" },
  { name: "Website", href: "https://your-site.dev", icon: "globe" },
  { name: "Mail", href: "mailto:hello@example.com", icon: "mail" },
],

shareLinks: ["x", "telegram", "whatsapp", "facebook", "mail"], // set [] to keep Copy Link only
```

Supported social icons: `"github" | "x" | "linkedin" | "mail" | "telegram" | "globe" | "rss"`.

---

## 4. Language & Bilingual Routing

```ts
const DEFAULT_LOCALE: SiteLocale = "en"; // "en" or "zh-CN"
const BILINGUAL = true;                // set false for a single-language site
```

- `DEFAULT_LOCALE = "en"`, `BILINGUAL = true` → English at `/`, Chinese at `/zh/`.
- `DEFAULT_LOCALE = "zh-CN"`, `BILINGUAL = true` → Chinese at `/`, English at `/en/`.
- `BILINGUAL = false` → single-language site at `/`, language toggle hidden.

---

## 5. Modular Feature Toggles

Turn sections on or off cleanly in `FEATURES` ([`src/config.ts`](../src/config.ts)):

- `notes` — Study notes section (`/notes/`)
- `projects` & `githubHeatmap` — Projects showcase & GitHub contribution calendar (`/projects/`)
- `friends` — Curated friend links directory (`/friends/` + [`src/config/friends.ts`](../src/config/friends.ts))
- `galleries` — Fullscreen slider + per-album pages (`/galleries/` + [`src/data/gallery.ts`](../src/data/gallery.ts))
- `archives` — Chronological archive & writing cadence heatmap (`/archives/`)
- `search` — `⌘K` search modal & `/search/` page (Pagefind)
- `pwa`, `dynamicOgImage`, `lightAndDarkMode`, `showBackButton`

---

## 6. Analytics & Giscus Comments

1. Copy [`.env.example`](../.env.example) to `.env` (or configure secrets/variables in your CI/hosting dashboard).
2. **Privacy-friendly analytics**: set `PUBLIC_ENABLE_ANALYTICS=true` and fill in one provider:
   - **Umami**: `PUBLIC_UMAMI_SCRIPT_URL` + `PUBLIC_UMAMI_WEBSITE_ID`
   - **Plausible**: `PUBLIC_PLAUSIBLE_DOMAIN` (+ optional `PUBLIC_PLAUSIBLE_SCRIPT_URL`)
   - **Google Analytics 4**: `PUBLIC_GA_MEASUREMENT_ID`
   - Only configured providers are injected, and their origins are automatically added to the Content Security Policy (`script-src` / `connect-src`).
3. **Giscus comments**: set `PUBLIC_ENABLE_COMMENTS=true` and fill `PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY`, `PUBLIC_GISCUS_CATEGORY_ID`.

---

## 7. Deployment

- **GitHub Pages**: Push to `main` using [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). For subpath sites (`https://<user>.github.io/<repo>/`), set `SITE=https://<user>.github.io/` and `BASE_URL=/<repo>/`.
- **Vercel**: Ready out of the box via [`vercel.json`](../vercel.json).
- **Netlify**: Ready out of the box via [`netlify.toml`](../netlify.toml).
- **Cloudflare Pages**: Build command `npm run build`, output directory `dist`, Node `22`.

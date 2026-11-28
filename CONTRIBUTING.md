# Contributing to Astro Orbit

Thanks for helping make **Astro Orbit** better for both writers and readers!

## Local Development

Requires **Node.js `>=22.12.0`** (see [`.nvmrc`](./.nvmrc)).

```bash
npm install
npm run dev
```

## Before Opening a Pull Request

Run the full verification suite:

```bash
npm run verify:full
```

This runs ESLint, `astro check`, unit tests (`node --test scripts/*.test.mjs`), content frontmatter checks, a fresh production build + Pagefind indexing, and `smoke:dist`.

If you modify routes, CSS, or static asset URLs, also check subpath builds:

```bash
BASE_URL=/astro-orbit/ npm run build
```

## Guidelines

- Keep `src/config.ts` free of `@/` path-alias imports so CLI scripts, Node tests, and `astro.config.ts` can read it directly.
- Add or update unit tests under `scripts/*.test.mjs` for utility logic.
- Keep user-facing strings localized in `src/i18n/ui.ts` for both `"en"` and `"zh-CN"`.

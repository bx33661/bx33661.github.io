---
title: "Getting Started with Astro Orbit"
description: "Configure your site identity, feature toggles, bilingual routes, and deploy Astro Orbit in minutes."
date: 2026-11-10
modDatetime: 2026-11-20
tags:
  - "Astro"
  - "Guide"
  - "Template"
authors:
  - "orbit"
slug: "getting-started-with-astro-orbit"
lang: "en"
translationKey: "getting-started"
---

## Table of contents

## Overview

**Astro Orbit** is a paper-inspired, editorial technical blog and personal knowledge base built with Astro 7, Tailwind CSS 4, MDX, and Pagefind.

Everything from site metadata and modular features to homepage copy is centralized in `src/config.ts`.

## Quick Configuration

Run the interactive setup wizard after cloning or creating your project:

```bash
npm run setup
```

Or edit `src/config.ts` directly to customize:

- **Identity**: `title`, `author`, `email`, `profile`, `website`, `base`
- **Languages**: `i18n.defaultLocale` (`"en"` or `"zh-CN"`) and `i18n.bilingual` (`true` or `false`)
- **Feature toggles**: `features.notes`, `features.projects`, `features.friends`, `features.galleries`, `features.archives`, `features.search`, `features.githubHeatmap`, `features.pwa`, `features.dynamicOgImage`

> [!TIP]
> Run `npm run template:check` at any time to audit placeholder fields before your first deploy.

## Authoring Content

Use the built-in CLI scaffold to create new posts or study notes:

```bash
npm run content:new -- --title "My First Post" --tags "Astro, Engineering"
npm run content:check
```

New entries start as `draft: true`. Set `draft: false` when ready to publish.

## Deployment

Astro Orbit builds to pure static files in `dist/` and indexes every page locally with Pagefind:

1. Push to `main` to trigger the included GitHub Pages workflow (`.github/workflows/deploy.yml`).
2. For repository subpaths such as `https://<user>.github.io/<repo>/`, set `BASE_URL=/<repo>/` in `astro.config.ts` or your CI environment variables.
3. Deploy cleanly to Vercel, Cloudflare Pages, or Netlify with `npm run build` and output directory `dist`.

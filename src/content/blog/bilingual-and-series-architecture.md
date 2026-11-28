---
title: "Bilingual Writing & Series Architecture"
description: "How Astro Orbit pairs translated entries via translationKey and orders multi-part series cleanly."
date: 2026-11-18
tags:
  - "Astro"
  - "i18n"
  - "Architecture"
authors:
  - "orbit"
slug: "bilingual-and-series-architecture"
lang: "en"
---

## Table of contents

## Explicit Translation Pairing

Instead of guessing translations from matching filenames, Astro Orbit pairs bilingual entries using an explicit `translationKey` in frontmatter:

```yaml
lang: "en"
translationKey: "getting-started"
```

When an entry shares a unique `translationKey` with one entry in the other locale, the language switch button in the header and `hreflang` link tags jump directly between them.

## Curated Reading Series

Define reading series in `src/data/article-series.ts` using stable article slugs:

```ts
export const articleSeries = [
  {
    title: "Astro Orbit Guide",
    slugs: ["getting-started-with-astro-orbit", "bilingual-and-series-architecture"],
  },
];
```

Draft or unpublished entries are automatically omitted until published, and series navigation keeps chapter order strictly aligned with your editorial sequence rather than publication timestamps.

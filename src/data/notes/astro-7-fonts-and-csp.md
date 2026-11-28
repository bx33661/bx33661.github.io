---
title: "Astro 7 Fonts API & Strict CSP"
description: "How self-hosted fonts and explicit Content-Security-Policy rules work together in Astro Orbit."
date: 2026-11-12
category: "Engineering"
tags:
  - "Astro"
  - "Fonts"
authors:
  - "orbit"
slug: "astro-7-fonts-and-csp"
lang: "en"
translationKey: "fonts-and-csp"
---

## Self-Hosted Typography

Astro Orbit bundles open-source variable fonts via Astro 7's native Fonts API so browsers load typography from your own origin with zero third-party font tracking.

## CSP Considerations

ClientRouter transitions keep `assetsInlineLimit` disabled for `.mjs` / `.js` modules so dynamically imported scripts obey strict `script-src 'self'` policies.

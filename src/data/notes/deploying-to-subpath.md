---
title: "Deploying to a Repository Subpath"
description: "Notes on configuring SITE and BASE_URL for GitHub Pages project repositories."
date: 2026-11-14
category: "Deployment"
tags:
  - "GitHub Pages"
  - "CI"
authors:
  - "orbit"
slug: "deploying-to-subpath"
lang: "en"
---

## Subpath URLs

When hosting at `https://<user>.github.io/<repo>/`, set `BASE_URL=/<repo>/` and update `SITE` to `https://<user>.github.io/`.

All internal links, RSS feeds, sitemaps, Pagefind bundle paths, and the PWA service worker scope respect `withBase(...)`.

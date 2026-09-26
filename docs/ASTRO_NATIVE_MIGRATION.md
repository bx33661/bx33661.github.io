# Astro native adoption — 2026-09-26

This change keeps the site static on GitHub Pages and preserves published article URLs.

## Applied

- Astro 7.3.5, MDX 8.0.2, React integration 7.0.0, and Markdown Remark 7.3.1 are locked in `package-lock.json`.
- `astro:assets` Fonts API now serves the existing Wotfard and Cartograph WOFF2 files from `/_astro/fonts/`. Only the body font is preloaded. The old `src/styles/fonts.css` was not imported anywhere; its third-party Inter/Noto declarations were dead code, not an active dependency. Chinese text uses system fallbacks, avoiding a full CJK font download.
- Homepage projects and awards now come from Astro content collections. Project records may use `reference("blog")`; the PureAutoCodeQL record references `codeql-learning`. The publications collection has an empty source until there is a verified publication to add. No publication has been invented.
- One CyberGym screenshot uses native `<Picture />` output in its MDX article. The original `public/blog/cybergym-ai-security-agent-benchmark/02-dataset-metadata.png` is retained at the same URL. In a cold Chrome visit, the selected image transferred 18,046 B at 390px and 126,244 B at 1440px (DPR 1), versus the 801,901 B original. This is a pilot, not a bulk content rewrite.

## Sätteri comparison — not enabled

An isolated Sätteri build was compared with the regular unified build for five published posts: CyberGym, CodeQL, the LG NAS advisory, Agent Teams, and TCP/IP. Both builds produced the same heading **IDs** in those samples, but the HTML was not equivalent:

- The custom heading-demotion plugin did not run under the unported pipeline, so article `h1` elements replaced expected `h2` elements in several posts.
- The custom image plugin did not run, removing `loading="lazy"`, `decoding="async"`, and responsive source selection from Markdown screenshots.
- Some typography, table serialization, and code-block whitespace also changed.

Keep `unified()` until the remark/rehype behavior has been ported and browser/search/SEO checks pass against the full article set. The temporary Sätteri config and sample output are ignored local research artifacts under `.tmp/astro-native-2026-09-26/`.

## Deferred

- Astro i18n routing: the homepage is already English-first, but there is no separate translated page corpus. Enabling locale routing now would duplicate content and risk existing URLs. Add it when there are real translated pages, keeping current blog URLs as the default routes.
- Experimental incremental builds: 58 posts and 424 generated pages do not yet justify cache-key and CI complexity. Revisit after measuring a genuine build-time bottleneck.
- Bulk movement of public article images: keep stable image URLs; move only measured high-impact assets with preserved fallbacks.

## Acceptance

`npm run verify:full` runs lint, Astro typecheck, source/content checks, build, Pagefind, dist smoke, and visual browser checks. The dist smoke asserts local font output, the CyberGym native picture and legacy fallback URL. The visual check covers the CyberGym image on mobile and desktop in both themes.

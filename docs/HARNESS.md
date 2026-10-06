# Blog Harness

## Entry points

Use Node from `.nvmrc` and `npm ci` against `package-lock.json`. `npm run harness:doctor` checks Node, local dependencies, Git state and preview port (default 4339; override with `HARNESS_PORT`). It reports feature-toggle values without exposing secrets.

`npm run verify:quick` runs ESLint, Astro typecheck, Node unit tests, source smoke, and content check. `npm run verify:full` adds the Astro/Pagefind build, dist smoke, and `verify:visual`. Local verification disables analytics and comments; it never runs `baidu:push`. CI uses the same full command and installs Playwright Chromium first. On macOS, visual checks use the installed Google Chrome.

`verify:visual` starts an isolated preview on the doctor port and captures 24 light/dark desktop/mobile screenshots of home, friends, article, search, archive, and gallery in `.visual-artifacts/`. It checks HTTP status, horizontal overflow, clipped visible headings, homepage secondary-text contrast (at least 4.5:1), early placement of featured research on mobile, and theme switching. The ignored screenshot directory and `report.txt` are uploaded by CI on failure. Screenshots are diagnostic artifacts, not pixel-perfect golden comparisons; review them for visual changes before delivery.

## Content contract

`src/content.config.ts` is the runtime metadata schema. For blog entries, `title` and `description` are required; `date` or `pubDatetime` supplies the publication date (the schema falls back to epoch if both are missing). `tags`, `authors`, `draft`, and `slug` are optional in the schema. `scripts/content-check.mjs` currently requires `date` for blog and notes, flags duplicate slugs and missing local images, and recommends tags/authors. New articles should use `npm run content:new` and pass both the schema/build and content check. The publisher Skill may suggest stricter editorial style, but must not present optional fields as schema requirements.

## Task evidence

At start, record `git status --short` and the relevant baseline. At completion, report actual commands, exit codes, and failures (distinguishing pre-existing ones). Content edits protect claims, citations and images; code edits protect behavior, URLs and styling. Do not weaken checks to make a task pass. Commits, pushes and deployments are distinct actions and require explicit task direction.

## Next coverage

P1: add fixed public/draft content fixtures, Pagefind query-and-click coverage, tag navigation, and a stable visual baseline or perceptual diff. Keep third-party comments outside the default gate. Do not treat existing text-marker smoke checks as reader-behavior proof.

## Article reading experience

The article browser gate checks listing date ordering, image viewing, focus/scroll restoration, code copying, table-of-contents navigation, series links and route cleanup in both themes and viewport sizes. Image enlargement is frameless; inline code has no border, tables retain horizontal dividers, and formulas have no card background.

## Reading motion

The reading-motion browser flow checks URL-derived shared-title identity across ClientRouter navigation, real image-origin animation keyframes and centered final geometry, repeated Escape, scroll/focus restoration, mobile TOC motion, clipboard feedback, theme changes, back-to-top visibility, live reduced-motion preference changes, and animation cleanup during route swaps. It runs in both themes and at both viewport sizes. Prose is never hidden behind a scroll-reveal observer; no animation library is added.

The second motion pass adds a one-time, viewport-only archive entrance (420ms, 45ms stagger capped at 180ms). Router visits keep the existing surface transition instead of replaying the entrance. Related articles, series chapters and previous/next links assign a shared title identity only to the activated link after the route loads, so repeated destinations never produce duplicate native ViewTransition names. Abort and swap release this temporary identity. Keyboard navigation receives the same continuity and hover feedback; reduced motion skips both additions.

The third pass uses a 520ms button-centred native theme reveal. Only the root snapshot participates; article title identities are restored after it finishes. The geometry covers all viewport corners, and rapid toggles, route interruption and live reduced-motion changes commit the latest theme and release the snapshot. Cursor glow uses a fixed-size composited layer, one pending animation frame and a 70ms settling constant; it stops on leave, blur, page swap or preference changes, and stays off for touch/coarse pointers.

## Markdown reading formats

The production MD/MDX configuration is shared in `src/utils/articleMarkdown.ts`. `scripts/markdown-reading.test.mjs` exercises KaTeX/MathML, GFM tables/alignment/tasks, alerts, fences, footnote labels/backlinks and component isolation. `verify:visual` also runs `scripts/markdown-reading-browser.mjs` in four theme/viewport combinations, with an additional 320px geometry check. It uses the production parser and article layout without publishing a fixture route or adding a search entry. Screenshots cover formula/table scrolling and visible disclosure paragraphs; keyboard, clipboard, footnote and image checks assert behavior. Authoring conventions are documented in `docs/MARKDOWN.md`.

## Code hardening

`code-hardening.test.mjs` covers concurrent cache-load coalescing, completion-based TTL, invalidation/rejection races, guarded storage, volatile theme choices, local back-link validation and JSON-LD script-boundary escaping. The theme module owns one typed live API; the first-paint inline script only selects CSS and tolerates denied storage.

Search uses a native dialog and the shared reader-dialog controller. Native modality keeps the page background inert; the controller wraps keyboard focus, leases the original body scroll state, and ignores stale queued close events after reopening. Both Pagefind and development search mounts belong to an AbortSignal. A delayed import cannot mount on a replacement DOM node, move focus after navigation or update the new route's query string. Abort destroys the real Pagefind instance. The search page preserves its hash when synchronizing `q`.

The published gallery and embedded galleries share the same dialog lifecycle and one gallery controller. Previous/next behavior stays cyclic for the gallery page and clamped for embeds; all controls and listeners are released before swaps. ClientRouter remains the sole owner of scroll restoration; article setup no longer resets browser Back or hash navigation to the top. Clipboard feedback belongs to the latest click, not whichever asynchronous request finishes last.

`code-hardening-browser.mjs` extends all four theme/viewport combinations with theme API/DOM identity, clipboard completion races, native background inertness, Tab wrapping, rapid close/reopen, scroll-lock restoration, modal route departure, search hash retention, browser Back, real gallery keyboard controls and cleanup. Additional isolated contexts exercise denied storage property/method/write access, cross-tab `clear()` and a dynamically imported Pagefind UI chunk held across navigation. Existing assertions and published routes remain unchanged.

Local `/blog/` Markdown images receive dimensions from the published file's metadata at build time (including EXIF orientation). Existing URLs, authored aspect ratios and responsive PNG/WebP fallbacks remain intact; remote and component-owned images are untouched. Metadata reads stay under `public/` and never fetch remote assets. Tests verify real PNG dimensions, malformed/missing paths and idempotent responsive wrapping. Real Pagefind chapter-link clicks assert the post-enhancement heading position and reserved image dimensions in all four theme/viewport combinations.

The production build uses `astro build --force`. Astro's content cache can otherwise reuse rendered Markdown after a custom plugin implementation changes, even when source/type/unit gates pass. Forced content rebuilds plus the real built-HTML dimension and chapter-position assertions ensure the current parser implementation reaches the site; no cache-buster article edits or temporary published routes are needed.

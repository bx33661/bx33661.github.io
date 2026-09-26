# Blog Harness

## Entry points

Use Node from `.nvmrc` and `npm ci` against `package-lock.json`. `npm run harness:doctor` checks Node, local dependencies, Git state and preview port (default 4339; override with `HARNESS_PORT`). It reports feature-toggle values without exposing secrets.

`npm run verify:quick` runs ESLint, Astro typecheck, source smoke, and content check. `npm run verify:full` adds the Astro/Pagefind build, dist smoke, and `verify:visual`. Local verification disables analytics and comments; it never runs `baidu:push`. CI uses the same full command and installs Playwright Chromium first. On macOS, visual checks use the installed Google Chrome.

`verify:visual` starts an isolated preview on the doctor port and captures 24 light/dark desktop/mobile screenshots of home, friends, article, search, archive, and gallery in `.visual-artifacts/`. It checks HTTP status, horizontal overflow, clipped visible headings, homepage secondary-text contrast (at least 4.5:1), early placement of featured research on mobile, and theme switching. The ignored screenshot directory and `report.txt` are uploaded by CI on failure. Screenshots are diagnostic artifacts, not pixel-perfect golden comparisons; review them for visual changes before delivery.

## Content contract

`src/content.config.ts` is the runtime metadata schema. For blog entries, `title` and `description` are required; `date` or `pubDatetime` supplies the publication date (the schema falls back to epoch if both are missing). `tags`, `authors`, `draft`, and `slug` are optional in the schema. `scripts/content-check.mjs` currently requires `date` for blog and notes, flags duplicate slugs and missing local images, and recommends tags/authors. New articles should use `npm run content:new` and pass both the schema/build and content check. The publisher Skill may suggest stricter editorial style, but must not present optional fields as schema requirements.

## Task evidence

At start, record `git status --short` and the relevant baseline. At completion, report actual commands, exit codes, and failures (distinguishing pre-existing ones). Content edits protect claims, citations and images; code edits protect behavior, URLs and styling. Do not weaken checks to make a task pass. Commits, pushes and deployments are distinct actions and require explicit task direction.

## Next coverage

P1: add fixed public/draft content fixtures, Pagefind query-and-click coverage, tag navigation, and a stable visual baseline or perceptual diff. Keep third-party comments outside the default gate. Do not treat existing text-marker smoke checks as reader-behavior proof.

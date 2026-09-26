# Blog agent entry

This is an Astro static blog with React islands, Tailwind, and Pagefind. Preserve published article URLs, readable content, searchability, and mobile layout.

- Routes: `src/pages/`; layouts/components: `src/layouts/`, `src/components/`; blog content: `src/content/blog/`; notes and galleries: `src/data/`; static assets: `public/`.
- Content metadata authority: `src/content.config.ts`. `scripts/content-check.mjs` adds repository-wide checks; `.agents/skills/blog-post-publisher/` is an editing guide, not a competing schema. See `docs/HARNESS.md`.
- Before editing, run `git status --short` and `npm run harness:doctor`. Existing changes belong to the current worktree; do not reset or overwrite unrelated work.
- Code/content tasks: `npm run verify:quick`. Before delivery or for route/search/build changes: `npm run verify:full`. UI changes also need a browser check and screenshot; external-service checks are separate.
- Do not change published URLs, bulk-rewrite articles, push, or deploy unless the task explicitly calls for it. Validation does not authorize publication.
- Delivery: summarize changed files, exact checks and results, known pre-existing failures, route compatibility where relevant, and how to revert this task's changes.

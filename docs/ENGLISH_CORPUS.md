# Full English corpus

The English edition uses the existing shared layouts, components, styles, and assets. It does not have a separate visual framework.

## Coverage

- 55 public blog posts and 9 Notes have explicit English counterparts.
- The first three English posts retain their published URLs and bodies.
- This batch adds 52 blog translations and 9 Notes translations.
- Chinese bodies and published URLs are unchanged. Only `translationKey` is added to previously unpaired source frontmatter.
- English entries retain source dates/authors and use `lang: en`, `draft: false`, explicit pairing keys, and unique lowercase `-en` slugs. English Notes do not inherit `formerBlogSlug` redirects.
- `scripts/english-corpus.json` is the audited pair manifest, including immutable Chinese-body SHA-256 hashes.

## Translation workflow

Six `gpt-6-luna` workers translated bounded prose chunks. Code fences, inline code, URLs, imports, and executable markup were protected before translation and restored afterward. Separate workers reviewed other workers' batches. Parent review restored paragraph correspondence, retained mixed-language duplicate passages, checked all metadata, and assembled the articles.

Source wording, dates, factual assertions, code comments, terminal output, and screenshots are retained rather than silently updated. Screenshots/code may consequently contain Chinese. Shared TrustBoundarySimulator, MiniappAuditFeature, MiniappAuditDiagram, and Gist components accept a locale and use one server/client dictionary (`src/i18n/articles.ts`); no English copies of these components exist.

Reusable worker prompt:

```text
Translate every assigned prose chunk from Chinese into complete, natural English.
Preserve every fact, qualifier, paragraph, heading level, list item, table row,
Markdown marker, and protected token. Do not summarize, add, deduplicate, or
correct the source. Keep code, URLs, imports, paths, and executable markup exact.
Translate visible metadata; keep descriptions between 40 and 180 characters.
Write every assigned part and metadata file, then compare protected tokens and
structure with the source. Independently review another worker's batch.
```

## Verification and publication

```sh
npm run verify:quick
npm run verify:full
node --test scripts/english-corpus.test.mjs
node scripts/english-corpus-browser.mjs
node scripts/english-publication-browser.mjs
node scripts/i18n-browser.mjs
```

The corpus test checks all pairs, code blocks, resource URLs, imports, heading/list/table structure, English prose/metadata, source body hashes, and complete public-source coverage. The corpus browser gate loads all 64 counterparts, checks precise language switching and canonicals, walks all blog pagination, checks all 9 Notes, clicks a real English Notes Pagefind result, and tests both interactive components on desktop/mobile in light/dark themes. The original three-article and shared-design browser gates remain separate regressions.

The Chinese search JSON retains its pre-existing blog-only shape (55 items). English search JSON contains the complete 64-item translated corpus. English RSS contains 55 blog entries; Notes remain outside the blog feed.

## Revert

Revert this batch's release commit to restore the first-three-article English edition. Task evidence also includes a hash-guarded `ROLLBACK.sh`, baseline copies, a patch, and a modified-file archive. Test rollback on a separate copy first. Validation alone never authorizes publishing future content.

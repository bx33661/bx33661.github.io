# Upstream Sync SOP (`astro-orbit` → `bx33661.github.io`)

This blog tracks **`bx33661/astro-orbit`** (`upstream`) cleanly via standard two-parent Git history so template improvements, styling fixes, and Astro upgrades can be merged downstreams with minimal conflicts.

---

## Ownership Boundaries

| Layer | Files | Rule |
|---|---|---|
| **1. Upstream Core** | Shared `src/components/*`, `src/layouts/*`, `src/styles/*`, `src/scripts/*`, `src/utils/*`, `src/i18n/{index,content,ui}.ts`, `src/pages/[locale]/*`, core pages, `astro.config.ts` | Always edit shared features in `astro-orbit` first, then merge downstream (`git checkout --theirs` on rare conflicts). |
| **2. Downstream Personal Assets** | `src/content/**`, `src/data/**`, `public/*`, `CyberGym*`/`Miniapp*`/`Wifi*`/`TrustBoundary*`, legacy SEO redirect pages (`/about`, `/album`, `/archive`, `/bento`, `/notes/[page]`, `/tags/*`), `scripts/site-smoke.mjs`, `scripts/baidu-push.mjs`, `scripts/indexnow-push.mjs`, `.github/workflows/*` | Never touched by `upstream`. Zero merge conflicts. |
| **3. Thin Config Bridge** | `src/config.ts`, `src/config/friends.ts`, `package.json`, `src/content.config.ts`, `README.md` | Keep personal settings (`SITE`, `FRIEND_GROUPS`, `site-smoke`) intact while adopting any new optional keys from `upstream`. |

---

## Standard Sync Workflow

1. Develop & verify generic improvements in `/Users/zhangboxiang/Progarm/bx33661/astro-orbit` and push/tag a release on GitHub.
2. In `/Users/zhangboxiang/Progarm/bx33661/bx33661.github.io`, merge from `upstream/main`:

```bash
git fetch upstream --tags
git checkout -b sync/astro-orbit-vX.Y.Z
git merge upstream/main

# Ensure no upstream demo files or docs accidentally sneak into the personal site,
# then run full verification:
npm run verify:full
```

3. Compare `dist/` URLs if routes changed, inspect in browser, then merge to `main` and push.

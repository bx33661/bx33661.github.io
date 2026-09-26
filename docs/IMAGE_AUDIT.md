# Image load audit — 2026-09-26

## Method

Cold Chrome sessions against a fresh `npm run build` and `astro preview`, with analytics/comments disabled. Playwright viewport sizes: 390×844 and 1440×900, DPR 1. `response.body().length` sums successful image response bytes from navigation through network-idle. This is **image transfer**, not total page transfer or compressed HTTP transfer. The same script and routes were used before/after. Baseline and modified JSONL plus screenshots are in `.tmp/image-audit/`.

| Route | View | Before | After | Change |
|---|---:|---:|---:|---:|
| `/` | mobile and desktop | 154,171 B | 44,985 B | −70.8% |
| `/blog/k8x9w2m7/` | mobile | 1,389,740 B | 122,497 B | −91.2% |
| `/blog/k8x9w2m7/` | desktop | 1,389,740 B | 303,237 B | −78.2% |
| `/blog/wechat-miniapp-security-audit/` | mobile and desktop | 13,258,008 B | 8,389 B | −99.9% |

The homepage had no large hero image. Its unused `/touxiang-512.png` preload alone cost 109,186 B, so it was removed. The L3HCTF screenshot is in the first viewport: 3,420px PNG (1,350,556 B) is now a responsive, lossless 800/1600px WebP (114,108/294,848 B). The miniapp article previously fetched all screenshots immediately, including 5,209,981 B and 2,431,755 B PNGs far below the fold. Its images now load lazily; the two largest have responsive WebP alternatives. Scrolling to the Xcode screenshot transfers 1,431,853 B on mobile or 2,321,892 B on desktop, including neighboring images within Chrome's lazy-load threshold.

## Implementation and compatibility

- `rehypeArticleImages` applies `loading="lazy"` and `decoding="async"` to local blog images, except the measured first-viewport L3HCTF image (`eager`, high priority). Three heavy screenshots get `<picture>` with 800/1600px lossless WebP choices, intrinsic dimensions, and the original PNG as fallback.
- Existing `/blog/.../*.png` URLs and source pixels remain unchanged. Original SHA-256: L3HCTF `f92df36cc8e76af0834144adf32b56dcf0660a052bab1acc18641b165dd726fc`; Xcode `dec5d80b9e7efde2b1c17cda0a6dfca8b9dd590d827dd58311d8bec99c2a4391`; endpoints `b2a4ac7e7e1c0ea18332359121027f6ecdb063d2f239ce18a6041dc750052adf`.
- `node scripts/optimize-article-images.mjs` regenerates the six variants from those originals. `smoke:dist` checks generated files, markup, and the removed preload. Existing gallery optimization remains Astro-managed.
- `public/` gains about 1.85 MB of variants because original URLs are preserved. The improvement targets **bytes downloaded per visit**, not repository disk size. Do not move a published PNG into `src/` without a URL-preserving redirect or fallback.

## Verification

`npm run verify:full` passed: lint, typecheck, source/content checks, build, dist smoke, and 24 visual screenshots (contrast, overflow, headings, theme toggle). The affected first-viewport article was inspected at mobile width; no visual clipping was observed. Browser measurements and screenshots were repeated after the build.

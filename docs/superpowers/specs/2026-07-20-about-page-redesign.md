# About page redesign — lightweight personal card

Date: 2026-07-20  
Status: Implemented in `src/pages/about.astro`

## Goal

Make `/about/` a fast, lightweight personal brand card: who BX is, what they focus on, how to reach them — in under 3 seconds.

## Decisions

| Axis | Choice |
|------|--------|
| Tone | Personal brand card (not terminal résumé) |
| Content | Lightweight: identity + one-line bio + focuses + links |
| Layout | Full-bleed hero: left copy · center mark · right meta (reference: sparse SaaS landing) |
| Motion | Soft CSS bloom only (no canvas); respects `prefers-reduced-motion` |
| Out of scope | Timeline/experience, gallery, page-local theme toggle, heavy canvas effects |

## Information architecture

1. Left: kicker `About` → giant name `BX` → role → short bio → GitHub / Email pills
2. Center: avatar as brand mark with soft radial bloom (the page signature)
3. Right: uppercase focus lines + location

Removed: fake `bx33661.cv` title, dead theme button, flag emoji, experience timeline, contact section, gallery, halftone canvas.

## Visual system

- Tokens: site `--background`, `--foreground`, `--accent`
- Lots of negative space; no bordered card chrome
- Type: large tight sans display for name; cartograph mono for kicker / right-hand lines
- Signature: centered avatar + breathing soft glow (CSS only)
- CTAs: primary filled pill + secondary outline pill

## Responsive

- `≤900px`: stack center mark on top, left copy, then right lines as a wrapped row
- Touch targets and focus outlines inherit global styles

## Performance notes

Earlier jank came from per-dot canvas gradients. This revision removes the canvas entirely on about — zero rAF cost. Identity mark is a static image + CSS blur bloom.

## Success criteria

- [x] No experience/gallery/theme-toggle clutter
- [x] Clear identity hierarchy with generous whitespace
- [x] Center mark is the memorable element
- [x] Reduced motion respected
- [ ] Visual check in light + dark after deploy/preview

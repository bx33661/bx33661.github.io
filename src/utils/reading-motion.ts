/** A single, restrained motion vocabulary; no runtime animation dependency. */
export const READING_MOTION = {
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  exitEase: "cubic-bezier(0.4, 0, 1, 1)",
  imageIn: 380,
  imageOut: 240,
  dialogIn: 280,
  dialogOut: 180,
  listIn: 420,
  listStagger: 45,
  listMaxDelay: 180,
  themeIn: 520,
  cursorSettle: 70,
};

/** A button-centred reveal must cover the furthest viewport corner. */
export function themeRevealGeometry(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (
    ![x, y, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  x = Math.max(0, Math.min(width, x));
  y = Math.max(0, Math.min(height, y));
  return {
    x,
    y,
    radius:
      Math.ceil(Math.hypot(Math.max(x, width - x), Math.max(y, height - y))) +
      1,
  };
}

/** Keep a large archive from turning into a long entrance sequence. */
export function readingEntryDelay(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(
    READING_MOTION.listMaxDelay,
    Math.max(0, Math.floor(index)) * READING_MOTION.listStagger,
  );
}

type Box = { x: number; y: number; width: number; height: number };

/** FLIP uses viewport coordinates, not document offsets, even after scrolling. */
export function imageOriginTransform(source: Box, target: Box): string | null {
  if (
    ![
      source.x,
      source.y,
      source.width,
      source.height,
      target.x,
      target.y,
      target.width,
      target.height,
    ].every(Number.isFinite) ||
    source.width <= 0 ||
    source.height <= 0 ||
    target.width <= 0 ||
    target.height <= 0
  )
    return null;
  const x = source.x + source.width / 2 - target.x - target.width / 2;
  const y = source.y + source.height / 2 - target.y - target.height / 2;
  return `translate(${x}px, ${y}px) scale(${source.width / target.width}, ${source.height / target.height})`;
}

/** URL-derived names stay distinct even when article titles repeat. */
export function articleTransitionName(href: string): string {
  const path = new URL(href, "https://blog.invalid").pathname.replace(
    /\/+$/,
    "",
  );
  let hash = 2166136261;
  for (const char of path) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return `reading-title-${(hash >>> 0).toString(16)}`;
}

const incoming = {
  name: "reading-surface-in",
  duration: "320ms",
  easing: READING_MOTION.ease,
  fillMode: "both",
};
const outgoing = {
  name: "reading-surface-out",
  duration: "140ms",
  easing: READING_MOTION.exitEase,
  fillMode: "both",
};
export const readingTransition = {
  forwards: { old: outgoing, new: incoming },
  backwards: { old: outgoing, new: incoming },
};

import { READING_MOTION } from "../utils/reading-motion";

const reducedListeners = new Set<() => void>();
let reducedMql: MediaQueryList | null = null;

function getReducedMotionQuery(): MediaQueryList {
  if (!reducedMql) {
    reducedMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMql.addEventListener("change", () => {
      for (const listener of [...reducedListeners]) listener();
    });
  }
  return reducedMql;
}

export const prefersReducedMotion = () => getReducedMotionQuery().matches;

export function animateReading(
  element: Element,
  keyframes: Keyframe[],
  duration: number,
  easing = READING_MOTION.ease,
): Animation | null {
  if (prefersReducedMotion() || typeof element.animate !== "function") return null;
  const animation = element.animate(keyframes, { duration, easing });
  const mql = getReducedMotionQuery();
  const stop = () => {
    if (mql.matches) animation.finish();
  };
  reducedListeners.add(stop);
  const cleanup = () => reducedListeners.delete(stop);
  void animation.finished.then(cleanup, cleanup);
  return animation;
}

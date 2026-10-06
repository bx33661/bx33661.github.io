import { READING_MOTION } from "../utils/reading-motion";

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function animateReading(
  element: Element,
  keyframes: Keyframe[],
  duration: number,
  easing = READING_MOTION.ease,
): Animation | null {
  if (prefersReducedMotion() || typeof element.animate !== "function")
    return null;
  const animation = element.animate(keyframes, { duration, easing });
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const stop = () => {
    if (preference.matches) animation.finish();
  };
  preference.addEventListener("change", stop);
  const cleanup = () => preference.removeEventListener("change", stop);
  void animation.finished.then(cleanup, cleanup);
  return animation;
}

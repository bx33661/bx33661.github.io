import { READING_MOTION, themeRevealGeometry } from "../utils/reading-motion";
import { prefersReducedMotion } from "./reading-motion";

type Reveal = {
  commit: () => void;
  transition: ViewTransition | null;
  animation: Animation | null;
  dispose: () => void;
};
let active: Reveal | null = null;

function release(reveal: Reveal) {
  reveal.dispose();
  if (active !== reveal) return;
  active = null;
  delete document.documentElement.dataset.themeReveal;
}

export function finishThemeReveal(commit = true) {
  const reveal = active;
  if (!reveal) return;
  // Even a skipped native transition still queues its DOM callback. Commit once
  // now, then invalidate that callback before navigation or a second toggle.
  if (commit) reveal.commit();
  release(reveal);
  reveal.animation?.cancel();
  reveal.transition?.skipTransition();
}

export function revealTheme(button: HTMLElement, apply: () => void): boolean {
  finishThemeReveal();
  const box = button.getBoundingClientRect();
  const circle = themeRevealGeometry(
    box.x + box.width / 2,
    box.y + box.height / 2,
    innerWidth,
    innerHeight,
  );
  if (prefersReducedMotion() || !document.startViewTransition || !circle) {
    apply();
    return false;
  }
  let applied = false;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onPreference = () => {
    if (preference.matches) finishThemeReveal();
  };
  const reveal: Reveal = {
    commit: () => {
      if (!applied) {
        applied = true;
        apply();
      }
    },
    transition: null,
    animation: null,
    dispose: () => preference.removeEventListener("change", onPreference),
  };
  active = reveal;
  document.documentElement.dataset.themeReveal = "true";
  preference.addEventListener("change", onPreference);
  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(() => {
      if (active === reveal) reveal.commit();
    });
  } catch {
    reveal.commit();
    release(reveal);
    return false;
  }
  reveal.transition = transition;
  void transition.ready.then(
    () => {
      if (active !== reveal) return;
      const origin = `${circle.x}px ${circle.y}px`;
      try {
        reveal.animation = document.documentElement.animate(
          [
            { clipPath: `circle(0px at ${origin})` },
            { clipPath: `circle(${circle.radius}px at ${origin})` },
          ],
          {
            duration: READING_MOTION.themeIn,
            easing: READING_MOTION.ease,
            pseudoElement: "::view-transition-new(root)",
          },
        );
      } catch {
        transition.skipTransition();
        release(reveal);
        return;
      }
      // Keep snapshot CSS in place until the native transition removes its tree.
      void reveal.animation.finished.catch(() => {});
    },
    () => {
      if (active === reveal) reveal.commit();
      release(reveal);
    },
  );
  void transition.finished.then(
    () => release(reveal),
    () => release(reveal),
  );
  return true;
}

document.addEventListener("astro:before-preparation", () =>
  finishThemeReveal(),
);
window.addEventListener("pagehide", () => finishThemeReveal());

import { READING_MOTION } from "../utils/reading-motion";

let controller: AbortController | null = null;
let hideCurrent: (() => void) | null = null;

function setupCursorGlow() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  const backdrop = document.querySelector<HTMLElement>(".site-backdrop");
  const glow = backdrop?.querySelector<HTMLElement>(".site-cursor-glow");
  if (!backdrop || !glow) return;
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let previousTime = 0;
  let tracking = false;
  let x = 0,
    y = 0,
    targetX = 0,
    targetY = 0;
  const hide = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    tracking = false;
    glow.classList.remove("active");
    glow.style.willChange = "";
  };
  hideCurrent = hide;
  const tick = (time: number) => {
    frame = 0;
    if (signal.aborted || !tracking) return;
    const elapsed = Math.min(64, Math.max(1, time - previousTime));
    previousTime = time;
    const blend = 1 - Math.exp(-elapsed / READING_MOTION.cursorSettle);
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    if (Math.hypot(targetX - x, targetY - y) < 0.25) {
      x = targetX;
      y = targetY;
    } else frame = requestAnimationFrame(tick);
    backdrop.style.setProperty("--site-cx", `${x}px`);
    backdrop.style.setProperty("--site-cy", `${y}px`);
  };
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!fine.matches || reduced.matches || event.pointerType !== "mouse")
        return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!tracking) {
        x = targetX;
        y = targetY;
        previousTime = performance.now();
      }
      tracking = true;
      glow.classList.add("active");
      glow.style.willChange = "transform";
      if (!frame) frame = requestAnimationFrame(tick);
    },
    { signal, passive: true },
  );
  document.addEventListener("pointerleave", hide, { signal });
  window.addEventListener("blur", hide, { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) hide();
    },
    { signal },
  );
  const preference = () => {
    if (!fine.matches || reduced.matches) hide();
  };
  fine.addEventListener("change", preference, { signal });
  reduced.addEventListener("change", preference, { signal });
  signal.addEventListener(
    "abort",
    () => {
      hide();
      backdrop.style.removeProperty("--site-cx");
      backdrop.style.removeProperty("--site-cy");
      if (hideCurrent === hide) hideCurrent = null;
    },
    { once: true },
  );
}

document.addEventListener("astro:page-load", setupCursorGlow);
document.addEventListener("astro:before-preparation", () => hideCurrent?.());
document.addEventListener("astro:before-swap", () => controller?.abort());

import { prefersReducedMotion } from "./reading-motion";

/** One scroll listener per article mount, including ClientRouter revisits. */
export function setupReadingControls(signal: AbortSignal) {
  const container = document.querySelector<HTMLElement>("#btt-btn-container");
  const button = container?.querySelector<HTMLButtonElement>(
    "[data-button='back-to-top']",
  );
  const ring = container?.querySelector<HTMLElement>("#progress-indicator");
  if (!container || !button || !ring) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const distance = Math.max(
      1,
      document.documentElement.scrollHeight - innerHeight,
    );
    const percent = Math.max(0, Math.min(100, (scrollY / distance) * 100));
    const visible = percent > 20;
    container.dataset.visible = String(visible);
    container.inert = !visible;
    container.setAttribute("aria-hidden", String(!visible));
    ring.style.backgroundImage = `conic-gradient(var(--accent) ${percent}%, transparent ${percent}%)`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  button.addEventListener(
    "click",
    () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "instant" : "smooth",
      });
    },
    { signal },
  );
  window.addEventListener("scroll", schedule, { signal, passive: true });
  window.addEventListener("resize", schedule, { signal, passive: true });
  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  signal.addEventListener(
    "abort",
    () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    },
    { once: true },
  );
  update();
}

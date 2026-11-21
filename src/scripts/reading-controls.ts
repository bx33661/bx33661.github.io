import { onViewportScroll } from "./astro-lifecycle";
import { prefersReducedMotion } from "./reading-motion";

/** One scroll listener per article mount, including ClientRouter revisits. */
export function setupReadingControls(signal: AbortSignal) {
  const container = document.querySelector<HTMLElement>("#btt-btn-container");
  const button = container?.querySelector<HTMLButtonElement>("[data-button='back-to-top']");
  const ring = container?.querySelector<HTMLElement>("#progress-indicator");
  if (!container || !button || !ring) return;

  const update = () => {
    const distance = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const percent = Math.max(0, Math.min(100, (scrollY / distance) * 100));
    const visible = percent > 20;
    container.dataset.visible = String(visible);
    container.inert = !visible;
    container.setAttribute("aria-hidden", String(!visible));
    ring.style.backgroundImage = `conic-gradient(var(--accent) ${percent}%, transparent ${percent}%)`;
  };

  const schedule = onViewportScroll(signal, update);
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

  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  update();
}

/**
 * Register a client setup callback bound to Astro ClientRouter lifecycle.
 * Aborts the previous signal cleanly before swaps and before re-mounting.
 */
export function onAstroPage(setup: (signal: AbortSignal) => void): void {
  let controller: AbortController | null = null;

  const mount = () => {
    controller?.abort();
    controller = new AbortController();
    setup(controller.signal);
  };

  document.addEventListener("astro:page-load", mount);
  document.addEventListener("astro:before-swap", () => {
    controller?.abort();
    controller = null;
  });

  if (document.readyState !== "loading") {
    mount();
  }
}

const scrollSchedulers = new WeakMap<AbortSignal, { callbacks: Set<() => void>; schedule: () => void }>();

/** Share one scroll/resize listener and one rAF batch per AbortSignal lifecycle. */
export function onViewportScroll(signal: AbortSignal, callback: () => void): () => void {
  let entry = scrollSchedulers.get(signal);
  if (!entry) {
    const callbacks = new Set<() => void>();
    let frame = 0;
    const flush = () => {
      frame = 0;
      for (const cb of callbacks) cb();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };
    window.addEventListener("scroll", schedule, { signal, passive: true });
    window.addEventListener("resize", schedule, { signal, passive: true });
    signal.addEventListener(
      "abort",
      () => {
        cancelAnimationFrame(frame);
        callbacks.clear();
      },
      { once: true },
    );
    entry = { callbacks, schedule };
    scrollSchedulers.set(signal, entry);
  }
  entry.callbacks.add(callback);
  return entry.schedule;
}

type Renderer = NonNullable<Awaited<ReturnType<typeof import("./starMapRenderer").createStarMapRenderer>>>;

/** Decorative hero enhancement. The SVG and static atmosphere never depend on JS/GPU. */
export function mountStarMaps(selector = "[data-star-map]") {
  const cleanups = [...document.querySelectorAll<HTMLElement>(selector)].map(mountStarMap);
  return () => cleanups.forEach((cleanup) => cleanup());
}

function mountStarMap(host: HTMLElement) {
  const canvas = host.querySelector<HTMLCanvasElement>("[data-star-map-canvas]");
  if (!canvas) return () => {};
  const lifetime = new AbortController();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let disposed = false;
  let failed = false;
  let renderer: Renderer | null = null;
  let attempt: AbortController | null = null;
  host.dataset.shaderState = "static";

  const allowed = () => !disposed && !failed && !reduced.matches && visible && !document.hidden;
  const stop = () => {
    attempt?.abort();
    attempt = null;
    renderer?.destroy();
    renderer = null;
    host.dataset.shaderState = "static";
  };
  const unavailable = () => {
    failed = true;
    stop();
    host.dataset.shaderState = "unavailable";
  };
  const sync = async () => {
    if (reduced.matches) {
      stop();
      return;
    }
    if (!allowed()) {
      renderer?.pause();
      return;
    }
    if (renderer) { renderer.resume(); return; }
    if (attempt) return;
    // No adapter probe or engine download for reduced motion or unsupported browsers.
    if (!("gpu" in navigator)) { unavailable(); return; }
    const current = new AbortController();
    attempt = current;
    host.dataset.shaderState = "loading";
    try {
      const { createStarMapRenderer } = await import("./starMapRenderer");
      if (current.signal.aborted || !allowed()) {
        if (attempt === current) { attempt = null; host.dataset.shaderState = "static"; }
        return;
      }
      const next = await createStarMapRenderer(canvas, current.signal, () => {
        if (!current.signal.aborted && !disposed) host.dataset.shaderState = "ready";
      }, () => { if (!current.signal.aborted && !disposed) unavailable(); });
      if (current.signal.aborted || disposed) { next?.destroy(); return; }
      renderer = next;
      if (!next) { unavailable(); return; }
      const size = canvas.getBoundingClientRect();
      next.resize(size.width, size.height);
      if (allowed()) next.resume(); else next.pause();
    } catch {
      if (!current.signal.aborted && !disposed) unavailable();
    } finally {
      // Keep the live generation's signal until teardown, so a queued onReady
      // callback cannot reveal a canvas after a preference/viewport change.
      if (attempt === current && !renderer) attempt = null;
    }
  };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    void sync();
  });
  intersection.observe(host);
  const resize = new ResizeObserver(() => {
    if (!renderer) return;
    const size = canvas.getBoundingClientRect();
    if (size.width > 0 && size.height > 0) renderer.resize(size.width, size.height);
  });
  resize.observe(canvas);
  const options = { signal: lifetime.signal };
  reduced.addEventListener("change", sync, options);
  document.addEventListener("visibilitychange", sync, options);
  return () => {
    disposed = true;
    lifetime.abort();
    intersection.disconnect();
    resize.disconnect();
    stop();
  };
}

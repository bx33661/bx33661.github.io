import { onAstroPage } from "./astro-lifecycle";
import { readStorage, writeStorage } from "@/utils/browser-storage";

function getCurrentTheme(): "dark" | "light" {
  const attr = document.documentElement.getAttribute("data-theme");
  const active = attr || window.theme?.getTheme?.() || "light";
  return active === "dark" ? "dark" : "light";
}

function initGiscusComments(signal: AbortSignal) {
  const host = document.querySelector<HTMLElement>("[data-giscus-host]");
  if (!host) return;

  const commentsSection = host.closest<HTMLElement>(".comments-panel");
  if (!commentsSection) return;

  const { repo, repoId, category, categoryId } = host.dataset;
  if (!repo || !repoId || !category || !categoryId) return;

  const storageKey = `bx:giscus:return:${window.location.pathname}`;
  let lastInteractionAt = 0;

  const markInteraction = () => {
    lastInteractionAt = Date.now();
  };

  const persistReturnPosition = () => {
    if (!lastInteractionAt || Date.now() - lastInteractionAt > 15_000) return;
    writeStorage(
      () => window.sessionStorage,
      storageKey,
      JSON.stringify({
        path: window.location.pathname,
        scrollY: window.scrollY,
        ts: Date.now(),
      }),
    );
  };

  const restoreReturnPosition = () => {
    const raw = readStorage(() => window.sessionStorage, storageKey);
    if (!raw) return;
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      return;
    }

    try {
      const saved = JSON.parse(raw);
      const isSamePage = saved?.path === window.location.pathname;
      const isFresh = Date.now() - Number(saved?.ts || 0) < 10 * 60 * 1000;
      const savedY = Number(saved?.scrollY);
      if (!isSamePage || !isFresh || Number.isNaN(savedY)) return;

      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: Math.max(savedY, commentsSection.offsetTop - 24),
          behavior: "auto",
        });
      });
    } catch {
      // Ignore malformed session state.
    }
  };

  const syncTheme = () => {
    const iframe = host.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    if (!iframe?.contentWindow || iframe.dataset.bxGiscusLoaded !== "true") return;

    iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: getCurrentTheme() } } }, "https://giscus.app");
  };

  const bindFrameLoad = () => {
    const frame = host.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    if (!frame) return false;
    if (frame.dataset.bxGiscusBound === "true") return true;

    frame.dataset.bxGiscusBound = "true";
    for (const evt of ["mouseenter", "pointerdown", "focus"] as const) {
      frame.addEventListener(evt, markInteraction, { signal });
    }
    frame.addEventListener(
      "load",
      () => {
        frame.dataset.bxGiscusLoaded = "true";
        syncTheme();
      },
      { signal },
    );
    return true;
  };

  host.replaceChildren();

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";

  const giscusAttrs: Record<string, string> = {
    "data-repo": repo,
    "data-repo-id": repoId,
    "data-category": category,
    "data-category-id": categoryId,
    "data-mapping": host.dataset.mapping ?? "pathname",
    "data-strict": host.dataset.strict ?? "0",
    "data-reactions-enabled": host.dataset.reactionsEnabled ?? "1",
    "data-emit-metadata": host.dataset.emitMetadata ?? "0",
    "data-input-position": host.dataset.inputPosition ?? "top",
    "data-theme": getCurrentTheme(),
    "data-lang": host.dataset.lang ?? "zh-CN",
    "data-loading": host.dataset.loading ?? "lazy",
  };
  for (const [name, value] of Object.entries(giscusAttrs)) {
    script.setAttribute(name, value);
  }
  host.appendChild(script);

  if (!bindFrameLoad()) {
    const observer = new MutationObserver(() => {
      if (bindFrameLoad()) {
        observer.disconnect();
      }
    });
    observer.observe(host, { childList: true, subtree: true });
    signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  }

  window.addEventListener("bx-theme-change", syncTheme, { signal });
  window.addEventListener("pagehide", persistReturnPosition, { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.visibilityState === "hidden") persistReturnPosition();
    },
    { signal },
  );

  if (document.readyState === "complete") {
    restoreReturnPosition();
  } else {
    window.addEventListener("load", restoreReturnPosition, { once: true, signal });
  }
}

onAstroPage(initGiscusComments);

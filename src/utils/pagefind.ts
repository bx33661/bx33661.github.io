import { pagefindTranslations } from "@/utils/pagefindTranslations";
import { mountDevSearch } from "./devSearch";

export type PagefindUIOptions = {
  element: string | HTMLElement;
  showImages?: boolean;
  showSubResults?: boolean;
  translations?: Record<string, string>;
  processTerm?: (term: string) => string;
};

export type PagefindUIInstance = {
  triggerSearch: (term: string) => void;
  destroy: () => void;
};

function createInputController(mount: HTMLElement, input: HTMLInputElement, signal?: AbortSignal): PagefindUIInstance {
  const instance: PagefindUIInstance = {
    triggerSearch: (term) => {
      if (signal?.aborted) return;
      input.value = term;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    destroy: () => mount.replaceChildren(),
  };
  signal?.addEventListener("abort", instance.destroy, { once: true });
  return instance;
}

/**
 * Canonical Pagefind loader and initializer.
 * Ensures uniform translation, accessibility, and configuration across modal and search pages.
 */
export async function createPagefindUI(
  options: PagefindUIOptions,
  signal?: AbortSignal,
): Promise<PagefindUIInstance | null> {
  const mount =
    typeof options.element === "string" ? document.querySelector<HTMLElement>(options.element) : options.element;
  if (!mount?.isConnected || signal?.aborted) return null;
  const isEnglish = document.documentElement.lang === "en";
  // No English index exists until an English article is published. Never let
  // Pagefind's language fallback accidentally search the Chinese index instead.
  if (isEnglish && document.documentElement.dataset.searchEmpty === "true") {
    const input = await mountDevSearch(mount, { entries: [], signal, onQueryChange: options.processTerm });
    if (!mount.isConnected || signal?.aborted) return null;
    return createInputController(mount, input, signal);
  }
  // Dynamic import required: @pagefind/default-ui relies on browser DOM and cannot be bundled during static SSR build time.
  const { PagefindUI } = await import("@pagefind/default-ui");
  if (!mount.isConnected || signal?.aborted) return null;
  const search = new PagefindUI({
    showImages: false,
    showSubResults: true,
    translations: isEnglish ? {} : pagefindTranslations,
    ...options,
    element: mount,
  });
  signal?.addEventListener("abort", () => search.destroy(), { once: true });
  return search;
}

export async function mountSearchUI(
  options: PagefindUIOptions & {
    devLimit?: number;
    devInitialQuery?: string;
    devOnQueryChange?: (term: string) => void;
  },
  signal?: AbortSignal,
): Promise<PagefindUIInstance | null> {
  const mount =
    typeof options.element === "string" ? document.querySelector<HTMLElement>(options.element) : options.element;
  if (!mount?.isConnected || signal?.aborted) return null;

  if (import.meta.env.DEV) {
    const input = await mountDevSearch(mount, {
      initialQuery: options.devInitialQuery,
      limit: options.devLimit,
      onQueryChange: options.devOnQueryChange,
      signal,
    });
    if (!mount.isConnected || signal?.aborted) return null;
    return createInputController(mount, input, signal);
  }

  return createPagefindUI(options, signal);
}

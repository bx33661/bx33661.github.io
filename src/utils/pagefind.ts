import { pagefindTranslations } from "@/utils/pagefindTranslations";

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

/**
 * Canonical Pagefind loader and initializer.
 * Ensures uniform translation, accessibility, and configuration across modal and search pages.
 */
export async function createPagefindUI(
  options: PagefindUIOptions,
  signal?: AbortSignal,
): Promise<PagefindUIInstance | null> {
  const mount =
    typeof options.element === "string"
      ? document.querySelector<HTMLElement>(options.element)
      : options.element;
  if (!mount?.isConnected || signal?.aborted) return null;
  // Dynamic import required: @pagefind/default-ui relies on browser DOM and cannot be bundled during static SSR build time.
  // @ts-expect-error Pagefind's default UI does not publish TypeScript types.
  const { PagefindUI } = await import("@pagefind/default-ui");
  if (!mount.isConnected || signal?.aborted) return null;
  const search = new PagefindUI({
    showImages: false,
    showSubResults: true,
    translations: pagefindTranslations,
    ...options,
    element: mount,
  }) as PagefindUIInstance;
  signal?.addEventListener("abort", () => search.destroy(), { once: true });
  return search;
}

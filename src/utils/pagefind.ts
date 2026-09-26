import { pagefindTranslations } from "@/utils/pagefindTranslations";

export type PagefindUIOptions = {
  element: string;
  showImages?: boolean;
  showSubResults?: boolean;
  translations?: Record<string, string>;
  processTerm?: (term: string) => string;
};

export type PagefindUIInstance = {
  triggerSearch: (term: string) => void;
  destroy?: () => void;
};

/**
 * Canonical Pagefind loader and initializer.
 * Ensures uniform translation, accessibility, and configuration across modal and search pages.
 */
export async function createPagefindUI(
  options: PagefindUIOptions,
): Promise<PagefindUIInstance> {
  // Dynamic import required: @pagefind/default-ui relies on browser DOM and cannot be bundled during static SSR build time.
  // @ts-expect-error Pagefind's default UI does not publish TypeScript types.
  const { PagefindUI } = await import("@pagefind/default-ui");
  return new PagefindUI({
    showImages: false,
    showSubResults: true,
    translations: pagefindTranslations,
    ...options,
  }) as PagefindUIInstance;
}

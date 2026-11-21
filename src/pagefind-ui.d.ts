declare module "@pagefind/default-ui" {
  export interface PagefindUIInitOptions {
    element: string | HTMLElement;
    showImages?: boolean;
    showSubResults?: boolean;
    translations?: Record<string, string>;
    processTerm?: (term: string) => string;
  }

  export class PagefindUI {
    constructor(options: PagefindUIInitOptions);
    triggerSearch(term: string): void;
    destroy(): void;
  }
}

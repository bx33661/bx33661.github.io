import { mountDevSearch } from "../utils/devSearch";
import { createPagefindUI } from "../utils/pagefind";

let controller: AbortController | null = null;
async function initSearchPage() {
  const mount = document.querySelector<HTMLElement>("#pagefind-search");
  if (!mount || mount.dataset.ready) return;
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  mount.dataset.ready = "true";
  signal.addEventListener("abort", () => delete mount.dataset.ready, {
    once: true,
  });
  const query = new URLSearchParams(location.search).get("q") ?? "";
  const setQueryParam = (term: string) => {
    if (signal.aborted) return;
    const url = new URL(location.href);
    if (term) url.searchParams.set("q", term);
    else url.searchParams.delete("q");
    history.replaceState(
      history.state,
      "",
      url.pathname + url.search + url.hash,
    );
  };
  try {
    if (import.meta.env.DEV) {
      await mountDevSearch(mount, {
        initialQuery: query,
        limit: 12,
        onQueryChange: setQueryParam,
        signal,
      });
    } else {
      const search = await createPagefindUI(
        {
          element: mount,
          processTerm: (term) => {
            setQueryParam(term);
            return term;
          },
        },
        signal,
      );
      if (query) search?.triggerSearch(query);
    }
  } catch {
    if (!signal.aborted) {
      mount.textContent = "搜索暂时不可用，请稍后重试。";
      delete mount.dataset.ready;
    }
  }
}

document.addEventListener("astro:page-load", initSearchPage);
document.addEventListener("astro:before-swap", () => controller?.abort());
void initSearchPage();

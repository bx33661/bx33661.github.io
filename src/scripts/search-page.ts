import { onAstroPage } from "./astro-lifecycle";
import { mountSearchUI } from "../utils/pagefind";

onAstroPage(async (signal) => {
  const mount = document.querySelector<HTMLElement>("#pagefind-search");
  if (!mount || mount.dataset.ready) return;

  mount.dataset.ready = "true";
  signal.addEventListener("abort", () => delete mount.dataset.ready, { once: true });

  const query = new URLSearchParams(location.search).get("q") ?? "";
  const setQueryParam = (term: string) => {
    if (signal.aborted) return;
    const url = new URL(location.href);
    if (term) url.searchParams.set("q", term);
    else url.searchParams.delete("q");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  };

  try {
    const search = await mountSearchUI(
      {
        element: mount,
        processTerm: (term) => {
          setQueryParam(term);
          return term;
        },
        devInitialQuery: query,
        devLimit: 12,
        devOnQueryChange: setQueryParam,
      },
      signal,
    );
    if (query) search?.triggerSearch(query);
  } catch {
    if (!signal.aborted) {
      mount.textContent =
        document.documentElement.lang === "en"
          ? "Search is unavailable. Please try again later."
          : "搜索暂时不可用，请稍后重试。";
      delete mount.dataset.ready;
    }
  }
});

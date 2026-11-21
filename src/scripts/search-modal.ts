import { onAstroPage } from "./astro-lifecycle";
import { mountSearchUI } from "../utils/pagefind";
import { bindArticleDialog } from "./article-dialog";

onAstroPage((signal) => {
  const dialog = document.querySelector<HTMLDialogElement>("#search-modal");
  const mount = dialog?.querySelector<HTMLElement>("#modal-pagefind-search");
  if (!dialog || !mount) return;

  const modal = bindArticleDialog(dialog, signal);
  const suggestions = dialog.querySelector("[data-search-suggestions]");
  const getInput = () => dialog.querySelector<HTMLInputElement>(".pagefind-ui__search-input, .search-fallback-input");
  let loading: Promise<void> | null = null;

  const loadSearch = () => {
    loading ??= (async () => {
      try {
        await mountSearchUI({ element: mount, devLimit: 7 }, signal);
        if (!signal.aborted && dialog.open && dialog.dataset.dialogPhase !== "closing") {
          getInput()?.focus({ preventScroll: true });
        }
      } catch {
        if (signal.aborted) return;
        mount.textContent =
          document.documentElement.lang === "en"
            ? "Search is unavailable. Please try the full search page."
            : "搜索暂时不可用，请前往完整搜索页重试。";
        loading = null;
      }
    })();
  };

  const open = (source: HTMLElement) => {
    modal.open(source);
    loadSearch();
    getInput()?.focus({ preventScroll: true });
  };

  document.querySelectorAll<HTMLElement>("[data-search-trigger]").forEach((trigger) => {
    trigger.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        open(trigger);
      },
      { signal },
    );
  });

  dialog.querySelectorAll("[data-search-close]").forEach((button) => {
    button.addEventListener("click", modal.close, { signal });
  });

  dialog.querySelectorAll<HTMLButtonElement>("[data-search-suggestion]").forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const input = getInput();
        if (!input) return;
        input.value = button.dataset.searchSuggestion ?? "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      },
      { signal },
    );
  });

  dialog.addEventListener(
    "input",
    () => {
      suggestions?.classList.toggle("is-hidden", Boolean(getInput()?.value.trim()));
    },
    { signal },
  );

  dialog.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) modal.close();
    },
    { signal },
  );

  dialog.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        modal.close();
        return;
      }
      const links = [...dialog.querySelectorAll<HTMLAnchorElement>(".pagefind-ui__result-link, .search-fallback-link")];
      const index = document.activeElement instanceof HTMLAnchorElement ? links.indexOf(document.activeElement) : -1;
      if (event.key === "ArrowDown" && links.length) {
        event.preventDefault();
        links[Math.min(index + 1, links.length - 1)].focus();
      } else if (event.key === "ArrowUp" && index >= 0) {
        event.preventDefault();
        if (index === 0) getInput()?.focus();
        else links[index - 1].focus();
      }
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      if (dialog.open) modal.close();
      else if (!document.querySelector("dialog[open]")) {
        open(document.activeElement instanceof HTMLElement ? document.activeElement : document.body);
      }
    },
    { signal },
  );
});

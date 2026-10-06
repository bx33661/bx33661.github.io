import { mountDevSearch } from "../utils/devSearch";
import { createPagefindUI } from "../utils/pagefind";
import { bindArticleDialog } from "./article-dialog";

let controller: AbortController | null = null;
function setupSearchModal() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  const dialog = document.querySelector<HTMLDialogElement>("#search-modal");
  const mount = dialog?.querySelector<HTMLElement>("#modal-pagefind-search");
  if (!dialog || !mount) return;
  const modal = bindArticleDialog(dialog, signal);
  const suggestions = dialog.querySelector("[data-search-suggestions]");
  const getInput = () =>
    dialog.querySelector<HTMLInputElement>(
      ".pagefind-ui__search-input, .search-fallback-input",
    );
  let loading: Promise<void> | null = null;
  const loadSearch = () => {
    loading ??= (async () => {
      try {
        if (import.meta.env.DEV)
          await mountDevSearch(mount, { limit: 7, signal });
        else await createPagefindUI({ element: mount }, signal);
        if (
          !signal.aborted &&
          dialog.open &&
          dialog.dataset.dialogPhase !== "closing"
        )
          getInput()?.focus({ preventScroll: true });
      } catch {
        if (signal.aborted) return;
        mount.textContent = "搜索暂时不可用，请前往完整搜索页重试。";
        loading = null; // Retry on the next opening, not a permanently rejected mount.
      }
    })();
  };
  const open = (source: HTMLElement) => {
    modal.open(source);
    loadSearch();
    getInput()?.focus({ preventScroll: true });
  };
  document
    .querySelectorAll<HTMLElement>("[data-search-trigger]")
    .forEach((trigger) => {
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
  dialog
    .querySelectorAll<HTMLButtonElement>("[data-search-suggestion]")
    .forEach((button) => {
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
      suggestions?.classList.toggle(
        "is-hidden",
        Boolean(getInput()?.value.trim()),
      );
    },
    { signal },
  );
  dialog.addEventListener(
    "click",
    (event) => {
      if ((event.target as Element).closest("a[href]")) modal.close();
    },
    { signal },
  );
  dialog.addEventListener(
    "keydown",
    (event) => {
      const links = [
        ...dialog.querySelectorAll<HTMLAnchorElement>(
          ".pagefind-ui__result-link, .search-fallback-link",
        ),
      ];
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
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
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k")
        return;
      event.preventDefault();
      if (dialog.open) modal.close();
      // Do not stack search over an active reading dialog.
      else if (!document.querySelector("dialog[open]"))
        open(
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : document.body,
        );
    },
    { signal },
  );
}

document.addEventListener("astro:page-load", setupSearchModal);
document.addEventListener("astro:before-swap", () => controller?.abort());

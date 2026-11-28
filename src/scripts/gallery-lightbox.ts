import { onAstroPage } from "./astro-lifecycle";
import { bindArticleDialog } from "./article-dialog";

onAstroPage((signal) => {
  const triggers = [...document.querySelectorAll<HTMLButtonElement>("[data-gallery-target]")];
  for (const dialog of document.querySelectorAll<HTMLDialogElement>("dialog[data-gallery-viewer]")) {
    const items = triggers.filter((item) => item.dataset.galleryTarget === dialog.id);
    const image = dialog.querySelector<HTMLImageElement>("[data-gallery-image]");
    const caption = dialog.querySelector("[data-gallery-caption]");
    const counter = dialog.querySelector("[data-gallery-counter]");
    if (!items.length || !image || !caption || !counter) continue;

    const modal = bindArticleDialog(dialog, signal);
    let current = 0;
    const show = (index: number) => {
      current =
        dialog.dataset.galleryViewer === "wrap"
          ? (index + items.length) % items.length
          : Math.max(0, Math.min(index, items.length - 1));
      const source = items[current];
      const thumbnail = source.querySelector("img");
      image.src = source.dataset.src ?? thumbnail?.src ?? "";
      image.alt = source.dataset.alt ?? thumbnail?.alt ?? "";
      caption.textContent = image.alt;
      counter.textContent = `${current + 1} / ${items.length}`;
      if (!dialog.open) modal.open(source);
    };

    items.forEach((item, index) => item.addEventListener("click", () => show(index), { signal }));
    dialog.querySelector('[data-gallery-action="close"]')?.addEventListener("click", modal.close, { signal });
    dialog
      .querySelector('[data-gallery-action="prev"]')
      ?.addEventListener("click", () => show(current - 1), { signal });
    dialog
      .querySelector('[data-gallery-action="next"]')
      ?.addEventListener("click", () => show(current + 1), { signal });
    dialog.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          show(current + (event.key === "ArrowLeft" ? -1 : 1));
        }
      },
      { signal },
    );
  }
});

import { bindArticleDialog } from "./article-dialog";

export function setupArticleLightbox(signal: AbortSignal) {
  const dialog = document.querySelector<HTMLDialogElement>("#article-lightbox");
  const full = dialog?.querySelector<HTMLImageElement>("[data-image-full]");
  if (!dialog || !full) return;
  const modal = bindArticleDialog(dialog, signal);
  dialog
    .querySelector("[data-image-close]")
    ?.addEventListener("click", modal.close, { signal });
  full.addEventListener("click", modal.close, { signal });
  dialog.addEventListener(
    "close",
    () => {
      if (!dialog.open) full.removeAttribute("src");
    },
    { signal },
  );

  for (const image of document.querySelectorAll<HTMLImageElement>(
    "#article img",
  )) {
    // Preserve linked images and MDX islands with their own controls/lightboxes.
    if (image.closest(".not-prose, a, [data-no-zoom]")) continue;
    let trigger = image.closest<HTMLButtonElement>(".article-image-trigger");
    if (!trigger && image.closest("button")) continue;
    const existingCaption = image
      .closest("figure")
      ?.querySelector("figcaption")
      ?.textContent?.trim();
    const label = existingCaption || image.alt.trim();
    if (!trigger) {
      const target =
        image.parentElement?.tagName === "PICTURE"
          ? image.parentElement
          : image;
      const frame = document.createElement("span");
      frame.className = "article-image";
      trigger = document.createElement("button");
      trigger.className = "article-image-trigger";
      trigger.type = "button";
      trigger.setAttribute(
        "aria-label",
        label ? `放大图片：${label}` : "放大正文图片",
      );
      trigger.setAttribute("aria-haspopup", "dialog");
      target.replaceWith(frame);
      frame.appendChild(trigger);
      trigger.appendChild(target);
      if (
        !existingCaption &&
        label &&
        !/^(image|图片|图像)(\s*\d*)?$|\.(png|jpe?g|webp|gif)$/i.test(label)
      ) {
        const note = document.createElement("span");
        note.className = "article-image-caption";
        note.textContent = label;
        frame.appendChild(note);
      }
    }
    const source = trigger;
    source.addEventListener(
      "click",
      () => {
        // Load the published fallback/original only on demand; don't invent asset URLs.
        full.src = image.src;
        full.alt = image.alt;
        modal.open(source);
      },
      { signal },
    );
  }
}

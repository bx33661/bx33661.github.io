import { bindArticleDialog } from "./article-dialog";
import { animateReading } from "./reading-motion";
import { imageOriginTransform, READING_MOTION } from "../utils/reading-motion";

export function setupArticleLightbox(signal: AbortSignal) {
  const dialog = document.querySelector<HTMLDialogElement>("#article-lightbox");
  const full = dialog?.querySelector<HTMLImageElement>("[data-image-full]");
  if (!dialog || !full) return;
  let animation: Animation | null = null;
  let sourceImage: HTMLImageElement | null = null;
  let originalVisibility = "";
  let generation = 0;
  const origin = () => {
    if (!sourceImage?.isConnected) return null;
    const box = sourceImage.getBoundingClientRect();
    if (
      box.bottom <= 0 ||
      box.top >= innerHeight ||
      box.right <= 0 ||
      box.left >= innerWidth
    )
      return null;
    return imageOriginTransform(box, full.getBoundingClientRect());
  };
  const modal = bindArticleDialog(dialog, signal, {
    enter(source) {
      const token = ++generation;
      sourceImage = source.querySelector("img");
      if (sourceImage) {
        originalVisibility = sourceImage.style.visibility;
      }
      // Decode before measuring; an uncached original must not flash at full size.
      full.style.visibility = "hidden";
      void full
        .decode()
        .catch(() => {})
        .then(() => {
          if (
            token !== generation ||
            signal.aborted ||
            dialog.dataset.dialogPhase !== "open"
          )
            return;
          // Keep the thumbnail visible under the scrim while an original loads.
          if (sourceImage) sourceImage.style.visibility = "hidden";
          full.style.visibility = "";
          animation = animateReading(
            full,
            [
              { transform: origin() ?? "scale(0.97)", opacity: 0.92 },
              { transform: "none", opacity: 1 },
            ],
            READING_MOTION.imageIn,
          );
        });
    },
    exit() {
      ++generation;
      const current = getComputedStyle(full);
      const transform = current.transform;
      const opacity = current.opacity;
      animation?.cancel();
      full.style.visibility = "";
      const destination = origin();
      animation = animateReading(
        full,
        [
          { transform, opacity },
          {
            transform: destination ?? "scale(0.97)",
            opacity: destination ? 1 : 0,
          },
        ],
        READING_MOTION.imageOut,
        READING_MOTION.exitEase,
      );
      return animation;
    },
    cleanup() {
      ++generation;
      animation?.cancel();
      animation = null;
      full.style.visibility = "";
      if (sourceImage) sourceImage.style.visibility = originalVisibility;
      sourceImage = null;
    },
  });
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

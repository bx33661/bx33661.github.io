import { bindArticleDialog } from "./article-dialog";
import { animateReading } from "./reading-motion";
import { imageOriginTransform, READING_MOTION } from "../utils/reading-motion";

const GENERIC_ALT_RE = /^(image|图片|图像)(\s*\d*)?$|\.(png|jpe?g|webp|gif)$/i;

type LightboxItem = {
  image: HTMLImageElement;
  trigger: HTMLButtonElement;
  caption: string;
};

export function setupArticleLightbox(signal: AbortSignal) {
  const dialog = document.querySelector<HTMLDialogElement>("#article-lightbox");
  const full = dialog?.querySelector<HTMLImageElement>("[data-image-full]");
  if (!dialog || !full) return;

  const bar = dialog.querySelector<HTMLElement>("[data-image-bar]");
  const prevBtn = dialog.querySelector<HTMLButtonElement>("[data-image-prev]");
  const nextBtn = dialog.querySelector<HTMLButtonElement>("[data-image-next]");
  const counterEl = dialog.querySelector<HTMLElement>("[data-image-counter]");
  const noteEl = dialog.querySelector<HTMLElement>("[data-image-note]");

  const items: LightboxItem[] = [];
  let activeIndex = -1;
  let animation: Animation | null = null;
  let sourceImage: HTMLImageElement | null = null;
  let originalVisibility = "";
  let generation = 0;

  const origin = () => {
    if (!sourceImage?.isConnected) return null;
    const box = sourceImage.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) return null;
    return imageOriginTransform(box, full.getBoundingClientRect());
  };

  const syncBar = () => {
    if (!bar) return;
    const item = items[activeIndex];
    const hasGallery = items.length > 1;
    const caption = item?.caption ?? "";
    if (!item || (!hasGallery && !caption)) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    if (prevBtn) prevBtn.hidden = !hasGallery;
    if (nextBtn) nextBtn.hidden = !hasGallery;
    if (counterEl) {
      counterEl.hidden = !hasGallery;
      counterEl.textContent = hasGallery ? `${activeIndex + 1} / ${items.length}` : "";
    }
    if (noteEl) {
      noteEl.hidden = !caption;
      noteEl.textContent = caption;
    }
  };

  const revealDecoded = (token: number, useOrigin: boolean) => {
    full.style.visibility = "hidden";
    void full
      .decode()
      .catch(() => {})
      .then(() => {
        if (token !== generation || signal.aborted || dialog.dataset.dialogPhase !== "open") return;
        // Keep the thumbnail visible under the scrim while an original loads.
        if (sourceImage) sourceImage.style.visibility = "hidden";
        full.style.visibility = "";
        animation = animateReading(
          full,
          [
            { transform: (useOrigin ? origin() : null) ?? "scale(0.97)", opacity: 0.92 },
            { transform: "none", opacity: 1 },
          ],
          READING_MOTION.imageIn,
        );
      });
  };

  const modal = bindArticleDialog(dialog, signal, {
    enter(source) {
      const token = ++generation;
      activeIndex = items.findIndex((item) => item.trigger === source);
      sourceImage = source.querySelector("img");
      if (sourceImage) {
        originalVisibility = sourceImage.style.visibility;
      }
      syncBar();
      // Decode before measuring; an uncached original must not flash at full size.
      revealDecoded(token, true);
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
      activeIndex = -1;
      if (bar) bar.hidden = true;
    },
  });

  const stepTo = (targetIndex: number) => {
    if (items.length <= 1 || !dialog.open || dialog.dataset.dialogPhase !== "open") return;
    const nextIndex = ((targetIndex % items.length) + items.length) % items.length;
    if (nextIndex === activeIndex) return;

    animation?.cancel();
    animation = null;
    if (sourceImage) {
      sourceImage.style.visibility = originalVisibility;
    }

    activeIndex = nextIndex;
    const targetItem = items[nextIndex];
    sourceImage = targetItem.image;
    originalVisibility = sourceImage.style.visibility;
    full.src = targetItem.image.src;
    full.alt = targetItem.image.alt;
    syncBar();
    revealDecoded(++generation, false);
  };

  dialog.querySelector("[data-image-close]")?.addEventListener("click", modal.close, { signal });
  full.addEventListener("click", modal.close, { signal });
  bar?.addEventListener("click", (event) => event.stopPropagation(), { signal });
  prevBtn?.addEventListener("click", () => stepTo(activeIndex - 1), { signal });
  nextBtn?.addEventListener("click", () => stepTo(activeIndex + 1), { signal });
  dialog.addEventListener(
    "keydown",
    (event) => {
      if (!dialog.open || items.length <= 1) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepTo(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepTo(activeIndex + 1);
      }
    },
    { signal },
  );
  dialog.addEventListener(
    "close",
    () => {
      if (!dialog.open) full.removeAttribute("src");
    },
    { signal },
  );

  for (const image of document.querySelectorAll<HTMLImageElement>("#article img")) {
    // Preserve linked images and MDX islands with their own controls/lightboxes.
    if (image.closest(".not-prose, a, [data-no-zoom]")) continue;
    let trigger = image.closest<HTMLButtonElement>(".article-image-trigger");
    if (!trigger && image.closest("button")) continue;
    const existingCaption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";
    const label = existingCaption || image.alt.trim();
    const cleanCaption = label && !GENERIC_ALT_RE.test(label) ? label : "";
    if (!trigger) {
      const target = image.parentElement?.tagName === "PICTURE" ? image.parentElement : image;
      const frame = document.createElement("span");
      frame.className = "article-image";
      trigger = document.createElement("button");
      trigger.className = "article-image-trigger";
      trigger.type = "button";
      trigger.setAttribute(
        "aria-label",
        document.documentElement.lang === "en"
          ? label
            ? `Enlarge image: ${label}`
            : "Enlarge article image"
          : label
            ? `放大图片：${label}`
            : "放大正文图片",
      );
      trigger.setAttribute("aria-haspopup", "dialog");
      target.replaceWith(frame);
      frame.appendChild(trigger);
      trigger.appendChild(target);
      if (!existingCaption && cleanCaption) {
        const note = document.createElement("span");
        note.className = "article-image-caption";
        note.textContent = cleanCaption;
        frame.appendChild(note);
      }
    }
    const source = trigger;
    items.push({ image, trigger: source, caption: cleanCaption });
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

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
  const zoomBtn = dialog.querySelector<HTMLButtonElement>("[data-image-zoom]");

  const items: LightboxItem[] = [];
  let activeIndex = -1;
  let animation: Animation | null = null;
  let sourceImage: HTMLImageElement | null = null;
  let originalVisibility = "";
  let generation = 0;

  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let baseWidth = 0;
  let baseHeight = 0;
  let activePointerId: number | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let didDrag = false;
  let suppressNextClick = false;

  const syncZoomUI = () => {
    const zoomed = zoomScale > 1.01;
    if (zoomed) {
      dialog.dataset.zoomed = "true";
      full.style.transform = `translate3d(${Math.round(panX)}px, ${Math.round(panY)}px, 0) scale(${zoomScale.toFixed(3)})`;
    } else {
      delete dialog.dataset.zoomed;
      full.style.transform = "";
    }
    if (zoomBtn) {
      const labelIn = zoomBtn.dataset.labelIn || "Zoom in (2×)";
      const labelOut = zoomBtn.dataset.labelOut || "Reset zoom (1×)";
      zoomBtn.textContent = zoomed ? "1×" : "2×";
      zoomBtn.dataset.active = String(zoomed);
      zoomBtn.setAttribute("aria-label", zoomed ? labelOut : labelIn);
      zoomBtn.setAttribute("title", zoomed ? labelOut : labelIn);
    }
  };

  const resetZoom = () => {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    baseWidth = 0;
    baseHeight = 0;
    activePointerId = null;
    didDrag = false;
    suppressNextClick = false;
    delete dialog.dataset.dragging;
    syncZoomUI();
  };

  const clampPan = (nextX: number, nextY: number, scale: number) => {
    const w = baseWidth || full.offsetWidth || innerWidth * 0.8;
    const h = baseHeight || full.offsetHeight || innerHeight * 0.8;
    const maxX = Math.max(0, (w * scale - innerWidth + 48) / 2);
    const maxY = Math.max(0, (h * scale - innerHeight + 48) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  };

  const applyZoom = (targetScale: number, focalX = innerWidth / 2, focalY = innerHeight / 2) => {
    if (!dialog.open || dialog.dataset.dialogPhase !== "open") return;
    animation?.cancel();
    animation = null;
    if (!baseWidth || !baseHeight) {
      baseWidth = full.offsetWidth;
      baseHeight = full.offsetHeight;
    }
    const clamped = Math.max(1, Math.min(3.2, targetScale));
    if (clamped <= 1.03) {
      resetZoom();
      return;
    }
    const ratio = clamped / zoomScale;
    const cx = innerWidth / 2;
    const cy = innerHeight / 2;
    const rawX = (focalX - cx) * (1 - ratio) + panX * ratio;
    const rawY = (focalY - cy) * (1 - ratio) + panY * ratio;
    const next = clampPan(rawX, rawY, clamped);
    zoomScale = clamped;
    panX = next.x;
    panY = next.y;
    syncZoomUI();
  };

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
    if (!item) {
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
      resetZoom();
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
      resetZoom();
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
      resetZoom();
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
    resetZoom();
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
  full.addEventListener(
    "click",
    (event) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        event.stopPropagation();
        return;
      }
      if (zoomScale > 1.01) {
        event.stopPropagation();
        resetZoom();
        return;
      }
      modal.close();
    },
    { signal },
  );
  full.addEventListener(
    "pointerdown",
    (event) => {
      if (zoomScale <= 1.01 || event.button !== 0) return;
      event.preventDefault();
      activePointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOriginX = panX;
      dragOriginY = panY;
      didDrag = false;
      dialog.dataset.dragging = "true";
      try {
        full.setPointerCapture(event.pointerId);
      } catch {
        /* Synthetic events may omit pointer capture support. */
      }
    },
    { signal },
  );
  full.addEventListener(
    "pointermove",
    (event) => {
      if (activePointerId !== event.pointerId || zoomScale <= 1.01) return;
      const dx = event.clientX - dragStartX;
      const dy = event.clientY - dragStartY;
      if (!didDrag && Math.hypot(dx, dy) > 4) didDrag = true;
      if (!didDrag) return;
      const clamped = clampPan(dragOriginX + dx, dragOriginY + dy, zoomScale);
      panX = clamped.x;
      panY = clamped.y;
      syncZoomUI();
    },
    { signal },
  );
  const finishPointerDrag = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;
    if (didDrag) suppressNextClick = true;
    activePointerId = null;
    didDrag = false;
    delete dialog.dataset.dragging;
  };
  full.addEventListener("pointerup", finishPointerDrag, { signal });
  full.addEventListener("pointercancel", finishPointerDrag, { signal });

  dialog.addEventListener(
    "wheel",
    (event) => {
      if (!dialog.open || dialog.dataset.dialogPhase !== "open") return;
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
      applyZoom(zoomScale * factor, event.clientX, event.clientY);
    },
    { passive: false, signal },
  );

  bar?.addEventListener("click", (event) => event.stopPropagation(), { signal });
  zoomBtn?.addEventListener(
    "click",
    () => {
      applyZoom(zoomScale > 1.01 ? 1 : 2.25);
    },
    { signal },
  );
  prevBtn?.addEventListener("click", () => stepTo(activeIndex - 1), { signal });
  nextBtn?.addEventListener("click", () => stepTo(activeIndex + 1), { signal });
  dialog.addEventListener(
    "keydown",
    (event) => {
      if (!dialog.open) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        applyZoom(zoomScale * 1.35);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        applyZoom(zoomScale / 1.35);
      } else if (event.key === "0" && zoomScale > 1.01) {
        event.preventDefault();
        resetZoom();
      } else if (items.length > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        stepTo(activeIndex - 1);
      } else if (items.length > 1 && event.key === "ArrowRight") {
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

      const attrW = Number(image.getAttribute("width")) || image.naturalWidth || 0;
      const attrH = Number(image.getAttribute("height")) || image.naturalHeight || 0;
      const isWideCandidate = attrW >= 880 && attrH > 0 && attrW / attrH >= 1.22;
      const blockParent = frame.parentElement;
      const isStandaloneBlock =
        Boolean(blockParent) &&
        (blockParent!.tagName === "P" || blockParent!.tagName === "FIGURE") &&
        blockParent!.parentElement?.id === "article" &&
        [...blockParent!.childNodes].every(
          (node) =>
            node === frame ||
            (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "FIGCAPTION") ||
            (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()),
        );

      if (isWideCandidate && isStandaloneBlock && blockParent) {
        blockParent.classList.add("article-figure-wide");
        const barEl = document.createElement("span");
        barEl.className = "article-figure-bar";
        if (!existingCaption && cleanCaption) {
          const note = document.createElement("span");
          note.className = "article-image-caption";
          note.textContent = cleanCaption;
          barEl.appendChild(note);
        } else {
          const spacer = document.createElement("span");
          barEl.appendChild(spacer);
        }
        const badge = document.createElement("span");
        badge.className = "article-figure-badge";
        badge.setAttribute("aria-hidden", "true");
        badge.textContent =
          document.documentElement.lang === "en" ? "↔ Wide view · Click to zoom" : "↔ 宽幅视图 · 点击 2× 放大";
        badge.addEventListener("click", () => trigger?.click(), { signal });
        barEl.appendChild(badge);
        frame.appendChild(barEl);
      } else if (!existingCaption && cleanCaption) {
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

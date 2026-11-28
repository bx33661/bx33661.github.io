import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { ArtworkCard } from "./artwork-card";
import { NavigationDots } from "./navigation-dots";
import { useSliderNavigation } from "@/hooks/use-slider-navigation";
import { useSliderDrag } from "@/hooks/use-slider-drag";
import { useSliderWheel } from "@/hooks/use-slider-wheel";
import { useColorExtraction, useCurrentColors } from "@/hooks/use-color-extraction";
import { DEFAULT_COLORS } from "@/lib/constants";
import type { Artwork } from "@/types/artwork";

interface GalleryImage {
  src: string;
  full?: string;
  srcSet?: string;
  sizes?: string;
  thumb?: string;
  alt: string;
  title: string;
  date: string;
  width?: number;
  height?: number;
}

interface ArtGallerySliderProps {
  images: GalleryImage[];
  locale?: "en" | "zh-CN";
}

const SLIDER_COPY = {
  en: {
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
    viewFullImage: "View full image",
    viewFullImageLabel: (title: string) => `View full image: ${title}`,
    switchHint: "Navigate",
    jumpToPhoto: (n: number) => `Jump to photo ${n}`,
    photoFallback: "photo",
    empty: "No gallery showcase photos yet. Add photos under src/data/galleries/ and run npm run gallery:optimize.",
  },
  "zh-CN": {
    prevPhoto: "上一张照片",
    nextPhoto: "下一张照片",
    viewFullImage: "查看原图",
    viewFullImageLabel: (title: string) => `查看原图：${title}`,
    switchHint: "切换照片",
    jumpToPhoto: (n: number) => `跳转到第 ${n} 张照片`,
    photoFallback: "照片",
    empty: "还没有配置展示照片。将图片放入 src/data/galleries/ 后运行 npm run gallery:optimize。",
  },
} as const;

export default function ArtGallerySlider({ images, locale = "en" }: ArtGallerySliderProps) {
  const labels = locale === "zh-CN" ? SLIDER_COPY["zh-CN"] : SLIDER_COPY.en;
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const currentIndexRef = useRef(0);
  const [step, setStep] = useState(564);

  const artworks: Artwork[] = useMemo(
    () =>
      images.map((img, index) => ({
        id: index + 1,
        title: img.title,
        alt: img.alt,
        year: new Date(img.date).getFullYear(),
        image: img.src,
        srcSet: img.srcSet,
        sizes: img.sizes,
        thumb: img.thumb,
        width: img.width,
        height: img.height,
      })),
    [images],
  );

  const { currentIndex, goToNext, goToPrev, goToSlide } = useSliderNavigation({
    totalSlides: artworks.length,
    enableKeyboard: true,
  });

  currentIndexRef.current = currentIndex;

  /** Measure card width + gap from the live track (handles all breakpoints). */
  const measureStep = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild;
    if (!track || !(first instanceof HTMLElement)) return;
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const next = first.offsetWidth + gap;
    if (next > 0) setStep(next);
  }, []);

  // Imperative track transform — drag never goes through React state.
  const applyTrackTransform = useCallback(
    (index: number, dragX: number, instant = false) => {
      const track = trackRef.current;
      if (!track) return;
      const x = -index * step + dragX;
      track.style.transition = instant ? "none" : "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)";
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    },
    [step],
  );

  const handleDragOffset = useCallback(
    (offsetX: number) => {
      applyTrackTransform(currentIndexRef.current, offsetX, true);
    },
    [applyTrackTransform],
  );

  const { isDragging, handleDragStart, handleDragMove, handleDragEnd } = useSliderDrag({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    onDragOffsetChange: handleDragOffset,
  });

  useSliderWheel({
    sliderRef,
    onScrollLeft: goToNext,
    onScrollRight: goToPrev,
  });

  // Native non-passive touch listeners — React's synthetic touchmove is passive
  // at the root, so preventDefault would be ignored and the page would scroll.
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => handleDragStart(e);
    const onMove = (e: TouchEvent) => handleDragMove(e);
    const onEnd = () => handleDragEnd();

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  const colors = useColorExtraction(artworks, currentIndex);
  const currentColors = useCurrentColors(colors, artworks[currentIndex]?.id);

  useEffect(() => {
    measureStep();
    applyTrackTransform(currentIndexRef.current, 0, true);
  }, [measureStep, applyTrackTransform, artworks.length]);

  useEffect(() => {
    window.addEventListener("resize", measureStep, { passive: true });
    return () => window.removeEventListener("resize", measureStep);
  }, [measureStep]);

  // Snap when the active slide changes or drag ends.
  useEffect(() => {
    if (isDragging) return;
    applyTrackTransform(currentIndex, 0, false);
  }, [currentIndex, isDragging, applyTrackTransform]);

  // Ambient colors via CSS variables — no AnimatePresence remount.
  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    bg.style.setProperty("--c0", currentColors[0] ?? DEFAULT_COLORS[0]);
    bg.style.setProperty("--c1", currentColors[1] ?? DEFAULT_COLORS[1]);
    bg.style.setProperty("--c2", currentColors[2] ?? DEFAULT_COLORS[2]);
  }, [currentColors]);

  if (artworks.length === 0) {
    return (
      <div className="gallery-container">
        <div ref={bgRef} className="gallery-background" aria-hidden="true" />
        <div className="gallery-blur-overlay" aria-hidden="true" />
        <div
          role="status"
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "32rem",
            marginInline: "auto",
            padding: "1.5rem",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          {labels.empty}
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div ref={bgRef} className="gallery-background" aria-hidden="true" />
      <div className="gallery-blur-overlay" aria-hidden="true" />

      <div className="gallery-counter" aria-live="polite">
        <span className="gallery-counter-current">{String(currentIndex + 1).padStart(2, "0")}</span>
        <span className="gallery-counter-separator">/</span>
        <span className="gallery-counter-total">{String(artworks.length).padStart(2, "0")}</span>
      </div>

      <div
        ref={sliderRef}
        className={["gallery-slider", isDragging && "is-dragging"].filter(Boolean).join(" ")}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div ref={trackRef} className="gallery-slider-track">
          {artworks.map((artwork, index) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              isActive={index === currentIndex}
              index={index}
              currentIndex={currentIndex}
            />
          ))}
        </div>
      </div>

      <button
        className="gallery-nav-arrow gallery-nav-prev"
        type="button"
        onClick={goToPrev}
        disabled={currentIndex === 0}
        aria-label={labels.prevPhoto}
      >
        ‹
      </button>
      <button
        className="gallery-nav-arrow gallery-nav-next"
        type="button"
        onClick={goToNext}
        disabled={currentIndex === artworks.length - 1}
        aria-label={labels.nextPhoto}
      >
        ›
      </button>

      <NavigationDots
        total={artworks.length}
        current={currentIndex}
        onSelect={goToSlide}
        accent={currentColors[0]}
        getDotAriaLabel={(index) => labels.jumpToPhoto(index + 1)}
      />

      <a
        className="gallery-open-image"
        href={images[currentIndex]?.full || images[currentIndex]?.src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={labels.viewFullImageLabel(images[currentIndex]?.title || labels.photoFallback)}
      >
        {labels.viewFullImage} <span aria-hidden="true">↗</span>
      </a>

      <div className="gallery-keyboard-hint">
        <kbd className="gallery-kbd">←</kbd>
        <kbd className="gallery-kbd">→</kbd>
        <span className="gallery-kbd-label">{labels.switchHint}</span>
      </div>
    </div>
  );
}

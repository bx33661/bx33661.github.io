import {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react"
import { ArtworkCard } from "./artwork-card"
import { NavigationDots } from "./navigation-dots"
import { useSliderNavigation } from "@/hooks/use-slider-navigation"
import { useSliderDrag } from "@/hooks/use-slider-drag"
import { useSliderWheel } from "@/hooks/use-slider-wheel"
import {
  useColorExtraction,
  useCurrentColors,
} from "@/hooks/use-color-extraction"
import type { Artwork } from "@/types/artwork"

interface GalleryImage {
  src: string
  srcSet?: string
  sizes?: string
  thumb?: string
  alt: string
  title: string
  date: string
  width?: number
  height?: number
}

interface ArtGallerySliderProps {
  images: GalleryImage[]
}

export default function ArtGallerySlider({ images }: ArtGallerySliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const currentIndexRef = useRef(0)
  const [step, setStep] = useState(564)

  const artworks: Artwork[] = useMemo(
    () =>
      images.map((img, index) => ({
        id: index + 1,
        title: img.title,
        artist: new Date(img.date).getFullYear().toString(),
        year: new Date(img.date).getFullYear(),
        image: img.src,
        srcSet: img.srcSet,
        sizes: img.sizes,
        thumb: img.thumb,
        width: img.width,
        height: img.height,
      })),
    [images],
  )

  const { currentIndex, goToNext, goToPrev, goToSlide } = useSliderNavigation({
    totalSlides: artworks.length,
    enableKeyboard: true,
  })

  currentIndexRef.current = currentIndex

  /** Measure card width + gap from the live track (handles all breakpoints). */
  const measureStep = useCallback(() => {
    const track = trackRef.current
    if (!track || track.children.length < 1) return
    const first = track.children[0] as HTMLElement
    const styles = getComputedStyle(track)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0
    const next = first.offsetWidth + gap
    if (next > 0) setStep(next)
  }, [])

  // Imperative track transform — drag never goes through React state.
  const applyTrackTransform = useCallback(
    (index: number, dragX: number, instant = false) => {
      const track = trackRef.current
      if (!track) return
      const x = -index * step + dragX
      track.style.transition = instant
        ? "none"
        : "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)"
      track.style.transform = `translate3d(${x}px, 0, 0)`
    },
    [step],
  )

  const handleDragOffset = useCallback(
    (offsetX: number) => {
      applyTrackTransform(currentIndexRef.current, offsetX, true)
    },
    [applyTrackTransform],
  )

  const { isDragging, handleDragStart, handleDragMove, handleDragEnd } =
    useSliderDrag({
      onSwipeLeft: goToNext,
      onSwipeRight: goToPrev,
      onDragOffsetChange: handleDragOffset,
    })

  useSliderWheel({
    sliderRef,
    onScrollLeft: goToNext,
    onScrollRight: goToPrev,
  })

  // Native non-passive touch listeners — React's synthetic touchmove is passive
  // at the root, so preventDefault would be ignored and the page would scroll.
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => handleDragStart(e)
    const onMove = (e: TouchEvent) => handleDragMove(e)
    const onEnd = () => handleDragEnd()

    el.addEventListener("touchstart", onStart, { passive: true })
    el.addEventListener("touchmove", onMove, { passive: false })
    el.addEventListener("touchend", onEnd)
    el.addEventListener("touchcancel", onEnd)

    return () => {
      el.removeEventListener("touchstart", onStart)
      el.removeEventListener("touchmove", onMove)
      el.removeEventListener("touchend", onEnd)
      el.removeEventListener("touchcancel", onEnd)
    }
  }, [handleDragStart, handleDragMove, handleDragEnd])

  const colors = useColorExtraction(artworks, currentIndex)
  const currentColors = useCurrentColors(colors, artworks[currentIndex]?.id)

  useLayoutEffect(() => {
    measureStep()
    applyTrackTransform(currentIndexRef.current, 0, true)
  }, [measureStep, applyTrackTransform, artworks.length])

  useEffect(() => {
    window.addEventListener("resize", measureStep, { passive: true })
    return () => window.removeEventListener("resize", measureStep)
  }, [measureStep])

  // Snap when the active slide changes or drag ends.
  useEffect(() => {
    if (isDragging) return
    applyTrackTransform(currentIndex, 0, false)
  }, [currentIndex, isDragging, applyTrackTransform])

  // Ambient colors via CSS variables — no AnimatePresence remount.
  useEffect(() => {
    const bg = bgRef.current
    if (!bg) return
    bg.style.setProperty("--c0", currentColors[0] || "#1a1a2e")
    bg.style.setProperty("--c1", currentColors[1] || "#16213e")
    bg.style.setProperty("--c2", currentColors[2] || "#0f3460")
  }, [currentColors])

  return (
    <div className="gallery-container">
      <div ref={bgRef} className="gallery-background" aria-hidden="true" />
      <div className="gallery-blur-overlay" aria-hidden="true" />

      <div className="gallery-counter">
        <span className="gallery-counter-current">
          {String(currentIndex + 1).padStart(2, "0")}
        </span>
        <span className="gallery-counter-separator">/</span>
        <span className="gallery-counter-total">
          {String(artworks.length).padStart(2, "0")}
        </span>
      </div>

      <div
        ref={sliderRef}
        className={`gallery-slider${isDragging ? " is-dragging" : ""}`}
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

      <NavigationDots
        total={artworks.length}
        current={currentIndex}
        onSelect={goToSlide}
        accent={currentColors[0]}
      />

      <div className="gallery-keyboard-hint">
        <kbd className="gallery-kbd">←</kbd>
        <kbd className="gallery-kbd">→</kbd>
        <span className="gallery-kbd-label">navigate</span>
      </div>
    </div>
  )
}

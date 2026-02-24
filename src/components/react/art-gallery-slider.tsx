import { useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArtworkCard } from "./artwork-card"
import { NavigationDots } from "./navigation-dots"
import { useSliderNavigation } from "@/hooks/use-slider-navigation"
import { useSliderDrag } from "@/hooks/use-slider-drag"
import { useSliderWheel } from "@/hooks/use-slider-wheel"
import { useColorExtraction, useCurrentColors } from "@/hooks/use-color-extraction"
import type { Artwork } from "@/types/artwork"

interface GalleryImage {
  src: string
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

  // Transform gallery images to artwork format
  const artworks: Artwork[] = useMemo(() => 
    images.map((img, index) => ({
      id: index + 1,
      title: img.title,
      artist: new Date(img.date).getFullYear().toString(),
      year: new Date(img.date).getFullYear(),
      image: img.src,
    })),
    [images]
  )

  const { currentIndex, goToNext, goToPrev, goToSlide } = useSliderNavigation({
    totalSlides: artworks.length,
    enableKeyboard: true,
  })

  const { isDragging, dragX, handleDragStart, handleDragMove, handleDragEnd } = useSliderDrag({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
  })

  useSliderWheel({
    sliderRef,
    onScrollLeft: goToNext,
    onScrollRight: goToPrev,
  })

  const colors = useColorExtraction(artworks)
  const currentColors = useCurrentColors(colors, artworks[currentIndex]?.id)

  return (
    <div className="gallery-container">
      {/* Animated ambient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="gallery-background"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, ${currentColors[0]}66 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, ${currentColors[1]}66 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, ${currentColors[2]}44 0%, transparent 70%),
              linear-gradient(180deg, #0a0a0a 0%, #111111 100%)
            `,
          }}
        />
      </AnimatePresence>

      {/* Blur overlay */}
      <div className="gallery-blur-overlay" />

      {/* Counter - moved to top right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="gallery-counter"
      >
        <span className="gallery-counter-current">{String(currentIndex + 1).padStart(2, "0")}</span>
        <span className="gallery-counter-separator">/</span>
        <span className="gallery-counter-total">{String(artworks.length).padStart(2, "0")}</span>
      </motion.div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className={`gallery-slider ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <motion.div
          className="gallery-slider-track"
          animate={{
            x: typeof window !== 'undefined' ? -currentIndex * (window.innerWidth > 768 ? 564 : 432) + dragX : 0,
          }}
          transition={isDragging ? { duration: 0 } : { duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          {artworks.map((artwork, index) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              isActive={index === currentIndex}
              dragOffset={dragX}
              index={index}
              currentIndex={currentIndex}
            />
          ))}
        </motion.div>
      </div>

      {/* Navigation dots */}
      <NavigationDots total={artworks.length} current={currentIndex} onSelect={goToSlide} colors={currentColors} />

      {/* Keyboard hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="gallery-keyboard-hint"
      >
        <kbd className="gallery-kbd">←</kbd>
        <kbd className="gallery-kbd">→</kbd>
        <span className="gallery-kbd-label">navigate</span>
      </motion.div>
    </div>
  )
}

import { useState, useEffect, useRef } from "react"
import { extractColors } from "@/lib/color-extractor"
import { DEFAULT_COLORS } from "@/lib/constants"
import type { Artwork } from "@/types/artwork"

/**
 * Extract palette only for the active slide (+ neighbors as they settle).
 * Never re-run because of `colors` itself — that used to thrash setState loops.
 */
export function useColorExtraction(
  artworks: Artwork[],
  currentIndex: number,
): Record<number, string[]> {
  const [colors, setColors] = useState<Record<number, string[]>>({})
  const inFlight = useRef(new Set<number>())
  const cachedIds = useRef(new Set<number>())

  useEffect(() => {
    if (artworks.length === 0) return

    // Active first; neighbors after a tick so swipe stays snappy.
    const primary = artworks[currentIndex]
    const neighbors = [
      artworks[currentIndex - 1],
      artworks[currentIndex + 1],
    ].filter(Boolean) as Artwork[]

    const extractOne = (artwork: Artwork) => {
      if (cachedIds.current.has(artwork.id) || inFlight.current.has(artwork.id)) {
        return
      }
      inFlight.current.add(artwork.id)
      const source = artwork.thumb || artwork.image

      extractColors(source)
        .then((extractedColors) => {
          cachedIds.current.add(artwork.id)
          setColors((prev) =>
            prev[artwork.id] ? prev : { ...prev, [artwork.id]: extractedColors },
          )
        })
        .finally(() => {
          inFlight.current.delete(artwork.id)
        })
    }

    if (primary) extractOne(primary)

    const timer = window.setTimeout(() => {
      for (const artwork of neighbors) extractOne(artwork)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [artworks, currentIndex])

  return colors
}

export function useCurrentColors(
  colors: Record<number, string[]>,
  artworkId: number | undefined,
): string[] {
  return colors[artworkId ?? -1] ?? [...DEFAULT_COLORS]
}

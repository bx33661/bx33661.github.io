import { useState, useEffect, useRef } from "react"
import { extractColors } from "@/lib/color-extractor"
import { DEFAULT_COLORS } from "@/lib/constants"
import type { Artwork } from "@/types/artwork"

/**
 * Extract palettes only for the active slide and its neighbors.
 * Previous version decoded EVERY gallery image on mount via full-size URLs.
 */
export function useColorExtraction(
  artworks: Artwork[],
  currentIndex: number,
): Record<number, string[]> {
  const [colors, setColors] = useState<Record<number, string[]>>({})
  const inFlight = useRef(new Set<number>())

  useEffect(() => {
    if (artworks.length === 0) return

    const targets = new Set<number>([
      currentIndex,
      Math.max(0, currentIndex - 1),
      Math.min(artworks.length - 1, currentIndex + 1),
    ])

    for (const index of targets) {
      const artwork = artworks[index]
      if (!artwork) continue
      if (colors[artwork.id] || inFlight.current.has(artwork.id)) continue

      inFlight.current.add(artwork.id)
      const source = artwork.thumb || artwork.image

      extractColors(source)
        .then((extractedColors) => {
          setColors((prev) =>
            prev[artwork.id] ? prev : { ...prev, [artwork.id]: extractedColors },
          )
        })
        .finally(() => {
          inFlight.current.delete(artwork.id)
        })
    }
  }, [artworks, currentIndex, colors])

  return colors
}

export function useCurrentColors(
  colors: Record<number, string[]>,
  artworkId: number | undefined,
): string[] {
  return colors[artworkId ?? -1] || [...DEFAULT_COLORS]
}

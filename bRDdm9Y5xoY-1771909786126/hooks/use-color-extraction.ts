"use client"

import { useState, useEffect } from "react"
import { extractColors } from "@/lib/color-extractor"
import { DEFAULT_COLORS } from "@/lib/constants"
import type { Artwork } from "@/types/artwork"

export function useColorExtraction(artworks: Artwork[]): Record<number, string[]> {
  const [colors, setColors] = useState<Record<number, string[]>>({})

  useEffect(() => {
    artworks.forEach((artwork) => {
      extractColors(artwork.image).then((extractedColors) => {
        setColors((prev) => ({ ...prev, [artwork.id]: extractedColors }))
      })
    })
  }, [artworks])

  return colors
}

export function useCurrentColors(colors: Record<number, string[]>, artworkId: number | undefined): string[] {
  return colors[artworkId ?? -1] || [...DEFAULT_COLORS]
}

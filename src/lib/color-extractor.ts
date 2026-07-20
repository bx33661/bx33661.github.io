const colorCache = new Map<string, string[]>()
const DEFAULT_PALETTE = ["#1a1a2e", "#16213e", "#0f3460"]

/**
 * Extract a 3-color palette from an image URL.
 * Always sample from a tiny decode target — callers should pass a small thumb
 * (e.g. w640). Results are memoized per URL for the page lifetime.
 */
export async function extractColors(imageUrl: string): Promise<string[]> {
  const cached = colorCache.get(imageUrl)
  if (cached) return cached

  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = "async"
    // Same-origin gallery assets; avoid CORS taint without needing credentials.
    img.crossOrigin = "anonymous"

    const finish = (colors: string[]) => {
      colorCache.set(imageUrl, colors)
      resolve(colors)
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      if (!ctx) {
        finish([...DEFAULT_PALETTE])
        return
      }

      // Sample at a smaller size for performance
      const sampleSize = 32
      canvas.width = sampleSize
      canvas.height = sampleSize

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

      try {
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
        const pixels = imageData.data

        // Collect colors with their frequency
        const colorMap = new Map<
          string,
          { count: number; r: number; g: number; b: number }
        >()

        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.min(255, Math.round(pixels[i] / 32) * 32)
          const g = Math.min(255, Math.round(pixels[i + 1] / 32) * 32)
          const b = Math.min(255, Math.round(pixels[i + 2] / 32) * 32)

          const brightness = (r + g + b) / 3
          if (brightness < 20 || brightness > 240) continue

          const key = `${r},${g},${b}`
          const existing = colorMap.get(key)

          if (existing) {
            existing.count++
          } else {
            colorMap.set(key, { count: 1, r, g, b })
          }
        }

        // Sort by frequency and get top colors
        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Get distinct colors
        const distinctColors: string[] = []
        for (const color of sortedColors) {
          const hex = rgbToHex(color.r, color.g, color.b)

          const isDistinct = distinctColors.every((existing) => {
            const existingRgb = hexToRgb(existing)
            if (!existingRgb) return true
            const distance = Math.sqrt(
              Math.pow(color.r - existingRgb.r, 2) +
                Math.pow(color.g - existingRgb.g, 2) +
                Math.pow(color.b - existingRgb.b, 2),
            )
            return distance > 40
          })

          if (isDistinct && distinctColors.length < 3) {
            distinctColors.push(hex)
          }
        }

        if (distinctColors.length === 0 && sortedColors.length > 0) {
          const topColor = sortedColors[0]
          distinctColors.push(
            rgbToHex(
              Math.max(0, topColor.r - 60),
              Math.max(0, topColor.g - 60),
              Math.max(0, topColor.b - 60),
            ),
          )
        }

        while (distinctColors.length < 3) {
          const baseColor = hexToRgb(distinctColors[0] || "#1a1a2e")
          if (baseColor) {
            const shift = distinctColors.length === 1 ? -40 : 40
            distinctColors.push(
              rgbToHex(
                Math.min(255, Math.max(0, baseColor.r + shift)),
                Math.min(255, Math.max(0, baseColor.g + shift)),
                Math.min(255, Math.max(0, baseColor.b + shift)),
              ),
            )
          } else {
            distinctColors.push("#1a1a2e")
          }
        }

        finish(distinctColors)
      } catch {
        finish([...DEFAULT_PALETTE])
      }
    }

    img.onerror = () => {
      finish([...DEFAULT_PALETTE])
    }

    img.src = imageUrl
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

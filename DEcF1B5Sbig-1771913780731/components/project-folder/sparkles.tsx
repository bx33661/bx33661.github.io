"use client"

interface SparklesProps {
  count?: number
  fading?: boolean
  variant?: "generating" | "live"
}

const GENERATING_POSITIONS = [
  { x: 15, y: 20 },
  { x: 85, y: 25 },
  { x: 30, y: 70 },
  { x: 70, y: 75 },
  { x: 50, y: 40 },
  { x: 25, y: 45 },
  { x: 75, y: 50 },
  { x: 45, y: 80 },
  { x: 10, y: 55 },
  { x: 90, y: 60 },
  { x: 60, y: 20 },
  { x: 40, y: 30 },
  { x: 20, y: 85 },
  { x: 80, y: 15 },
  { x: 55, y: 65 },
  { x: 35, y: 55 },
]

const LIVE_POSITIONS = [
  { x: 10, y: 30 },
  { x: 90, y: 25 },
  { x: 25, y: 70 },
  { x: 85, y: 65 },
  { x: 50, y: 40 },
  { x: 25, y: 45 },
  { x: 75, y: 50 },
  { x: 45, y: 80 },
  { x: 10, y: 55 },
  { x: 90, y: 60 },
  { x: 60, y: 20 },
  { x: 40, y: 30 },
  { x: 20, y: 85 },
  { x: 80, y: 15 },
  { x: 55, y: 65 },
  { x: 35, y: 55 },
]

export function Sparkles({ count = 16, fading = false, variant = "generating" }: SparklesProps) {
  const positions = variant === "live" ? LIVE_POSITIONS : GENERATING_POSITIONS

  return (
    <div className="absolute inset-0 transition-opacity duration-400" style={{ opacity: fading ? 0 : 1 }}>
      {variant === "generating" && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 70%)" }}
        />
      )}
      {[...Array(count)].map((_, idx) => {
        const pos = positions[idx % positions.length]
        const size = variant === "generating" ? 4 + (idx % 4) * 2 : 5 + (idx % 3) * 2
        const opacity = variant === "generating" ? 0.15 + (idx % 4) * 0.1 : 0.25 + (idx % 3) * 0.15
        return (
          <div
            key={idx}
            className="absolute animate-float-sparkle"
            style={{
              left: pos.x + "%",
              top: pos.y + "%",
              transform: "translate(-50%, -50%)",
              animationDelay: idx * (variant === "generating" ? 0.15 : 0.2) + "s",
              animationDuration:
                (variant === "generating" ? 2 : 1.8) + (idx % 3) * (variant === "generating" ? 0.5 : 0.4) + "s",
            }}
          >
            <svg
              style={{ width: size, height: size, opacity }}
              className="text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}

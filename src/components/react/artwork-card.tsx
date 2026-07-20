import { memo } from "react"
import type { Artwork } from "@/types/artwork"

interface ArtworkCardProps {
  artwork: Artwork
  isActive: boolean
  index: number
  currentIndex: number
}

/**
 * Plain DOM card — no per-frame framer-motion, no 3D rotateY, no glass blur.
 * Only active ±2 mounts a real <img>; farther slots stay empty shells.
 */
function ArtworkCardComponent({
  artwork,
  isActive,
  index,
  currentIndex,
}: ArtworkCardProps) {
  const distance = index - currentIndex
  const absDistance = Math.abs(distance)
  const shouldLoad = absDistance <= 2
  const isNear = absDistance <= 1

  return (
    <div
      className={`artwork-card-wrapper${isActive ? " is-active" : ""}${isNear ? " is-near" : ""}`}
      data-distance={distance}
      style={{
        // Scale/opacity via CSS vars keeps transitions off the JS thread.
        ["--card-scale" as string]: isActive ? 1 : absDistance === 1 ? 0.9 : 0.82,
        ["--card-opacity" as string]: isActive ? 1 : absDistance === 1 ? 0.72 : 0.4,
      }}
    >
      <div className="artwork-card">
        <div className="artwork-card-image-container">
          {shouldLoad ? (
            <img
              src={artwork.image}
              srcSet={artwork.srcSet}
              sizes={artwork.sizes || "(max-width: 768px) 350px, 500px"}
              alt={artwork.title}
              width={artwork.width}
              height={artwork.height}
              className="artwork-card-image"
              loading={isActive ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={isActive ? "high" : "low"}
              draggable={false}
            />
          ) : (
            <div
              className="artwork-card-image artwork-card-image--placeholder"
              aria-hidden="true"
            />
          )}

          <div className="artwork-card-gradient" aria-hidden="true" />

          <div className="artwork-card-info">
            <p className="artwork-card-year">{artwork.year}</p>
            <h2 className="artwork-card-title">{artwork.title}</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ArtworkCard = memo(ArtworkCardComponent)

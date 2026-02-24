import { motion } from "framer-motion"
import { useState } from "react"
import type { Artwork } from "@/types/artwork"

interface ArtworkCardProps {
  artwork: Artwork
  isActive: boolean
  dragOffset: number
  index: number
  currentIndex: number
}

export function ArtworkCard({ artwork, isActive, dragOffset, index, currentIndex }: ArtworkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const distance = index - currentIndex
  const parallaxOffset = dragOffset * (0.1 * (distance + 1))

  return (
    <motion.div
      className="artwork-card-wrapper"
      animate={{
        scale: isActive ? 1 : 0.85,
        opacity: isActive ? 1 : 0.5,
        rotateY: distance * 5,
      }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      style={{
        x: parallaxOffset,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="artwork-card"
        animate={{
          y: isHovered && isActive ? -10 : 0,
          boxShadow: isHovered && isActive ? "0 40px 80px -20px rgba(0,0,0,0.8)" : "0 20px 40px -10px rgba(0,0,0,0.5)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Glassmorphism frame */}
        <div className="artwork-card-glass" />

        {/* Image container */}
        <div className="artwork-card-image-container">
          <motion.img
            src={artwork.image}
            alt={artwork.title}
            className="artwork-card-image"
            animate={{
              scale: isHovered && isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Gradient overlay for text */}
          <motion.div
            className="artwork-card-gradient"
            initial={{ opacity: 0, height: "30%" }}
            animate={{
              opacity: isActive ? 1 : 0,
              height: isHovered ? "50%" : "30%",
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Artwork info */}
          <motion.div
            className="artwork-card-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isActive ? 1 : 0,
              y: isActive ? 0 : 20,
            }}
            transition={{ duration: 0.4, delay: isActive ? 0.1 : 0 }}
          >
            <motion.p
              className="artwork-card-year"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {artwork.year}
            </motion.p>
            <motion.h2
              className="artwork-card-title"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {artwork.title}
            </motion.h2>
            <motion.p
              className="artwork-card-artist"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 10,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              by {artwork.artist}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Reflection effect */}
      <motion.div
        className="artwork-card-reflection"
        style={{
          background: `linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)`,
          transform: "scaleY(-1)",
        }}
        animate={{ opacity: isActive ? 0.15 : 0.05 }}
      />
    </motion.div>
  )
}

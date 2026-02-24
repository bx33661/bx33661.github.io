"use client"

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
      className="relative flex-shrink-0"
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
        className="group relative overflow-hidden rounded-2xl"
        animate={{
          y: isHovered && isActive ? -10 : 0,
          boxShadow: isHovered && isActive ? "0 40px 80px -20px rgba(0,0,0,0.8)" : "0 20px 40px -10px rgba(0,0,0,0.5)",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Glassmorphism frame */}
        <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />

        {/* Image container */}
        <div className="relative h-[400px] w-[400px] overflow-hidden rounded-2xl p-3 md:h-[500px] md:w-[500px]">
          <motion.img
            src={artwork.image}
            alt={artwork.title}
            className="h-full w-full rounded-xl object-cover"
            animate={{
              scale: isHovered && isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Gradient overlay for text */}
          <motion.div
            className="absolute inset-x-3 bottom-3 rounded-b-xl bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            initial={{ opacity: 0, height: "30%" }}
            animate={{
              opacity: isActive ? 1 : 0,
              height: isHovered ? "50%" : "30%",
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Artwork info */}
          <motion.div
            className="absolute inset-x-3 bottom-3 select-none p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isActive ? 1 : 0,
              y: isActive ? 0 : 20,
            }}
            transition={{ duration: 0.4, delay: isActive ? 0.1 : 0 }}
          >
            <motion.p
              className="mb-1 font-mono text-xs uppercase tracking-widest text-white/50"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {artwork.year}
            </motion.p>
            <motion.h2
              className="font-serif text-2xl font-bold text-white md:text-3xl"
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {artwork.title}
            </motion.h2>
            <motion.p
              className="mt-2 text-sm text-white/70"
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
        className="absolute -bottom-20 left-3 right-3 h-20 overflow-hidden rounded-2xl opacity-20 blur-sm"
        style={{
          background: `linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)`,
          transform: "scaleY(-1)",
        }}
        animate={{ opacity: isActive ? 0.15 : 0.05 }}
      />
    </motion.div>
  )
}

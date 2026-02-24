"use client"

import { motion } from "framer-motion"

interface NavigationDotsProps {
  total: number
  current: number
  onSelect: (index: number) => void
  colors: string[]
}

export function NavigationDots({ total, current, onSelect, colors }: NavigationDotsProps) {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className="group relative p-1"
          aria-label={`Go to slide ${index + 1}`}
        >
          <motion.div
            className="h-2 rounded-full transition-colors"
            animate={{
              width: index === current ? 24 : 8,
              backgroundColor: index === current ? colors[0] || "#ffffff" : "rgba(255,255,255,0.3)",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 2, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        </button>
      ))}
    </motion.div>
  )
}

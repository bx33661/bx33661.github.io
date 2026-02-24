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
      className="gallery-navigation-dots"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className="gallery-nav-dot-button"
          aria-label={`Go to slide ${index + 1}`}
        >
          <motion.div
            className="gallery-nav-dot"
            animate={{
              width: index === current ? 24 : 8,
              backgroundColor: index === current ? colors[0] || "#ffffff" : "rgba(255,255,255,0.3)",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <motion.div
            className="gallery-nav-dot-hover"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 2, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        </button>
      ))}
    </motion.div>
  )
}

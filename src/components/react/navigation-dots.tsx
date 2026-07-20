import { memo } from "react"

interface NavigationDotsProps {
  total: number
  current: number
  onSelect: (index: number) => void
  accent?: string
}

function NavigationDotsComponent({
  total,
  current,
  onSelect,
  accent = "#ffffff",
}: NavigationDotsProps) {
  return (
    <div className="gallery-navigation-dots">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === current
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`gallery-nav-dot-button${active ? " is-active" : ""}`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={active ? "true" : undefined}
          >
            <span
              className="gallery-nav-dot"
              style={
                active
                  ? { backgroundColor: accent, width: 24 }
                  : undefined
              }
            />
          </button>
        )
      })}
    </div>
  )
}

export const NavigationDots = memo(NavigationDotsComponent)

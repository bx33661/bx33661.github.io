"use client"

import { useEffect, useRef, type RefObject } from "react"
import { SLIDER_CONSTANTS } from "@/lib/constants"

interface UseSliderWheelProps {
  sliderRef: RefObject<HTMLDivElement | null>
  onScrollLeft: () => void
  onScrollRight: () => void
}

export function useSliderWheel({ sliderRef, onScrollLeft, onScrollRight }: UseSliderWheelProps): void {
  const wheelAccumulatorRef = useRef(0)
  const wheelTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const resistedDelta = delta * SLIDER_CONSTANTS.WHEEL_RESISTANCE

      wheelAccumulatorRef.current += resistedDelta

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }

      if (Math.abs(wheelAccumulatorRef.current) >= SLIDER_CONSTANTS.WHEEL_SCROLL_THRESHOLD) {
        if (wheelAccumulatorRef.current > 0) {
          onScrollLeft()
        } else {
          onScrollRight()
        }
        wheelAccumulatorRef.current = 0
      }

      wheelTimeoutRef.current = setTimeout(() => {
        wheelAccumulatorRef.current = 0
      }, SLIDER_CONSTANTS.WHEEL_RESET_DELAY)
    }

    slider.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      slider.removeEventListener("wheel", handleWheel)
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }
    }
  }, [sliderRef, onScrollLeft, onScrollRight])
}

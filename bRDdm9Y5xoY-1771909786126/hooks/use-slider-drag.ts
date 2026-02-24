"use client"

import { useState, useRef, useCallback } from "react"
import type React from "react"
import { SLIDER_CONSTANTS } from "@/lib/constants"

interface UseSliderDragProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

interface UseSliderDragReturn {
  isDragging: boolean
  dragX: number
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void
  handleDragMove: (e: React.MouseEvent | React.TouchEvent) => void
  handleDragEnd: () => void
}

export function useSliderDrag({ onSwipeLeft, onSwipeRight }: UseSliderDragProps): UseSliderDragReturn {
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)

  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const velocityRef = useRef(0)
  const lastTimeRef = useRef(0)
  const animationRef = useRef<number>()

  const animateToPosition = useCallback((target: number) => {
    const animate = () => {
      setDragX((current) => {
        const diff = target - current
        if (Math.abs(diff) < 0.5) {
          return target
        }
        return current + diff * SLIDER_CONSTANTS.MOMENTUM_EASING
      })
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setDragX(target)
    }, SLIDER_CONSTANTS.ANIMATION_TIMEOUT)
  }, [])

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true)
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      startXRef.current = clientX - dragX / SLIDER_CONSTANTS.DRAG_RESISTANCE
      lastTimeRef.current = Date.now()
      velocityRef.current = 0

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    },
    [dragX],
  )

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const rawDragX = clientX - startXRef.current
      const resistedDragX = rawDragX * SLIDER_CONSTANTS.DRAG_RESISTANCE
      const now = Date.now()
      const dt = now - lastTimeRef.current

      if (dt > 0) {
        velocityRef.current = (resistedDragX - currentXRef.current) / dt
      }

      currentXRef.current = resistedDragX
      lastTimeRef.current = now
      setDragX(resistedDragX)
    },
    [isDragging],
  )

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const velocity = velocityRef.current
    const threshold = window.innerWidth * SLIDER_CONSTANTS.SWIPE_THRESHOLD_PERCENT

    if (dragX < -threshold || velocity < -SLIDER_CONSTANTS.VELOCITY_THRESHOLD) {
      onSwipeLeft()
    } else if (dragX > threshold || velocity > SLIDER_CONSTANTS.VELOCITY_THRESHOLD) {
      onSwipeRight()
    }

    animateToPosition(0)
  }, [isDragging, dragX, onSwipeLeft, onSwipeRight, animateToPosition])

  return {
    isDragging,
    dragX,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}

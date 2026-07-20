import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react"
import { SLIDER_CONSTANTS } from "@/lib/constants"

type PointerLikeEvent =
  | { clientX: number; preventDefault?: () => void; touches?: TouchList }
  | MouseEvent
  | TouchEvent
  | ReactMouseEvent
  | ReactTouchEvent

interface UseSliderDragProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  /** Live drag offset — applied to the track outside React render. */
  onDragOffsetChange?: (offsetX: number) => void
}

interface UseSliderDragReturn {
  isDragging: boolean
  handleDragStart: (e: PointerLikeEvent) => void
  handleDragMove: (e: PointerLikeEvent) => void
  handleDragEnd: () => void
}

function clientXOf(e: PointerLikeEvent): number {
  if ("touches" in e && e.touches && e.touches.length > 0) {
    return e.touches[0].clientX
  }
  return (e as { clientX: number }).clientX
}

/**
 * Drag offset stays off the React render path.
 * On release, parent CSS transition snaps the track — we only flip isDragging.
 */
export function useSliderDrag({
  onSwipeLeft,
  onSwipeRight,
  onDragOffsetChange,
}: UseSliderDragProps): UseSliderDragReturn {
  const [isDragging, setIsDragging] = useState(false)

  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const dragXRef = useRef(0)
  const velocityRef = useRef(0)
  const lastTimeRef = useRef(0)
  const onDragOffsetChangeRef = useRef(onDragOffsetChange)
  const onSwipeLeftRef = useRef(onSwipeLeft)
  const onSwipeRightRef = useRef(onSwipeRight)

  useEffect(() => {
    onDragOffsetChangeRef.current = onDragOffsetChange
  }, [onDragOffsetChange])

  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft
    onSwipeRightRef.current = onSwipeRight
  }, [onSwipeLeft, onSwipeRight])

  const handleDragStart = useCallback((e: PointerLikeEvent) => {
    isDraggingRef.current = true
    setIsDragging(true)
    const clientX = clientXOf(e)
    startXRef.current =
      clientX - dragXRef.current / SLIDER_CONSTANTS.DRAG_RESISTANCE
    lastTimeRef.current = performance.now()
    velocityRef.current = 0
  }, [])

  const handleDragMove = useCallback((e: PointerLikeEvent) => {
    if (!isDraggingRef.current) return

    // Native TouchEvent only — React synthetic touchmove is passive at root.
    if ("cancelable" in e && e.cancelable && "touches" in e) {
      e.preventDefault?.()
    }

    const clientX = clientXOf(e)
    const rawDragX = clientX - startXRef.current
    const resistedDragX = rawDragX * SLIDER_CONSTANTS.DRAG_RESISTANCE
    const now = performance.now()
    const dt = now - lastTimeRef.current

    if (dt > 0) {
      velocityRef.current = (resistedDragX - dragXRef.current) / dt
    }

    lastTimeRef.current = now
    dragXRef.current = resistedDragX
    onDragOffsetChangeRef.current?.(resistedDragX)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    const dragX = dragXRef.current
    const velocity = velocityRef.current
    const threshold =
      window.innerWidth * SLIDER_CONSTANTS.SWIPE_THRESHOLD_PERCENT

    if (dragX < -threshold || velocity < -SLIDER_CONSTANTS.VELOCITY_THRESHOLD) {
      onSwipeLeftRef.current()
    } else if (
      dragX > threshold ||
      velocity > SLIDER_CONSTANTS.VELOCITY_THRESHOLD
    ) {
      onSwipeRightRef.current()
    }

    // Clear drag bookkeeping. Parent settles via CSS when isDragging → false.
    dragXRef.current = 0
    setIsDragging(false)
  }, [])

  return {
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}

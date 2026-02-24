"use client"

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react"

export interface GenerationState {
  progress: number
  sparklesFading: boolean
  showImages: boolean
  generationComplete: boolean
  showGeneratingFooter: boolean
  remainingEta: string
}

interface GenerationContextType {
  states: Record<string, GenerationState>
  startGeneration: (projectId: string, onComplete?: () => void) => void
  cancelGeneration: (projectId: string) => void
}

const GENERATION_DURATION = 10000

const GenerationContext = createContext<GenerationContextType | null>(null)

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, GenerationState>>({})
  const intervalsRef = useRef<Record<string, NodeJS.Timeout>>({})
  const startTimesRef = useRef<Record<string, number>>({})
  const callbacksRef = useRef<Record<string, (() => void) | undefined>>({})

  const cancelGeneration = useCallback((projectId: string) => {
    if (intervalsRef.current[projectId]) {
      clearInterval(intervalsRef.current[projectId])
      delete intervalsRef.current[projectId]
    }
    delete startTimesRef.current[projectId]
    delete callbacksRef.current[projectId]
    setStates((prev) => {
      const newStates = { ...prev }
      delete newStates[projectId]
      return newStates
    })
  }, [])

  const startGeneration = useCallback(
    (projectId: string, onComplete?: () => void) => {
      setStates((prev) => {
        if (prev[projectId]?.generationComplete) return prev
        if (intervalsRef.current[projectId]) return prev

        const now = Date.now()
        startTimesRef.current[projectId] = now
        callbacksRef.current[projectId] = onComplete

        intervalsRef.current[projectId] = setInterval(() => {
          const startTime = startTimesRef.current[projectId]
          if (!startTime) return
          
          const elapsed = Date.now() - startTime
          const newProgress = Math.min(100, (elapsed / GENERATION_DURATION) * 100)
          const remaining = Math.max(0, Math.ceil((GENERATION_DURATION - elapsed) / 1000))

          // Check if we're done
          if (elapsed >= GENERATION_DURATION) {
            clearInterval(intervalsRef.current[projectId])
            delete intervalsRef.current[projectId]
            delete startTimesRef.current[projectId]

            // Complete instantly: hide footer and show images at same time
            setStates((prev) => ({
              ...prev,
              [projectId]: {
                progress: 100,
                sparklesFading: true,
                showImages: true,
                showGeneratingFooter: false,
                generationComplete: true,
                remainingEta: "",
              },
            }))

            const callback = callbacksRef.current[projectId]
            if (callback) {
              callback()
              delete callbacksRef.current[projectId]
            }
            return
          }

          // Update progress during generation
          setStates((prev) => ({
            ...prev,
            [projectId]: {
              ...prev[projectId],
              progress: Math.round(newProgress),
              remainingEta: `~${remaining}s`,
            },
          }))
        }, 50)

        return {
          ...prev,
          [projectId]: {
            progress: 0,
            sparklesFading: false,
            showImages: false,
            generationComplete: false,
            showGeneratingFooter: true,
            remainingEta: "~10s",
          },
        }
      })
    },
    [], // Removed states dependency to prevent infinite loop
  )

  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach((interval) => clearInterval(interval))
    }
  }, [])

  return <GenerationContext.Provider value={{ states, startGeneration, cancelGeneration }}>{children}</GenerationContext.Provider>
}

export function useGeneration() {
  const context = useContext(GenerationContext)
  if (!context) {
    throw new Error("useGeneration must be used within a GenerationProvider")
  }
  return context
}

export function useGenerationState(projectId: string): GenerationState | null {
  const { states } = useGeneration()
  return states[projectId] || null
}

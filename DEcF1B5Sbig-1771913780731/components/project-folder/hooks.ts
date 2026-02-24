"use client"

import { useState, useMemo, useEffect } from "react"
import type { Project } from "@/lib/data"
import type { ImagePosition } from "./types"

interface UseProjectStateProps {
  project: Project
  index: number
  generationDuration: number
}

export function useProjectState({ project, index, generationDuration }: UseProjectStateProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [progress, setProgress] = useState(project.progress || 0)
  const [sparklesFading, setSparklesFading] = useState(false)
  const [showImages, setShowImages] = useState(false)
  const [showGeneratingFooter, setShowGeneratingFooter] = useState(project.isGenerating || false)

  // Generation progress
  useEffect(() => {
    if (!project.isGenerating) return

    const startProgress = project.progress || 0
    const startTime = Date.now()
    const duration = generationDuration

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(100, startProgress + ((100 - startProgress) * elapsed) / duration)
      setProgress(Math.round(newProgress))

      if (elapsed >= duration) {
        clearInterval(progressInterval)
        setSparklesFading(true)
        setTimeout(() => setShowImages(true), 400)
        setTimeout(() => setGenerationComplete(true), 1200)
        setTimeout(() => setShowGeneratingFooter(false), 1200 + 1500)
      }
    }, 100)

    return () => clearInterval(progressInterval)
  }, [project.isGenerating, project.progress, generationDuration])

  const remainingEta = useMemo(() => {
    const remaining = Math.max(0, Math.ceil((100 - progress) / 10))
    return "~" + remaining + "s"
  }, [progress])

  const clipCount = project.clipCount

  const imagePositions = useMemo<ImagePosition[]>(() => {
    const count = 5
    const positions: ImagePosition[] = []
    const totalSpread = 160
    const step = count > 1 ? totalSpread / (count - 1) : 0
    const startX = -totalSpread / 2

    for (let i = 0; i < count; i++) {
      const x = count > 1 ? startX + step * i : 0
      const normalizedPos = count > 1 ? (i / (count - 1)) * 2 - 1 : 0
      const rotate = normalizedPos * 10
      positions.push({ x, rotate })
    }
    return positions
  }, [])

  const formattedDate = useMemo(() => {
    const now = new Date()
    const hoursAgo = index * 24 + Math.floor(project.title.charCodeAt(0) % 20)
    const date = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = months[date.getMonth()]
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return month + " " + day + " · " + displayHours + ":" + minutes + " " + ampm
  }, [project.title, index])

  const isGenerating = project.isGenerating && !generationComplete

  return {
    isHovered,
    setIsHovered,
    generationComplete,
    progress,
    sparklesFading,
    showImages,
    showGeneratingFooter,
    isGenerating,
    clipCount,
    remainingEta,
    formattedDate,
    imagePositions,
  }
}

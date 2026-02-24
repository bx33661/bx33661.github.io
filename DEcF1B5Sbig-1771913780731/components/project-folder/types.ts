import type React from "react"
import type { Project } from "@/lib/data"

export interface ProjectFolderProps {
  project: Project
  index: number
  generationDuration?: number
}

export interface ImagePosition {
  x: number
  rotate: number
}

export interface ProjectState {
  isHovered: boolean
  setIsHovered: (value: boolean) => void
  generationComplete: boolean
  progress: number
  sparklesFading: boolean
  showImages: boolean
  menuOpen: boolean
  setMenuOpen: (value: boolean) => void
  showGeneratingFooter: boolean
  isGenerating: boolean
  clipCount: number
  remainingEta: string
  formattedDate: string
  imagePositions: ImagePosition[]
  menuRef: React.RefObject<HTMLDivElement>
}

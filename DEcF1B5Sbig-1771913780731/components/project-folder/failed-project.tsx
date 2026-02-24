"use client"

import { useState } from "react"
import type { Project } from "@/lib/data"
import { MenuButton } from "./menu-button"

interface FailedProjectProps {
  project: Project
  isHovered: boolean
  setIsHovered: (value: boolean) => void
  onRemove?: () => void
}

export function FailedProject({ project, isHovered, setIsHovered, onRemove }: FailedProjectProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      onRemove?.()
    }, 400)
  }

  return (
    <div
      className="transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        width: isRemoving ? 0 : 288,
        marginRight: isRemoving ? -16 : 0,
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? "scale(0.9) translateY(-20px)" : "scale(1)",
        filter: isRemoving ? "blur(8px)" : "none",
        overflow: "hidden",
      }}
    >
      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isMenuOpen && setIsHovered(false)}
      >
        <div className="relative w-[288px] h-fit mb-4">
          <div
            className="relative z-0 rounded-2xl mb-[-48px] h-36 border border-red-500/[0.08]"
            style={{ background: "linear-gradient(180deg, rgba(220,38,38,0.04) 0%, rgba(127,29,29,0.02) 100%)" }}
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ background: "radial-gradient(circle at 50% 60%, rgba(239,68,68,0.06), transparent 70%)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(6)].map((_, idx) => {
                const positions = [
                  { x: 22, y: 28 },
                  { x: 78, y: 32 },
                  { x: 30, y: 68 },
                  { x: 70, y: 72 },
                  { x: 50, y: 48 },
                  { x: 55, y: 78 },
                ]
                const pos = positions[idx]
                const size = 14 + (idx % 3) * 6
                const opacity = 0.25 + (idx % 3) * 0.1
                const rotation = ((idx * 15) % 30) - 15
                const hoverOffsetX = (idx % 2 === 0 ? -1 : 1) * (3 + idx * 1.5)
                const hoverOffsetY = (idx % 3 === 0 ? -1 : 1) * (2 + idx)
                const hoverRotation = rotation + (idx % 2 === 0 ? -8 : 8)
                return (
                  <div
                    key={idx}
                    className="absolute transition-all duration-500 ease-out"
                    style={{
                      left: pos.x + "%",
                      top: pos.y + "%",
                      opacity: isHovered ? opacity + 0.15 : opacity,
                      transform: isHovered
                        ? `translate(calc(-50% + ${hoverOffsetX}px), calc(-50% + ${hoverOffsetY}px)) rotate(${hoverRotation}deg) scale(1.1)`
                        : `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`,
                    }}
                  >
                    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="1" width="12" height="1" fill="rgba(239,68,68,0.5)" />
                      <rect x="1" y="2" width="1" height="12" fill="rgba(239,68,68,0.5)" />
                      <rect x="14" y="2" width="1" height="12" fill="rgba(239,68,68,0.5)" />
                      <rect x="2" y="14" width="12" height="1" fill="rgba(239,68,68,0.5)" />
                      <rect x="2" y="2" width="1" height="1" fill="rgba(239,68,68,0.5)" />
                      <rect x="13" y="2" width="1" height="1" fill="rgba(239,68,68,0.5)" />
                      <rect x="2" y="13" width="1" height="1" fill="rgba(239,68,68,0.5)" />
                      <rect x="13" y="13" width="1" height="1" fill="rgba(239,68,68,0.5)" />
                      <rect x="4" y="5" width="2" height="3" fill="rgba(239,68,68,0.6)" />
                      <rect x="10" y="5" width="2" height="3" fill="rgba(239,68,68,0.6)" />
                      <rect x="5" y="11" width="1" height="1" fill="rgba(239,68,68,0.6)" />
                      <rect x="6" y="10" width="4" height="1" fill="rgba(239,68,68,0.6)" />
                      <rect x="10" y="11" width="1" height="1" fill="rgba(239,68,68,0.6)" />
                    </svg>
                  </div>
                )
              })}
            </div>
          </div>
          <div
            className="relative rounded-2xl overflow-hidden h-min"
            style={{
              background: "linear-gradient(180deg, rgba(38,32,32,1) 0%, rgba(28,24,24,1) 100%)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/[0.08] to-transparent" />
            <div className="py-4 px-4">
              <h3 className="font-medium text-white/50 text-base leading-snug line-clamp-2 min-h-[2.75rem]">
                {project.title}
              </h3>
            </div>
            <div className="relative h-[48px]">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/[0.04]" />
              <div className="absolute inset-0 flex items-center justify-between px-4 pr-2">
                <span className="text-[13px] text-red-400/60">Processing failed</span>
                <MenuButton project={project} onRemove={handleRemove} onOpenChange={setIsMenuOpen} hideEdit />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

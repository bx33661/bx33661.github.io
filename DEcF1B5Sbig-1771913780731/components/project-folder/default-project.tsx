"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { Project } from "@/lib/data"
import type { ImagePosition } from "./types"
import { SlotNumber } from "./slot-number"
import { MenuButton } from "./menu-button"
import { Sparkles } from "./sparkles"

// Rauno-style easing: smooth deceleration
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

const TRANSITION_DURATION = 0.3 // Declare TRANSITION_DURATION
const TRANSITION_EASE = EASE_OUT_EXPO // Declare TRANSITION_EASE

interface DefaultProjectProps {
  project: Project
  isHovered: boolean
  setIsHovered: (value: boolean) => void
  isGenerating: boolean
  generationComplete: boolean
  progress: number
  sparklesFading: boolean
  showImages: boolean
  showGeneratingFooter: boolean
  imagePositions: ImagePosition[]
  clipCount: number
  remainingEta: string
  formattedDate: string
  onRemove?: () => void
  onCancel?: () => void
  onRename?: (newTitle: string) => void
}

export function DefaultProject({
  project,
  isHovered,
  setIsHovered,
  isGenerating,
  generationComplete,
  progress,
  sparklesFading,
  showImages,
  showGeneratingFooter,
  imagePositions,
  clipCount,
  remainingEta,
  formattedDate,
  onRemove,
  onCancel,
  onRename,
}: DefaultProjectProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open)
    // When menu closes, reset hover state since mouse likely moved outside
    if (!open) {
      setIsHovered(false)
    }
  }
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(project.title)
  const [editCooldown, setEditCooldown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [exitAnimationType, setExitAnimationType] = useState(0)
  
  // Determine animation type based on project id (0-4 for 5 different animations)
  const animationType = typeof project.id === 'number' ? project.id % 5 : parseInt(project.id, 10) % 5 || 0
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Focus textarea when editing starts and move cursor to end
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.focus()
      // Move cursor to end of text
      const length = textarea.value.length
      textarea.setSelectionRange(length, length)
    }
  }, [isEditing])

  // Sync editTitle when project title changes
  useEffect(() => {
    setEditTitle(project.title)
  }, [project.title])

  // Close editing when clicking outside - use ref to track the container
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancelEdit()
      }
    }
    if (isEditing) {
      // Delay adding listener to avoid immediate trigger
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 10)
      return () => {
        clearTimeout(timer)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isEditing])

  // Close delete confirmation when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        cancelDeleteCountdown()
      }
    }
    if (showDeleteConfirm && !isDeleting) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 10)
      return () => {
        clearTimeout(timer)
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showDeleteConfirm, isDeleting])

  const handleEditClick = () => {
    setEditTitle(project.title)
    setIsEditing(true)
  }

  const handleConfirmEdit = () => {
    const trimmedTitle = editTitle.trim()
    if (trimmedTitle && trimmedTitle !== project.title) {
      onRename?.(trimmedTitle)
    }
    setIsEditing(false)
    setIsMenuOpen(false)
    setIsHovered(false)
    // Set cooldown to prevent immediate re-hover
    setEditCooldown(true)
    setTimeout(() => setEditCooldown(false), 300)
  }

  const handleCancelEdit = () => {
    setEditTitle(project.title)
    setIsEditing(false)
    setIsMenuOpen(false)
    setIsHovered(false)
    // Set cooldown to prevent immediate re-hover
    setEditCooldown(true)
    setTimeout(() => setEditCooldown(false), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleConfirmEdit()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
    setIsMenuOpen(false)
  }

  const startDeleteCountdown = () => {
    setIsDeleting(true)
    setDeleteProgress(0)
    
    const duration = 3000
    const interval = 50
    let elapsed = 0
    
    deleteIntervalRef.current = setInterval(() => {
      elapsed += interval
      setDeleteProgress((elapsed / duration) * 100)
    }, interval)
    
    deleteTimeoutRef.current = setTimeout(() => {
      if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current)
      setExitAnimationType(animationType)
      setIsExiting(true)
      setTimeout(() => {
        onRemove?.()
      }, 200) // Instant exit - matches ease-out animation
    }, duration)
  }

  const cancelDeleteCountdown = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current)
      deleteTimeoutRef.current = null
    }
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current)
      deleteIntervalRef.current = null
    }
    setIsDeleting(false)
    setDeleteProgress(0)
    setShowDeleteConfirm(false)
    setIsHovered(false)
  }

  const isActive = isHovered && !isGenerating && !isEditing && !isMenuOpen && !showDeleteConfirm && !isDeleting

  return (
    <motion.div
      ref={containerRef}
      className={`group relative w-[288px] ${isGenerating ? "cursor-default" : "cursor-pointer"}`}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 0.95 : 1,
        rotateX: isExiting ? 15 : 0,
        y: isExiting ? -20 : 0,
      }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        perspective: "1200px",
        zIndex: isActive || isEditing || isMenuOpen || showDeleteConfirm || isDeleting ? 50 : 1,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => !editCooldown && !showDeleteConfirm && !isDeleting && setIsHovered(true)}
      onMouseLeave={() => !isMenuOpen && !isEditing && !showDeleteConfirm && !isDeleting && setIsHovered(false)}
    >
      <div
        className="relative w-[288px]"
        style={{ perspective: "1200px" }}
      >
        {/* Back panel */}
        <motion.div
          className="relative z-0 rounded-2xl"
          animate={{
            rotateX: isActive ? 15 : 0,
            backgroundColor: isGenerating ? "#111111" : "#1e1e1e",
          }}
          transition={{
            rotateX: {
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 0.8,
            },
            backgroundColor: {
              duration: TRANSITION_DURATION,
              ease: TRANSITION_EASE,
            },
          }}
          style={{
            height: "224px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
          }}
        >
          {project.isGenerating && <Sparkles count={16} fading={sparklesFading} variant="generating" />}
          <motion.div
            className="absolute inset-0"
            animate={{
              rotateX: isActive ? -15 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 0.8,
            }}
            style={{
              transformStyle: "flat",
              transformOrigin: "center bottom",
            }}
          >
            {[...Array(5)].map((_, imgIndex) => {
              const pos = imagePositions[imgIndex]
              const imageUrl = project.images?.[imgIndex % (project.images?.length || 1)] || "/placeholder.svg"
              const shouldShowImages = !project.isGenerating || showImages

              const centerIndex = 2
              const distanceFromCenter = Math.abs(imgIndex - centerIndex)
              const zIndex = 10 - distanceFromCenter

              const brightness = distanceFromCenter === 0 ? 1 : distanceFromCenter === 1 ? 0.55 : 0.3
              const blurAmount = distanceFromCenter === 0 ? 0 : distanceFromCenter === 1 ? 0.5 : 1.5
              const yOffset = -16 * (1 - distanceFromCenter / centerIndex) || 0
              const scale = distanceFromCenter === 0 ? 1.05 : distanceFromCenter === 1 ? 0.95 : 0.88

              // Final positions (where images should be when visible)
              // Menu open, editing, or delete confirm = closed folder with scaled down previews
              const isCompact = isEditing || isMenuOpen || showDeleteConfirm || isDeleting
              const xPos = isCompact ? pos.x * 0.85 : isActive ? pos.x * 1.4 : pos.x
              const yPos = isCompact ? 18 + yOffset : isActive ? -8 + yOffset : 8 + yOffset
              const rotation = isCompact ? pos.rotate * 0.8 : isActive ? pos.rotate * 1.3 : pos.rotate
              const finalScale = isCompact ? scale * 0.98 : isActive ? scale * 1.02 : scale

              // Center-out stagger: center card (index 2) first, then adjacent, then outer
              const staggerDelay = distanceFromCenter * 0.08

              return (
                <motion.div
                  key={imgIndex}
                  className="absolute left-1/2 top-0"
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${xPos}px)`,
                    y: yPos,
                    rotate: rotation,
                    scale: shouldShowImages ? finalScale : 0.8,
                    opacity: shouldShowImages ? 1 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 16,
                    mass: 1,
                    delay: shouldShowImages ? staggerDelay : 0,
                    opacity: { duration: 0.4, ease: "easeOut", delay: shouldShowImages ? staggerDelay : 0 },
                  }}
                  style={{ zIndex }}
                >
                  <div className="h-[160px] w-[100px] overflow-hidden rounded-lg">
                    <motion.img
                      src={imageUrl || "/placeholder.svg"}
                      alt={"Preview " + (imgIndex + 1)}
                      className="h-full w-full object-cover"
                      animate={{
                        filter: `brightness(${isActive ? Math.min(1, brightness + 0.2) : brightness}) contrast(1.08) saturate(${1 - distanceFromCenter * 0.2}) blur(${isActive ? 0 : blurAmount}px)`,
                      }}
                      transition={{
                        duration: TRANSITION_DURATION,
                        ease: TRANSITION_EASE,
                      }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>

        {/* Front panel */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-10 rounded-2xl overflow-hidden"
          animate={{
            rotateX: isActive ? -25 : 0,
            backgroundColor: isGenerating ? "rgba(20, 20, 20, 0.85)" : "rgba(26, 26, 26, 0.8)",
          }}
          transition={{
            rotateX: {
              type: "spring",
              stiffness: 180,
              damping: 22,
              mass: 0.8,
            },
            backgroundColor: {
              duration: TRANSITION_DURATION,
              ease: TRANSITION_EASE,
            },
          }}
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
          }}
        >
          <div className="relative py-4 px-4 min-h-[2.75rem]">
            {/* Edit mode glow effect - Rauno style */}
            <div 
              className="absolute -inset-2 transition-all duration-500 rounded-t-2xl pointer-events-none"
              style={{
                opacity: isEditing ? 1 : 0,
                background: 'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(120,180,255,0.15) 0%, transparent 60%)',
                filter: 'blur(12px)',
              }}
            />
            <div 
              className="absolute -inset-px transition-all duration-500 rounded-t-lg pointer-events-none overflow-hidden"
              style={{
                opacity: isEditing ? 1 : 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              }}
            />
            <div 
              className="absolute inset-x-2 -top-1 h-px transition-all duration-500 pointer-events-none"
              style={{
                opacity: isEditing ? 1 : 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                filter: 'blur(0.5px)',
              }}
            />
            <h3
              className={`font-semibold text-white/70 text-base leading-snug line-clamp-2 min-h-[2.75rem] relative z-0 transition-all duration-200 ${!isGenerating ? "group-hover:text-white" : ""}`}
              style={{ opacity: isEditing ? 0 : 1, pointerEvents: isEditing ? "none" : "auto" }}
            >
              {project.title}
            </h3>
            <textarea
              ref={textareaRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="absolute inset-0 w-full h-full py-4 px-4 bg-transparent border-none rounded-none text-white text-base font-semibold leading-snug focus:outline-none caret-white resize-none transition-opacity duration-200"
              style={{ opacity: isEditing ? 1 : 0, pointerEvents: isEditing ? "auto" : "none" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="relative h-[48px]">
            {/* Top border */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/[0.04]" />
            
            {/* Progress bar - only show during active generation */}
            {isGenerating && progress < 100 && (
              <motion.div
                className="absolute top-0 left-0 h-[1px] bg-white/10"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            )}
            
            {/* Footer content - derive from showImages for reliability */}
            <div className="relative h-full">
              {isEditing ? (
                <motion.div
                  key="editing"
                  className="absolute inset-0 flex items-center justify-end px-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                    opacity: { duration: 0.15 },
                  }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 rounded-full text-[12px] text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelEdit()
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium text-black bg-white hover:bg-white/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleConfirmEdit()
                      }}
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              ) : isGenerating && !showImages ? (
                <motion.div
                  key="generating"
                  className="absolute inset-0 flex items-center justify-between px-2 pl-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                    opacity: { duration: 0.15 },
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <motion.svg
                      className="w-3 h-3 text-white/60"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    >
                      <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
                    </motion.svg>
                    <span className="text-[13px] text-transparent bg-clip-text bg-gradient-to-r from-white/50 via-white/80 to-white/50 bg-[length:200%_100%] animate-shimmer">Generating</span>
                    {progress < 95 && <span className="text-[13px] text-white/50">{remainingEta}</span>}
                  </div>
                  <MenuButton project={project} onOpenChange={handleMenuOpenChange} onRemove={handleDeleteClick} onCancel={onCancel} onRename={handleEditClick} isVisible={true} />
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  className="absolute inset-0 flex items-center justify-between px-2 pl-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                    mass: 1,
                    opacity: { duration: 0.35, ease: "easeOut" },
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <SlotNumber value={clipCount} isSpinning={false} />
                    <span className="text-[13px] text-white/60">clips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">{formattedDate}</span>
                    <MenuButton project={project} onOpenChange={handleMenuOpenChange} onRemove={handleDeleteClick} onCancel={onCancel} onRename={handleEditClick} isVisible={true} />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete confirmation overlay */}
      {(showDeleteConfirm || isDeleting) && (
        <div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer rounded-2xl"
          onClick={() => {
            setShowDeleteConfirm(false)
            setIsHovered(false)
          }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "#0a0a0a",
              animation: "backdropFadeIn 300ms ease-out forwards",
            }}
          />

          {/* Content */}
          <div
            className="relative cursor-default flex flex-col items-center px-5 py-5 w-full h-full"
            style={{
              animation: isExiting 
                ? `${['exitShrinkRise', 'exitCollapse', 'exitFlashFade', 'exitFoldAway', 'exitDissolve'][exitAnimationType]} 200ms ease-out forwards`
                : "menuAppear 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              transformOrigin: exitAnimationType === 3 ? 'center bottom' : 'center center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes backdropFadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
              }
              @keyframes menuAppear {
                0% {
                  opacity: 0;
                  transform: scale(0.85) translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }
              @keyframes crownImageAppear {
                0% {
                  opacity: 0;
                  transform: translateY(10px) scale(0.8);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              /* Animation 0: Shrink + Fade + Rise */
              @keyframes exitShrinkRise {
                0% {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
                100% {
                  opacity: 0;
                  transform: scale(0.7) translateY(-40px);
                }
              }
              /* Animation 1: Collapse to Center */
              @keyframes exitCollapse {
                0% {
                  opacity: 1;
                  transform: scale(1);
                  filter: blur(0px);
                }
                50% {
                  opacity: 0.8;
                  transform: scale(0.5);
                  filter: blur(2px);
                }
                100% {
                  opacity: 0;
                  transform: scale(0.1);
                  filter: blur(8px);
                }
              }
              /* Animation 2: Success Flash + Fade */
              @keyframes exitFlashFade {
                0% {
                  opacity: 1;
                  filter: brightness(1);
                }
                15% {
                  opacity: 1;
                  filter: brightness(2);
                }
                100% {
                  opacity: 0;
                  filter: brightness(0.5);
                }
              }
              /* Animation 3: Fold Away (3D flip) */
              @keyframes exitFoldAway {
                0% {
                  opacity: 1;
                  transform: perspective(800px) rotateX(0deg) scale(1);
                }
                100% {
                  opacity: 0;
                  transform: perspective(800px) rotateX(-90deg) scale(0.8);
                }
              }
              /* Animation 4: Dissolve Out (blur + fade) */
              @keyframes exitDissolve {
                0% {
                  opacity: 1;
                  filter: blur(0px) saturate(1);
                  transform: scale(1);
                }
                100% {
                  opacity: 0;
                  filter: blur(20px) saturate(0);
                  transform: scale(1.1);
                }
              }
            `}</style>

            {/* Crown Images */}
            <div 
              className="flex items-end justify-center gap-0"
              style={{ marginTop: "-34px" }}
            >
              {[1, 2, 3].map((imgIndex, i) => {
                const imageUrl = project.images?.[imgIndex] || "/placeholder.svg"
                const rotations = [-10, 0, 10]
                const yOffsets = [4, 0, 4]
                const scales = [0.95, 1.05, 0.95]
                const marginLeft = i === 0 ? 0 : -8
                
                return (
                  <div
                    key={imgIndex}
                    className="relative"
                    style={{
                      zIndex: i === 1 ? 3 : 1,
                      marginLeft: marginLeft,
                      animation: `crownImageAppear 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${80 + i * 60}ms both`,
                    }}
                  >
                    <div 
                      className="h-[72px] w-[44px] overflow-hidden rounded-md shadow-xl"
                      style={{
                        transform: `translateY(${yOffsets[i]}px) rotate(${rotations[i]}deg) scale(${scales[i]})`,
                      }}
                    >
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt={"Preview " + (imgIndex + 1)}
                        className="h-full w-full object-cover"
                        style={{
                          filter: i === 1 ? "brightness(1)" : "brightness(0.6)",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Clip Count Tag */}
            <div 
              className="flex items-center justify-center gap-1 px-2 py-1 rounded-full"
              style={{
                marginTop: "-20px",
                zIndex: 10,
                background: "rgba(255, 255, 255, 0.07)",
                backdropFilter: "blur(12px)",
                animation: "crownImageAppear 400ms cubic-bezier(0.34, 1.56, 0.64, 1) 280ms both",
              }}
            >
              <span className="text-[11px] font-medium text-white/60">{clipCount}</span>
              <span className="text-[11px] text-white/40">clips</span>
            </div>

            {/* Title */}
            <div className="text-center mt-3 mb-1 px-2">
              <p className="text-white font-semibold text-[15px] leading-snug line-clamp-2 text-balance">{project.title}</p>
            </div>

            {/* Subtitle / Deleting state */}
            {isDeleting ? (
              <div className="flex flex-col items-center mb-auto">
                {isExiting ? (
                  <p className="text-white/60 text-[13px] font-medium">Deleted</p>
                ) : (
                  <>
                    <p className="text-white/40 text-[12px]">Deleting...</p>
                    <div className="w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-100"
                        style={{ 
                          width: `${deleteProgress}%`,
                          backgroundColor: "oklch(0.5801 0.227 25.12)"
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-[12px] mb-auto">Project will be permanently deleted</p>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-center gap-2 w-full mt-auto" style={{ opacity: isExiting ? 0 : 1, transition: 'opacity 200ms' }}>
              {isDeleting ? (
                <button
                  className="flex-1 py-2 rounded-full bg-white/[0.1] hover:bg-white/[0.15] text-white/80 hover:text-white text-[13px] font-medium transition-all duration-200 active:scale-[0.97]"
                  onClick={(e) => {
                    e.stopPropagation()
                    cancelDeleteCountdown()
                  }}
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    className="flex-1 py-2 rounded-full bg-white/[0.1] hover:bg-white/[0.15] text-white/80 hover:text-white text-[13px] font-medium transition-all duration-200 active:scale-[0.97]"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(false)
                      setIsHovered(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2 rounded-full text-white text-[13px] font-medium transition-all duration-300 ease-out active:scale-[0.97]"
                    style={{ backgroundColor: "oklch(0.5801 0.227 25.12)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "oklch(0.65 0.2 25.12)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "oklch(0.5801 0.227 25.12)"
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      startDeleteCountdown()
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </motion.div>
  )
}

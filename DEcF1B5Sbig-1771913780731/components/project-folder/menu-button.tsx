"use client"

import { useState } from "react"
import type { Project } from "@/lib/data"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash2, X } from "lucide-react"

interface MenuButtonProps {
  project: Project
  onOpenChange?: (open: boolean) => void
  onRemove?: () => void
  onCancel?: () => void
  onRename?: () => void
  hideEdit?: boolean
  isVisible?: boolean
}

export function MenuButton({ project, onOpenChange, onRemove, onCancel, onRename, hideEdit, isVisible = false }: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          data-menu
          className={`p-1.5 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 ${
            isOpen ? "bg-white/[0.12]" : "hover:bg-white/[0.08]"
          } ${isVisible ? "opacity-100" : "opacity-0"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className={`w-4 h-4 transition-colors ${isOpen ? "text-white/70" : "text-white/40"}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={4}
        className="w-40 bg-[#1a1a1a] border-white/[0.08] rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {project.isGenerating ? (
          <DropdownMenuItem
            className="group text-white/70 hover:text-red-400 focus:text-red-400 focus:bg-white/[0.06] cursor-pointer gap-2 transition-colors"
            onClick={onCancel}
          >
            <X className="w-4 h-4 transition-colors group-hover:text-red-400 group-focus:text-red-400" />
            Cancel
          </DropdownMenuItem>
        ) : (
          <>
            {!hideEdit && (
              <DropdownMenuItem
                className="text-white/70 focus:text-white focus:bg-white/[0.06] cursor-pointer gap-2"
                onClick={onRename}
              >
                <Pencil className="w-4 h-4" />
                Rename
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="group text-white/70 hover:text-red-400 focus:text-red-400 focus:bg-white/[0.06] cursor-pointer gap-2 transition-colors"
              onClick={onRemove}
            >
              <Trash2 className="w-4 h-4 transition-colors group-hover:text-red-400 group-focus:text-red-400" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState } from "react"
import { Heart } from "lucide-react"

interface SidebarProps {
  onNavigate?: (view: "clips" | "favorites" | "settings") => void
  activeView?: "clips" | "favorites" | "settings"
}

const navItems = [
  { name: "Home", icon: "home" },
  { name: "History", icon: "history" },
  { name: "Clips", icon: "clips", view: "clips" as const },
  { name: "Storage", icon: "storage" },
  { name: "Channels", icon: "channels" },
  { name: "Analytics", icon: "analytics" },
]

function NavIcon({ type }: { type: string }) {
  switch (type) {
    case "home":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      )
    case "history":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
          />
        </svg>
      )
    case "clips":
      return (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.8899 4.00123L14.6663 4.33398L13.8899 4.66674C13.0403 5.03088 12.3632 5.7079 11.9991 6.55755L11.6663 7.33398L11.3336 6.55755C10.9694 5.7079 10.2924 5.03088 9.44277 4.66674L8.66634 4.33398L9.44277 4.00123C10.2924 3.63709 10.9694 2.96007 11.3336 2.11041L11.6663 1.33398L11.9991 2.11042C12.3632 2.96007 13.0403 3.63709 13.8899 4.00123Z"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinejoin="round"
          />
          <path
            d="M8.65286 9.08543L10.6663 10.0007L8.65286 10.9159C7.88249 11.266 7.26506 11.8835 6.91489 12.6538L5.99967 14.6673L5.08446 12.6538C4.73429 11.8835 4.11686 11.266 3.34648 10.9159L1.33301 10.0007L3.34649 9.08543C4.11686 8.73526 4.73429 8.11784 5.08446 7.34746L5.99967 5.33398L6.91489 7.34746C7.26506 8.11784 7.88249 8.73526 8.65286 9.08543Z"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </svg>
      )
    case "favorites":
      return <Heart className="w-4 h-4" />
    case "storage":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      )
    case "channels":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      )
    case "analytics":
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      )
    default:
      return null
  }
}

export function Sidebar({ onNavigate, activeView = "clips" }: SidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(true)

  return (
    <aside className="hidden md:flex fixed left-0 top-0 w-[220px] h-screen backdrop-blur-2xl bg-black/60 flex-col z-50">
      <div className="px-3 py-1.5">
        <button className="flex items-center gap-2 text-white/40 hover:text-white/60 text-[12px] transition-all duration-200 px-1.5 py-1 rounded-md hover:bg-white/[0.04]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
          </svg>
          Invite members
        </button>
      </div>

      <div className="px-3 pt-4 pb-1">
        <div className="flex items-center justify-between mb-1.5 px-1.5">
          <span className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Workspaces</span>
          <button className="text-white/30 hover:text-white/50 text-[11px] font-medium transition-colors duration-200">
            + Add
          </button>
        </div>
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="flex items-center gap-2 w-full hover:bg-white/[0.05] rounded-lg py-1.5 px-1.5 transition-all duration-200"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center text-white/50 text-[10px] font-semibold shadow-sm">
            D
          </div>
          <span className="flex-1 text-left text-white/70 text-[13px] font-medium">Default</span>
          <svg
            className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${workspaceOpen ? "rotate-0" : "-rotate-90"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {workspaceOpen && (
        <nav className="px-3 py-1 flex-1">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.view ? activeView === item.view : false
              return (
                <button
                  key={item.name}
                  onClick={() => item.view && onNavigate?.(item.view)}
                  className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/[0.06] text-white shadow-sm"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-white/40"}>
                    <NavIcon type={item.icon} />
                  </span>
                  <span className="flex-1 text-left tracking-[-0.01em]">{item.name}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <div className="px-4 py-3 mt-auto border-t border-white/[0.06]">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {["Pricing", "Help Center", "Changelog", "Terms", "About"].map((link) => (
            <button
              key={link}
              className="text-white/25 hover:text-white/40 text-[10px] font-medium transition-colors duration-200"
            >
              {link}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

import { cn } from "@/lib/utils"

function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/bx.jpg"
      alt="BX Logo"
      className={cn(
        "w-full h-auto object-cover rounded-lg transition-all duration-300 hover:scale-105",
        className
      )}
      loading="lazy"
      width={350}
      height={266}
    />
  )
}

export default Logo

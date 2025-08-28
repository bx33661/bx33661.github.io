import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface InfiniteScrollProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  className,
  speed = 50,
  direction = 'left',
  pauseOnHover = false,
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollerRef.current) return

    const scroller = scrollerRef.current
    const scrollerInner = scroller.querySelector('.scroller-inner')
    
    if (!scrollerInner) return

    // 使用requestAnimationFrame确保DOM完全渲染
    const setupClones = () => {
      requestAnimationFrame(() => {
        const scrollerContent = Array.from(scrollerInner.children).filter(
          (child) => !child.hasAttribute('data-cloned')
        )

        // 清除之前的克隆元素
        const existingClones = scrollerInner.querySelectorAll('[data-cloned="true"]')
        existingClones.forEach(clone => clone.remove())

        // 确保有实际内容才进行克隆
        if (scrollerContent.length > 0) {
          // 检查内容是否真的有可见元素
          const hasVisibleContent = scrollerContent.some(child => {
            const element = child as HTMLElement
            return element.offsetWidth > 0 && element.offsetHeight > 0
          })

          if (hasVisibleContent) {
            // 计算需要的克隆数量以确保无缝滚动
            const containerWidth = scroller.offsetWidth || window.innerWidth
            const contentWidth = scrollerContent.reduce((total, item) => {
              return total + (item as HTMLElement).offsetWidth + 16 // 16px for gap
            }, 0)
            
            // 确保至少有4倍屏幕宽度的内容，避免任何空窗期
            const minRequiredWidth = containerWidth * 4
            const cloneCount = Math.max(4, Math.ceil(minRequiredWidth / contentWidth))
            
            for (let i = 0; i < cloneCount; i++) {
              scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true) as HTMLElement
                duplicatedItem.setAttribute('data-cloned', 'true')
                duplicatedItem.setAttribute('data-clone-set', i.toString())
                scrollerInner.appendChild(duplicatedItem)
              })
            }
          }
        }
      })
    }

    // 延迟执行以确保children完全渲染
    const timer = setTimeout(setupClones, 100)

    return () => clearTimeout(timer)
  }, [children])

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsHovered(true)
      setIsPaused(true)
    }
  }

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsHovered(false)
      setIsPaused(false)
    }
  }

  return (
    <div
      ref={scrollerRef}
      className={cn(
        'scroller relative z-20 overflow-hidden',
        // 改进的渐变遮罩效果
        '[mask-image:linear-gradient(to_right,transparent_0%,black_15%,black_85%,transparent_100%)]',
        // 添加微妙的阴影效果
        'before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-8 before:bg-gradient-to-r before:from-background before:to-transparent before:pointer-events-none',
        'after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-8 after:bg-gradient-to-l after:from-background after:to-transparent after:pointer-events-none',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'scroller-inner flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap',
          direction === 'left' ? 'animate-scroll-smooth' : 'animate-scroll-reverse-smooth',
          isPaused && 'animation-paused',
          isHovered && 'hover-glow'
        )}
        style={{
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default InfiniteScroll
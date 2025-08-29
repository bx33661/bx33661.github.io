import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
export const prerender = true
export const dynamic = 'force-dynamic'

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  const handleToggleClick = () => {
    const element = document.documentElement
    
    // 添加平滑过渡
    element.style.transition = 'background-color 0.3s ease, color 0.3s ease'
    
    const willBeDark = !element.classList.contains('dark')
    setIsDark(willBeDark)
    
    if (willBeDark) {
      element.classList.add('dark')
    } else {
      element.classList.remove('dark')
    }

    localStorage.setItem('theme', willBeDark ? 'dark' : 'light')
    
    // 移除过渡效果
    setTimeout(() => {
      element.style.transition = ''
    }, 300)
  }

  useEffect(() => {
    setMounted(true)
    
    const theme = (() => {
      const localStorageTheme = localStorage?.getItem('theme') ?? ''
      if (['dark', 'light'].includes(localStorageTheme)) {
        return localStorageTheme
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    })()

    const isInitiallyDark = theme === 'dark'
    setIsDark(isInitiallyDark)

    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }

    window.localStorage.setItem('theme', theme)

    const handleAfterSwap = () => {
      const storedTheme = localStorage.getItem('theme')
      const element = document.documentElement
      const newIsDark = storedTheme === 'dark'
      
      setIsDark(newIsDark)

      element.classList.add('disable-transitions')

      window.getComputedStyle(element).getPropertyValue('opacity')

      if (newIsDark) {
        element.classList.add('dark')
      } else {
        element.classList.remove('dark')
      }

      requestAnimationFrame(() => {
        element.classList.remove('disable-transitions')
      })

    }

    document.addEventListener('astro:after-swap', handleAfterSwap)

    return () => {
      document.removeEventListener('astro:after-swap', handleAfterSwap)
    }
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="secondary"
        size="icon"
        title="Toggle theme"
        className="opacity-50"
      >
        <SunIcon className="size-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
    >
      <Button
        onClick={handleToggleClick}
        variant="secondary"
        size="icon"
        title="Toggle theme"
        className="relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut",
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <MoonIcon className="size-4 text-blue-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeInOut",
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <SunIcon className="size-4 text-yellow-500" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 背景光效 */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          animate={{
            background: isDark 
              ? 'radial-gradient(circle, oklch(0.70 0.18 264 / 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, oklch(0.85 0.08 30 / 0.2) 0%, transparent 70%)'
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* 点击波纹效果 */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 0, opacity: 0.5 }}
          whileTap={{
            scale: [0, 1.2, 0],
            opacity: [0.5, 0.2, 0],
            background: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)'
          }}
          transition={{ duration: 0.4 }}
        />
        
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  )
}

export default ThemeToggle

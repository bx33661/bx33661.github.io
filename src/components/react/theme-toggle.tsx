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
    <Button
      onClick={handleToggleClick}
      variant="secondary"
      size="icon"
      title="Toggle theme"
      className="relative overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: 90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: -90, scale: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <MoonIcon className="size-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <SunIcon className="size-4" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 背景光效 */}
      <motion.div
        className="absolute inset-0 opacity-0"
        animate={{
          background: isDark 
            ? 'radial-gradient(circle, oklch(0.70 0.18 264 / 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, oklch(0.85 0.08 30 / 0.3) 0%, transparent 70%)'
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeToggle

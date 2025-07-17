import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from './link'
import ThemeToggle from './theme-toggle'
import { NAV_LINKS, SITE } from '../../consts'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'
import Logo from '../ui/logo'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Separator } from '../ui/separator'

const Navbar = () => {
  const [scrollLevel, setScrollLevel] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePath, setActivePath] = useState("/")
  
  useEffect(() => {
    setActivePath(window.location.pathname)
    
    const handleRouteChange = () => {
      setActivePath(window.location.pathname)
    }
    
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])
  
  // 键盘导航支持
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false)
    }
  }
  
  useEffect(() => {
    const handleResize = debounce(() => {
      const isMobileView = window.matchMedia('(max-width: 768px)').matches
      setIsMobile(isMobileView)
      if (!isMobileView && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }, 100)

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleScroll = debounce(() => {
      const scrollY = window.scrollY
      setScrollLevel(
        scrollY > 500 ? 4 : scrollY > 300 ? 3 : scrollY > 150 ? 2 : scrollY > 0 ? 1 : 0
      )
      setIsScrolled(scrollY > 0)
    }, 50)

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const sizeVariants: Record<number, { width: string }> = {
    0: { width: '100%' },
    1: { width: '90%' },
    2: { width: '80%' },
    3: { width: '70%' },
    4: { width: '50%' },
  }

  const menuVariants = {
    closed: {
      opacity: 0,
      y: "-100%",
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    open: {
      opacity: 1,
      y: "0%",
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border/60'
          : 'bg-transparent'
      )}
      role="banner"
      onKeyDown={handleKeyDown}
    >
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between p-4"
        role="navigation"
        aria-label="主导航"
      >
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            aria-label={`${SITE.title} - 首页`}
          >
            <div className="h-8 w-8">
              <Logo />
            </div>
            <span className="font-custom text-xl font-bold text-foreground">
              {SITE.title}
            </span>
          </Link>
        </div>

        {/* 桌面导航 */}
        <div className="hidden md:flex items-center space-x-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary',
                activePath === link.href || activePath.startsWith(link.href + '/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              aria-current={activePath === link.href ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Separator orientation="vertical" className="h-6 mx-2" />
          <ThemeToggle />
        </div>

        {/* 移动端菜单按钮 */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            className="focus:ring-2 focus:ring-primary"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </nav>

      {/* 移动端菜单 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-t border-border/60"
            role="menu"
            aria-label="移动端导航菜单"
          >
            <div className="px-4 py-2 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary',
                    activePath === link.href || activePath.startsWith(link.href + '/')
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={activePath === link.href ? 'page' : undefined}
                  role="menuitem"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
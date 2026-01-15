import { useState, useEffect, useCallback, useMemo, useRef, type TouchEvent } from 'react'
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
  const touchStartY = useRef<number | null>(null)

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

  const handleResize = useCallback(
    debounce(() => {
      const isMobileView = window.matchMedia('(max-width: 768px)').matches
      setIsMobile(isMobileView)
      if (!isMobileView && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }, 100),
    [mobileMenuOpen]
  )

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  const handleScroll = useCallback(
    debounce(() => {
      const scrollY = window.scrollY
      setScrollLevel(
        scrollY > 400 ? 4 : scrollY > 250 ? 3 : scrollY > 100 ? 2 : scrollY > 20 ? 1 : 0
      )
      setIsScrolled(scrollY > 20)
    }, 30),
    []
  )

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

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

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const endY = event.changedTouches[0]?.clientY ?? 0
    if (touchStartY.current !== null && endY - touchStartY.current > 60) {
      setMobileMenuOpen(false)
    }
    touchStartY.current = null
  }

  const sizeVariants = useMemo(() => ({
    0: { width: '100%' },
    1: { width: '98%' },
    2: { width: '90%' },
    3: { width: '80%' },
    4: { width: '70%' },
  } as Record<number, { width: string }>), [])

  return (
    <>
      <motion.header
        aria-label="Navigation"
        role="navigation"
        layout={!isMobile}
        initial={sizeVariants[0]}
        animate={isMobile ? sizeVariants[0] : sizeVariants[scrollLevel]}
        transition={{
          width: { duration: 0.4, ease: "easeInOut" },
          layout: { duration: 0.3, ease: "easeInOut" }
        }}
        className={cn(
          'z-30 transition-all duration-400 ease-in-out w-full',
          !isMobile && [
            'fixed left-1/2 -translate-x-1/2 transform',
            'top-2 lg:top-4 xl:top-6',
            'backdrop-blur-lg bg-background/90 border border-transparent',
            isScrolled && 'rounded-full backdrop-blur-md border-foreground/10 border bg-background/80 max-w-[calc(100vw-5rem)]'
          ],
          isMobile && [
            'sticky top-0 inset-x-0 translate-x-0 left-0',
            'rounded-none border-0 border-b border-foreground/10',
            'bg-background/92 shadow-sm backdrop-blur-md'
          ]
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 md:gap-4 md:p-4">
          <Link
            href="/"
            className="font-custom flex shrink-0 items-center gap-1.5 text-base font-bold md:gap-2 md:text-xl"
            aria-label="Home"
            title="Home"
            navigation="true"
          >
            <Logo className="h-6 w-6 md:h-8 md:w-8" />
            <span className={
              'transition-opacity duration-200 ease-in-out text-foreground/90 dark:text-white'}>
              {SITE.title}
            </span>
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation" role="navigation">
              {NAV_LINKS.map((item) => {
                const isActive = activePath.startsWith(item.href) && item.href !== "/";
                return (
                  <motion.div
                    key={item.href}
                    whileHover={{
                      scale: 1.05,
                      y: -2
                    }}
                    whileTap={{
                      scale: 0.95,
                      y: 0
                    }}
                    className="relative"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17
                    }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "text-sm font-medium capitalize transition-all duration-300",
                        "relative py-2 px-3 rounded-lg",
                        "before:absolute before:inset-0 before:rounded-lg before:bg-primary/10 before:scale-0 before:transition-transform before:duration-300",
                        "hover:before:scale-100",
                        "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300",
                        "hover:after:w-[calc(100%-0.5rem)] hover:text-foreground",
                        "hover:shadow-lg hover:shadow-primary/20",
                        isActive
                          ? "text-foreground after:w-[calc(100%-0.5rem)] after:bg-primary before:scale-100 shadow-md shadow-primary/20"
                          : "text-foreground/70"
                      )}
                      onClick={() => setActivePath(item.href)}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <ThemeToggle />

            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className={
                  "h-8 w-8 rounded-full p-0 transition-colors duration-200 ease-in-out"
                }
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="mobile-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mobile-menu-overlay fixed inset-0 z-10 bg-black/60 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mobile-menu-sheet fixed inset-0 z-20 flex flex-col items-center justify-start bg-background border-0 shadow-2xl"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="mobile-menu-panel flex flex-col items-center justify-start h-full w-full px-8 pt-24 pb-12">
                <nav className="flex flex-col items-center justify-start gap-3 w-full max-w-xs">
                  {NAV_LINKS.map((item, i) => {
                    const isActive = item.href === "/"
                      ? activePath === "/"
                      : activePath.startsWith(item.href);
                    const icons: Record<string, string> = {
                      '/': '🏠',
                      '/about/': '👤',
                      '/blog/': '📝',
                      '/notes/': '📒',
                      '/archive': '📦',
                      '/friends/': '🤝',
                    };
                    return (
                      <motion.div
                        key={item.href}
                        custom={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.08,
                          type: "spring",
                          stiffness: 400,
                          damping: 25
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            setActivePath(item.href);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold transition-all duration-300 rounded-2xl",
                            "border border-transparent",
                            isActive
                              ? "bg-primary/15 text-primary border-primary/30 shadow-lg shadow-primary/10"
                              : "text-foreground hover:bg-muted/80 hover:border-border/50"
                          )}
                        >
                          <span className="text-xl">{icons[item.href] || '📄'}</span>
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-auto pt-8 text-center"
                >
                  <p className="text-muted-foreground text-xs">
                    2020 - {new Date().getFullYear()} © bx33661
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
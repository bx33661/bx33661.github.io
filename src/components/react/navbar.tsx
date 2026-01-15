import { useState, useEffect, useCallback, useRef, type TouchEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from './link'

import { NAV_LINKS, SITE } from '../../consts'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'
import Logo from '../ui/logo'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { Separator } from '../ui/separator'

const Navbar = () => {
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
      setIsScrolled(scrollY > 20)
    }, 10),
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

  return (
    <>
      <motion.header
        aria-label="Navigation"
        role="navigation"
        layout={!isMobile}
<<<<<<< HEAD
        initial={sizeVariants[0]}
        animate={isMobile ? sizeVariants[0] : sizeVariants[scrollLevel]}
        transition={{
          width: { duration: 0.4, ease: "easeInOut" },
          layout: { duration: 0.3, ease: "easeInOut" }
=======
        initial={{ width: '100%', y: 0 }}
        animate={{
          width: isMobile ? '100%' : (isScrolled ? '70%' : '100%'),
          y: 0
        }}
        transition={{
          width: { duration: 0.3, ease: 'easeInOut' },
          layout: { duration: 0.3, ease: 'easeInOut' }
>>>>>>> 5050183b6bf0e81fef05b941bd1761f05ad1d43a
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

<<<<<<< HEAD
            <ThemeToggle />
=======

>>>>>>> 5050183b6bf0e81fef05b941bd1761f05ad1d43a

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
<<<<<<< HEAD
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
=======
              <div className="mobile-menu-panel flex flex-col items-center justify-start h-full w-full p-6 pb-8">
                <nav className="flex flex-col items-center justify-start gap-1 w-full">
                  {NAV_LINKS.map((item, i) => {
                    const isActive = activePath.startsWith(item.href) && item.href !== "/";
>>>>>>> 5050183b6bf0e81fef05b941bd1761f05ad1d43a
                    return (
                      <motion.div
                        key={item.href}
                        custom={i}
<<<<<<< HEAD
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
=======
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: i * 0.1,
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                        whileHover={{
                          scale: 1.02,
                          x: 8
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full text-start"
>>>>>>> 5050183b6bf0e81fef05b941bd1761f05ad1d43a
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            setActivePath(item.href);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
<<<<<<< HEAD
                            "flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold transition-all duration-300 rounded-2xl",
                            "border border-transparent",
                            isActive
                              ? "bg-primary/15 text-primary border-primary/30 shadow-lg shadow-primary/10"
                              : "text-foreground hover:bg-muted/80 hover:border-border/50"
                          )}
                        >
                          <span className="text-xl">{icons[item.href] || '📄'}</span>
                          <span>{item.label}</span>
=======
                            "block px-4 py-3 text-lg font-bold font-custom capitalize transition-all duration-300 rounded-lg mx-2",
                            "relative overflow-hidden",
                            "before:absolute before:inset-0 before:bg-primary/10 before:scale-x-0 before:origin-left before:transition-transform before:duration-300",
                            "hover:before:scale-x-100",
                            "after:absolute after:left-2 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-0 after:bg-primary after:transition-all after:duration-300",
                            "hover:after:h-6",
                            isActive
                              ? "text-primary before:scale-x-100 after:h-6 bg-primary/5"
                              : "dark:text-white text-foreground dark:hover:text-white/80 hover:text-foreground"
                          )}
                        >
                          <span className="relative z-10 ml-3">{item.label}</span>
                          <span className={cn(
                            "absolute left-0 bottom-0 h-0.5 bg-neutral-900 dark:bg-white transition-all duration-300 ease-in-out",
                            isActive ? "w-full" : "w-0 group-hover:w-full"
                          )}></span>
>>>>>>> 5050183b6bf0e81fef05b941bd1761f05ad1d43a
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <motion.div
<<<<<<< HEAD
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-auto pt-8 text-center"
                >
                  <p className="text-muted-foreground text-xs">
                    2020 - {new Date().getFullYear()} © bx33661
                  </p>
=======
                  custom={NAV_LINKS.length + 1}
                  className="mt-auto flex flex-col items-center gap-6"
                >
                  <Button
                    variant="ghost"
                    className="w-full max-w-sm rounded-xl border text-base py-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    关闭菜单
                  </Button>
                  <div className="flex flex-wrap items-center justify-center gap-x-2 text-center">
                    <span className="text-muted-foreground text-sm" aria-label="copyright">
                      2020 - {new Date().getFullYear()} &copy; All rights reserved.
                    </span>
                    <Separator orientation="vertical" className="hidden h-4! sm:block" />
                    <p className="text-muted-foreground text-sm" aria-label="open-source description">
                      <Link
                        href="https://github.com/bx33661/bx33661.github.io"
                        class="text-foreground"
                        external
                        underline>Open-source</Link
                      > under MIT license
                    </p>
                  </div>
>>>>>>> 5050183b6bf0e81fef05b941bd1761f05ad1d43a
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
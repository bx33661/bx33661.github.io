import { useState, useEffect, useCallback, useMemo } from 'react'
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
          'fixed left-1/2 z-30 -translate-x-1/2 transform backdrop-blur-lg',
          'bg-background/90 border-0',
          'rounded-none shadow-none transition-all duration-400 ease-in-out',
          'border border-transparent w-full',
          isScrolled && !isMobile && 'rounded-full',
          isScrolled && !isMobile && 'backdrop-blur-md',
          isScrolled && !isMobile && 'border-foreground/10',
          isScrolled && !isMobile && 'border',
          isScrolled && !isMobile && 'bg-background/80',
          isScrolled && !isMobile && 'max-w-[calc(100vw-5rem)]',
          !isMobile && 'top-2 lg:top-4 xl:top-6',
          isMobile && 'top-0',
          isMobile && 'rounded-none',
          isMobile && 'border-0',
          isMobile && 'shadow-none',
          isMobile && 'border-0'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
          <Link
            href="/"
            className="font-custom flex shrink-0 items-center gap-2 text-xl font-bold"
            aria-label="Home"
            title="Home"
            navigation="true"
          >
            <Logo className="h-8 w-8" />
            <span className={
              'transition-opacity duration-200 ease-in-out text-foreground/90 dark:text-white'}>
              {SITE.title}
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
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
                  "ml-1 h-9 w-9 rounded-full p-0 transition-colors duration-200 ease-in-out"
                }
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.header>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-20 flex flex-col items-center justify-start bg-background border-0 shadow-none"
          >
            <div className="flex flex-col items-center justify-start h-full pt-24 w-full p-6">
              <nav className="flex flex-col items-center justify-start gap-1 w-full">
                {NAV_LINKS.map((item, i) => {
                  const isActive = activePath.startsWith(item.href) && item.href !== "/";
                  return (
                    <motion.div
                      key={item.href}
                      custom={i}
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
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setActivePath(item.href);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
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
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              
              <motion.div
                custom={NAV_LINKS.length + 1}
                className="mt-auto flex flex-col items-center gap-6"
              >
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
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
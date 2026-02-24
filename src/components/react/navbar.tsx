import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from './link'
import SearchModal from './SearchModal'
import ThemeToggle from './theme-toggle'
import { NAV_LINKS, SITE } from '../../consts'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'
import { Button } from '@/components/ui/button'
import {
  Archive,
  BookText,
  House,
  Menu,
  UserRound,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'

const BXLogo = () => (
  <svg
    width="72"
    height="32"
    viewBox="0 0 72 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="BX"
    role="img"
  >
    <defs>
      <linearGradient id="bx-slash-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <linearGradient id="bx-b-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
      </linearGradient>
    </defs>

    {/* Letter B */}
    <text
      x="0"
      y="25"
      fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
      fontSize="26"
      fontWeight="800"
      letterSpacing="-1"
      fill="url(#bx-b-grad)"
      className="fill-foreground"
    >
      B
    </text>

    {/* Divider slash — the unique element */}
    <line
      x1="33"
      y1="4"
      x2="40"
      y2="28"
      stroke="url(#bx-slash-grad)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Letter X */}
    <text
      x="41"
      y="25"
      fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
      fontSize="26"
      fontWeight="800"
      letterSpacing="-1"
      fill="url(#bx-b-grad)"
      className="fill-foreground"
    >
      X
    </text>
  </svg>
)

const ICON_BY_PATH: Record<string, LucideIcon> = {
  '/': House,
  '/about/': UserRound,
  '/blog/': BookText,
  '/notes/': BookText,
  '/archive': Archive,
  '/friends/': Users,
  '/tools/': Wrench,
}

const MOBILE_DOCK_PATHS = ['/', '/blog/', '/notes/', '/archive', '/friends/']

const normalizePath = (value: string) => {
  if (!value) return '/'
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value
}

const isLinkActive = (currentPath: string, href: string) => {
  const current = normalizePath(currentPath)
  const target = normalizePath(href)
  if (target === '/') return current === '/'
  return current.startsWith(target)
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activePath, setActivePath] = useState('/')

  const dockLinks = useMemo(
    () => NAV_LINKS.filter((item) => MOBILE_DOCK_PATHS.includes(item.href)),
    [],
  )

  useEffect(() => {
    setActivePath(window.location.pathname || '/')

    const handleRouteChange = () => {
      setActivePath(window.location.pathname || '/')
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  const handleResize = useCallback(
    debounce(() => {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      if (isDesktop) {
        setMobileMenuOpen(false)
      }
    }, 100),
    [],
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
    [],
  )

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <>
      <motion.header
        aria-label="Navigation"
        role="navigation"
        initial={{ width: '100%', y: 0 }}
        animate={{
          width: isScrolled ? '70%' : '100%',
          y: 0,
        }}
        transition={{
          width: { duration: 0.3, ease: 'easeInOut' },
          layout: { duration: 0.3, ease: 'easeInOut' },
        }}
        className={cn(
          'neo-desktop-navbar hidden md:block z-30 transition-all duration-400 ease-in-out w-full fixed left-1/2 -translate-x-1/2 transform top-2 lg:top-4 xl:top-6 backdrop-blur-lg bg-background/90 border border-transparent',
          isScrolled &&
            'rounded-full backdrop-blur-md border-foreground/10 border bg-background/80 max-w-[calc(100vw-5rem)]',
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
            <BXLogo />
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            <nav
              className="hidden items-center gap-6 md:flex"
              aria-label="Main navigation"
              role="navigation"
            >
              {NAV_LINKS.map((item) => {
                const isActive = isLinkActive(activePath, item.href)
                return (
                  <motion.div
                    key={item.href}
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.95,
                      y: 0,
                    }}
                    className="relative"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 17,
                    }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'text-sm font-medium capitalize transition-all duration-300',
                        'relative py-2 px-3 rounded-lg',
                        'before:absolute before:inset-0 before:rounded-lg before:bg-primary/10 before:scale-0 before:transition-transform before:duration-300',
                        'hover:before:scale-100',
                        'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300',
                        'hover:after:w-[calc(100%-0.5rem)] hover:text-foreground',
                        'hover:shadow-lg hover:shadow-primary/20',
                        isActive
                          ? 'text-foreground after:w-[calc(100%-0.5rem)] after:bg-primary before:scale-100 shadow-md shadow-primary/20'
                          : 'text-foreground/70',
                      )}
                      onClick={() => setActivePath(item.href)}
                    >
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            <div className="hidden md:block">
              <SearchModal />
            </div>
          </div>
        </div>
      </motion.header>

      <header
        className="neo-navbar-wrap md:hidden"
        aria-label="Navigation"
        role="navigation"
      >
        <div className="neo-mobile-top">
          <Link
            href="/"
            className="font-custom flex items-center gap-2 text-base font-bold text-foreground"
            aria-label="Home"
            title="Home"
            navigation="true"
          >
            <BXLogo />
          </Link>

          <div className="flex items-center gap-2">
            <div className="neo-mobile-theme-trigger">
              <ThemeToggle />
            </div>
            <div className="neo-mobile-search-trigger">
              <SearchModal />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="h-10 w-10 rounded-xl border border-foreground/20 bg-background p-0 shadow-[3px_3px_0_0_rgba(15,23,42,0.18)]"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <nav className="neo-mobile-dock md:hidden" aria-label="Mobile navigation">
        {dockLinks.map((item) => {
          const Icon = ICON_BY_PATH[item.href] || House
          const active = isLinkActive(activePath, item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn('neo-mobile-dock-item', active && 'is-active')}
              aria-current={active ? 'page' : undefined}
              onClick={() => setActivePath(item.href)}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close mobile menu overlay"
              className="neo-mobile-overlay md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="neo-mobile-sheet md:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.26, ease: 'easeInOut' }}
            >
              <div className="neo-mobile-sheet-header">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Navigation
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close mobile menu"
                  className="h-9 w-9 rounded-lg border border-foreground/20 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="neo-mobile-sheet-links">
                {NAV_LINKS.map((item, index) => {
                  const Icon = ICON_BY_PATH[item.href] || House
                  const active = isLinkActive(activePath, item.href)
                  return (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        setActivePath(item.href)
                        setMobileMenuOpen(false)
                      }}
                      className={cn(
                        'neo-mobile-sheet-link',
                        active && 'is-active',
                      )}
                    >
                      <span className="neo-mobile-sheet-link-icon">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </motion.a>
                  )
                })}
              </div>

              <div className="neo-mobile-sheet-actions">
                <SearchModal />
                <div className="mt-2 inline-flex">
                  <ThemeToggle />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                2020 - {new Date().getFullYear()} © {SITE.title}
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar

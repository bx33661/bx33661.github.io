'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronUp } from 'lucide-react'

interface TableOfContentsItem {
    id: string
    text: string
    level: number
}

interface Props {
    headings: TableOfContentsItem[]
}

export default function TableOfContentsSidebar({ headings }: Props) {
    const [activeId, setActiveId] = useState<string>('')
    const [isVisible, setIsVisible] = useState(false)

    // Extract headings from the page if not provided
    useEffect(() => {
        if (headings.length === 0) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            {
                rootMargin: '-80px 0% -80% 0%',
                threshold: 0,
            }
        )

        headings.forEach(({ id }) => {
            const element = document.getElementById(id)
            if (element) observer.observe(element)
        })

        return () => observer.disconnect()
    }, [headings])

    // Show/hide based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToHeading = useCallback((id: string) => {
        const element = document.getElementById(id)
        if (element) {
            const yOffset = -100
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }, [])

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    if (headings.length === 0) return null

    return (
        <aside
            className={`fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden xl:block transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
                }`}
            aria-label="目录导航"
        >
            <nav className="w-56 max-h-[60vh] overflow-y-auto bg-card/80 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                    <span className="text-sm font-medium text-foreground">目录</span>
                    <button
                        onClick={scrollToTop}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="返回顶部"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </button>
                </div>

                <ul className="space-y-1">
                    {headings.map(({ id, text, level }) => (
                        <li key={id}>
                            <button
                                onClick={() => scrollToHeading(id)}
                                className={`w-full text-left text-sm py-1 px-2 rounded transition-all duration-200 line-clamp-2 ${activeId === id
                                    ? 'text-primary bg-primary/10 font-medium'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                                style={{ paddingLeft: `${(level - 2) * 12 + 8}px` }}
                            >
                                {text}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
}

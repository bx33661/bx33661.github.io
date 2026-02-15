'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import { Search, X, FileText, Tag, Calendar } from 'lucide-react'

const SEARCH_HISTORY_KEY = 'search-modal-history'
const MAX_SEARCH_HISTORY = 6

interface SearchResult {
    title: string
    description: string
    slug: string
    tags: string[]
    date: string
    content: string
}

interface SearchModalProps {
    isOpen?: boolean
    onClose?: () => void
}

export default function SearchModal({ isOpen: controlledOpen, onClose }: SearchModalProps) {
    const [isOpen, setIsOpen] = useState(controlledOpen ?? false)
    const [isMobileViewport, setIsMobileViewport] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [recentQueries, setRecentQueries] = useState<string[]>([])
    const [searchIndex, setSearchIndex] = useState<SearchResult[]>([])
    const [fuse, setFuse] = useState<Fuse<SearchResult> | null>(null)
    const [isLoadingIndex, setIsLoadingIndex] = useState(false)
    const [hasLoadedIndex, setHasLoadedIndex] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const desktopResultsRef = useRef<HTMLDivElement>(null)
    const mobileResultsRef = useRef<HTMLDivElement>(null)

    const loadRecentQueries = useCallback(() => {
        try {
            const history = localStorage.getItem(SEARCH_HISTORY_KEY)
            const parsed = history ? JSON.parse(history) : []
            if (Array.isArray(parsed)) {
                setRecentQueries(parsed.filter((item) => typeof item === 'string'))
            }
        } catch {
            setRecentQueries([])
        }
    }, [])

    const saveRecentQuery = useCallback((value: string) => {
        const normalized = value.trim()
        if (normalized.length < 2) return

        try {
            const history = localStorage.getItem(SEARCH_HISTORY_KEY)
            const parsed = history ? JSON.parse(history) : []
            const existing = Array.isArray(parsed)
                ? parsed.filter((item) => typeof item === 'string')
                : []
            const deduped = [normalized, ...existing.filter((item) => item !== normalized)].slice(0, MAX_SEARCH_HISTORY)
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(deduped))
            setRecentQueries(deduped)
        } catch {
            // Ignore localStorage failures
        }
    }, [])

    const clearRecentQueries = useCallback(() => {
        try {
            localStorage.removeItem(SEARCH_HISTORY_KEY)
            setRecentQueries([])
        } catch {
            setRecentQueries([])
        }
    }, [])

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)')
        const updateViewport = () => setIsMobileViewport(mediaQuery.matches)
        updateViewport()

        mediaQuery.addEventListener('change', updateViewport)
        return () => {
            mediaQuery.removeEventListener('change', updateViewport)
        }
    }, [])

    // 按需加载搜索索引，避免首屏额外请求
    useEffect(() => {
        if (!isOpen || hasLoadedIndex) return

        let isCancelled = false
        setIsLoadingIndex(true)

        fetch('/search.json')
            .then((res) => res.json())
            .then((data: SearchResult[]) => {
                if (isCancelled) return
                setSearchIndex(data)
                const fuseInstance = new Fuse(data, {
                    keys: [
                        { name: 'title', weight: 0.4 },
                        { name: 'description', weight: 0.3 },
                        { name: 'tags', weight: 0.2 },
                        { name: 'content', weight: 0.1 },
                    ],
                    threshold: 0.3,
                    includeMatches: true,
                    minMatchCharLength: 2,
                })
                setFuse(fuseInstance)
                setHasLoadedIndex(true)
            })
            .catch(console.error)
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingIndex(false)
                }
            })

        return () => {
            isCancelled = true
        }
    }, [isOpen, hasLoadedIndex])

    useEffect(() => {
        if (!isOpen) return
        loadRecentQueries()
    }, [isOpen, loadRecentQueries])

    // Keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }
            if (e.key === 'Escape') {
                handleClose()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [isOpen])

    // Sync with controlled state
    useEffect(() => {
        if (controlledOpen !== undefined) {
            setIsOpen(controlledOpen)
        }
    }, [controlledOpen])

    const handleClose = useCallback(() => {
        saveRecentQuery(query)
        setIsOpen(false)
        setQuery('')
        setResults([])
        setSelectedIndex(0)
        onClose?.()
    }, [onClose, query, saveRecentQuery])

    const handleSearch = useCallback(
        (searchQuery: string) => {
            setQuery(searchQuery)
            if (!fuse || searchQuery.length < 2) {
                setResults([])
                return
            }
            const searchResults = fuse.search(searchQuery).slice(0, 8)
            setResults(searchResults.map((r) => r.item))
            setSelectedIndex(0)
        },
        [fuse]
    )

    const handleKeyNavigation = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            saveRecentQuery(query)
            window.location.href = `/blog/${results[selectedIndex].slug}`
        }
    }

    const applyRecentQuery = useCallback((value: string) => {
        setQuery(value)
        handleSearch(value)
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [handleSearch])

    // Scroll selected item into view
    useEffect(() => {
        const currentResultsRef = isMobileViewport ? mobileResultsRef : desktopResultsRef
        if (currentResultsRef.current) {
            const selectedEl = currentResultsRef.current.children[selectedIndex] as HTMLElement
            selectedEl?.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex, isMobileViewport])

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg border border-border/50 hover:bg-secondary hover:border-border transition-all"
                aria-label="搜索文章"
            >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">搜索...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-muted rounded">
                    <span>⌘</span>K
                </kbd>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm hidden md:block" onClick={handleClose} />

            <div className="relative hidden md:flex items-start justify-center pt-[15vh] px-4">
                <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={handleKeyNavigation}
                            placeholder="搜索文章..."
                            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                        />
                        <button
                            onClick={handleClose}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="关闭搜索"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div ref={desktopResultsRef} className="max-h-[60vh] overflow-y-auto">
                        {results.length > 0 ? (
                            <ul className="divide-y divide-border">
                                {results.map((result, index) => (
                                    <li key={result.slug}>
                                        <a
                                            href={`/blog/${result.slug}`}
                                            className={`flex flex-col gap-1 px-4 py-3 transition-colors ${index === selectedIndex
                                                    ? 'bg-primary/10'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                                <span className="font-medium text-foreground line-clamp-1">
                                                    {result.title}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1 pl-6">
                                                {result.description}
                                            </p>
                                            <div className="flex items-center gap-3 pl-6 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(result.date).toLocaleDateString('zh-CN')}
                                                </span>
                                                {result.tags.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        {result.tags.slice(0, 2).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : isLoadingIndex ? (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                <p>正在加载搜索索引...</p>
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                <p>未找到相关文章</p>
                                <p className="text-sm mt-1">尝试其他关键词</p>
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                <p>输入关键词开始搜索</p>
                                <p className="text-sm mt-1">使用 ↑↓ 导航，Enter 确认</p>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                        <span>按 ESC 关闭</span>
                        <span>{searchIndex.length} 篇文章</span>
                    </div>
                </div>
            </div>

            <div className="md:hidden absolute inset-0 bg-background">
                <div className="h-full flex flex-col">
                    <div className="pt-[max(env(safe-area-inset-top),0.5rem)] px-4 pb-3 border-b border-border bg-background/96 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={handleClose}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
                                aria-label="关闭搜索"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <p className="text-sm font-semibold tracking-wide text-muted-foreground">站内搜索</p>
                            <span className="ml-auto text-xs text-muted-foreground">{searchIndex.length} 篇</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={handleKeyNavigation}
                                placeholder="搜索标题、标签、摘要..."
                                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                            />
                            {query.length > 0 && (
                                <button
                                    onClick={() => {
                                        setQuery('')
                                        setResults([])
                                        setSelectedIndex(0)
                                        inputRef.current?.focus()
                                    }}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    aria-label="清除输入"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div ref={mobileResultsRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                        {results.length > 0 ? (
                            <ul className="space-y-2">
                                {results.map((result, index) => (
                                    <li key={result.slug}>
                                        <a
                                            href={`/blog/${result.slug}`}
                                            onClick={() => saveRecentQuery(query)}
                                            className={`block rounded-xl border px-3 py-3 transition-colors ${index === selectedIndex
                                                    ? 'border-primary/60 bg-primary/10'
                                                    : 'border-border bg-card'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                                <span className="font-medium text-foreground line-clamp-2">
                                                    {result.title}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {result.description}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(result.date).toLocaleDateString('zh-CN')}
                                                </span>
                                                {result.tags.length > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        {result.tags.slice(0, 2).join(' / ')}
                                                    </span>
                                                )}
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : isLoadingIndex ? (
                            <div className="px-4 py-12 text-center text-muted-foreground">
                                <p>正在加载搜索索引...</p>
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="px-4 py-12 text-center text-muted-foreground">
                                <p>未找到相关文章</p>
                                <p className="text-sm mt-1">尝试换一个关键词</p>
                            </div>
                        ) : (
                            <div className="px-1 py-8 text-muted-foreground">
                                <p className="text-center">输入关键词开始搜索</p>
                                <p className="text-center text-sm mt-1">支持标题、描述、标签和正文内容</p>
                                {recentQueries.length > 0 && (
                                    <div className="mt-5 rounded-xl border border-border bg-card p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-medium tracking-wide">最近搜索</p>
                                            <button
                                                onClick={clearRecentQueries}
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                                aria-label="清除最近搜索"
                                            >
                                                清除
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentQueries.map((item) => (
                                                <button
                                                    key={item}
                                                    onClick={() => applyRecentQuery(item)}
                                                    className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

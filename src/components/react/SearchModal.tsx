'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import { Search, X, FileText, Tag, Calendar } from 'lucide-react'

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
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [searchIndex, setSearchIndex] = useState<SearchResult[]>([])
    const [fuse, setFuse] = useState<Fuse<SearchResult> | null>(null)
    const [isLoadingIndex, setIsLoadingIndex] = useState(false)
    const [hasLoadedIndex, setHasLoadedIndex] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const resultsRef = useRef<HTMLDivElement>(null)

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

    // Sync with controlled state
    useEffect(() => {
        if (controlledOpen !== undefined) {
            setIsOpen(controlledOpen)
        }
    }, [controlledOpen])

    const handleClose = useCallback(() => {
        setIsOpen(false)
        setQuery('')
        setResults([])
        setSelectedIndex(0)
        onClose?.()
    }, [onClose])

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
            window.location.href = `/blog/${results[selectedIndex].slug}`
        }
    }

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const selectedEl = resultsRef.current.children[selectedIndex] as HTMLElement
            selectedEl?.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

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
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative flex items-start justify-center pt-[15vh] px-4">
                <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
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

                    {/* Results */}
                    <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
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

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                        <span>按 ESC 关闭</span>
                        <span>{searchIndex.length} 篇文章</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

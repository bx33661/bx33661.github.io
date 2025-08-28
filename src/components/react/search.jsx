import Fuse from 'fuse.js'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import BlogCardJSX from './blog-card'
import debounce from 'lodash.debounce'
import { Search as SearchIcon, X, Filter, Clock, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

const searchOptions = {
  keys: [
    { name: 'data.title', weight: 0.4 },
    { name: 'data.description', weight: 0.3 },
    { name: 'data.tags', weight: 0.2 },
    { name: 'body', weight: 0.1 }
  ],
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  threshold: 0.4,
  distance: 100,
  sortFn: (a, b) => a.score - b.score,
}

// 搜索历史管理
const SEARCH_HISTORY_KEY = 'blog-search-history'
const MAX_HISTORY = 10

function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

function saveSearchQuery(query) {
  if (!query || query.length < 2) return
  
  try {
    const history = getSearchHistory()
    const filtered = history.filter(item => item !== query)
    const newHistory = [query, ...filtered].slice(0, MAX_HISTORY)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
  } catch {
    // 静默处理存储错误
  }
}

function Search({ searchList, initialPosts }) {
  const [query, setQuery] = useState('')
  const [filteredPosts, setFilteredPosts] = useState(initialPosts)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTags, setSelectedTags] = useState(new Set())
  const [sortBy, setSortBy] = useState('relevance') // relevance, date, title
  const [searchHistory, setSearchHistory] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchStats, setSearchStats] = useState({ total: 0, time: 0 })
  const searchInputRef = useRef(null)

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set()
    searchList.forEach(post => {
      if (post.data.tags) {
        post.data.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [searchList])

  // 初始化搜索历史
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // 预处理搜索列表
  const processedSearchList = useMemo(
    () =>
      searchList.map((item) => ({
        ...item,
        searchableContent: {
          title: item.data.title.toLowerCase(),
          description: item.data.description?.toLowerCase() || '',
          tags: item.data.tags?.map(tag => tag.toLowerCase()) || [],
          body: item.body?.toLowerCase() || ''
        }
      })),
    [searchList]
  )

  const fuse = useMemo(
    () => new Fuse(processedSearchList, searchOptions),
    [processedSearchList]
  )

  // 执行搜索
  const performSearch = useCallback(
    (searchQuery, tagFilter = selectedTags) => {
      const startTime = performance.now()
      setIsSearching(true)

      try {
        let results = []

        if (searchQuery && searchQuery.length > 1) {
          // 使用 Fuse.js 进行模糊搜索
          const fuseResults = fuse.search(searchQuery.toLowerCase())
          results = fuseResults.map(result => ({
            ...result.item,
            _score: result.score,
            _matches: result.matches
          }))
        } else {
          // 没有搜索词时显示所有文章
          results = processedSearchList
        }

        // 按标签过滤
        if (tagFilter.size > 0) {
          results = results.filter(post =>
            post.data.tags?.some(tag => tagFilter.has(tag))
          )
        }

        // 排序
        switch (sortBy) {
          case 'date':
            results.sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
            break
          case 'title':
            results.sort((a, b) => a.data.title.localeCompare(b.data.title))
            break
          case 'relevance':
          default:
            // 已经按相关性排序
            break
        }

        const endTime = performance.now()
        setSearchStats({
          total: results.length,
          time: Math.round(endTime - startTime)
        })

        setFilteredPosts(results)

        // 保存搜索历史
        if (searchQuery && searchQuery.length >= 2) {
          saveSearchQuery(searchQuery)
          setSearchHistory(getSearchHistory())
        }
      } catch (error) {
        console.error('搜索出错:', error)
        setFilteredPosts(initialPosts)
      } finally {
        setIsSearching(false)
      }
    },
    [fuse, processedSearchList, initialPosts, sortBy, selectedTags]
  )

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      performSearch(searchQuery)
    }, 300),
    [performSearch]
  )

  const handleInputChange = (event) => {
    const searchQuery = event.target.value
    setQuery(searchQuery)
    
    if (searchQuery.length >= 2) {
      setIsSearching(true)
    }
    
    debouncedSearch(searchQuery)
  }

  // 处理标签过滤
  const toggleTag = (tag) => {
    const newSelectedTags = new Set(selectedTags)
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag)
    } else {
      newSelectedTags.add(tag)
    }
    setSelectedTags(newSelectedTags)
    performSearch(query, newSelectedTags)
  }

  // 清除搜索
  const clearSearch = () => {
    setQuery('')
    setSelectedTags(new Set())
    setFilteredPosts(initialPosts)
    setSearchStats({ total: 0, time: 0 })
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  // 使用搜索历史
  const useHistoryQuery = (historyQuery) => {
    setQuery(historyQuery)
    performSearch(historyQuery)
    setShowSuggestions(false)
  }

  return (
    <div className="w-full space-y-6">
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            className="w-full pl-10 pr-10 mobile-search"
            placeholder="搜索文章标题、描述、标签或内容..."
            type="search"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            aria-label="搜索博客文章"
          />
          
          {/* 清除按钮 */}
          <AnimatePresence>
            {(query || selectedTags.size > 0) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="清除搜索"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* 加载指示器 */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* 搜索建议 */}
        <AnimatePresence>
          {showSuggestions && searchHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>搜索历史</span>
                </div>
                {searchHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => useHistoryQuery(historyQuery)}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors"
                  >
                    {historyQuery}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 过滤器和排序 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 标签过滤 */}
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 8).map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.has(tag) ? "default" : "outline"}
              className="cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => toggleTag(tag)}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              performSearch(query)
            }}
            className="text-sm border rounded px-2 py-1 bg-background"
          >
            <option value="relevance">相关性</option>
            <option value="date">发布时间</option>
            <option value="title">标题</option>
          </select>
        </div>
      </div>

      {/* 搜索统计 */}
      {(query || selectedTags.size > 0) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            找到 <strong>{searchStats.total}</strong> 篇文章
            {searchStats.time > 0 && ` (用时 ${searchStats.time}ms)`}
          </span>
          {selectedTags.size > 0 && (
            <span className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              已选择 {selectedTags.size} 个标签
            </span>
          )}
        </div>
      )}
      
      {/* 搜索结果 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${query}-${Array.from(selectedTags).join(',')}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filteredPosts.length === 0 && (query.length > 2 || selectedTags.size > 0) ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground text-lg mb-2">
                没有找到匹配的文章
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                尝试使用不同的关键词或清除筛选条件
              </p>
              <Button onClick={clearSearch} variant="outline">
                清除所有筛选
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post, index) => (
                <BlogCardJSX 
                  key={post.id} 
                  entry={post} 
                  slug={post.slug} 
                  index={index}
                  priority={index < 3}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Search

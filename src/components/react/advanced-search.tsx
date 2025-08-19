import React, { useState, useMemo, useCallback } from 'react'
import Fuse from 'fuse.js'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Search, X, Filter, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import debounce from 'lodash.debounce'

interface SearchItem {
  id: string
  title: string
  description: string
  content: string
  tags: string[]
  date: Date
  type: 'blog' | 'project'
  slug?: string
  url: string
}

interface AdvancedSearchProps {
  items: SearchItem[]
  placeholder?: string
  className?: string
  onResultClick?: (item: SearchItem) => void
}

const AdvancedSearch = ({ 
  items, 
  placeholder = "搜索文章、项目...", 
  className,
  onResultClick 
}: AdvancedSearchProps) => {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<'all' | 'blog' | 'project'>('all')

  // 配置 Fuse.js 搜索选项
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'content', weight: 0.2 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  }

  const fuse = useMemo(() => new Fuse(items, fuseOptions), [items])

  // 获取所有可用标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [items])

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      setQuery(searchQuery)
    }, 300),
    []
  )

  // 搜索结果
  const searchResults = useMemo(() => {
    let results = items

    // 类型过滤
    if (selectedType !== 'all') {
      results = results.filter(item => item.type === selectedType)
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      results = results.filter(item => 
        selectedTags.every(tag => item.tags.includes(tag))
      )
    }

    // 文本搜索
    if (query.trim()) {
      const fuseResults = fuse.search(query.trim())
      const searchedIds = new Set(fuseResults.map(result => result.item.id))
      results = results.filter(item => searchedIds.has(item.id))
      
      // 按搜索相关性排序
      results.sort((a, b) => {
        const aResult = fuseResults.find(r => r.item.id === a.id)
        const bResult = fuseResults.find(r => r.item.id === b.id)
        return (aResult?.score || 1) - (bResult?.score || 1)
      })
    } else {
      // 按日期排序
      results.sort((a, b) => b.date.getTime() - a.date.getTime())
    }

    return results
  }, [items, fuse, query, selectedTags, selectedType])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedTags([])
    setSelectedType('all')
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* 搜索栏 */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-20"
            onChange={(e) => debouncedSearch(e.target.value)}
            aria-label="搜索内容"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="打开筛选器"
              aria-expanded={isFilterOpen}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {(query || selectedTags.length > 0 || selectedType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                aria-label="清除所有筛选条件"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 筛选器面板 */}
        {isFilterOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-background border rounded-lg shadow-lg z-50">
            {/* 类型筛选 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">内容类型</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'blog', label: '博客' },
                  { value: 'project', label: '项目' }
                ].map(type => (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type.value as any)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Tag className="inline-block w-4 h-4 mr-1" />
                标签筛选
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 已选筛选条件 */}
            {selectedTags.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-2">已选标签:</span>
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="default"
                      className="text-xs"
                    >
                      {tag}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => handleTagToggle(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 搜索结果统计 */}
      <div className="mb-4 text-sm text-muted-foreground">
        找到 {searchResults.length} 个结果
        {query && ` (搜索 "${query}")`}
      </div>

      {/* 搜索结果 */}
      <div className="space-y-4">
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">未找到匹配结果</h3>
            <p className="text-muted-foreground">
              尝试使用不同的关键词或调整筛选条件
            </p>
          </div>
        ) : (
          searchResults.map(item => (
            <div
              key={item.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onResultClick?.(item)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 
                  className="text-lg font-medium text-foreground line-clamp-1"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightText(item.title, query) 
                  }}
                />
                <Badge variant="outline" className="shrink-0 ml-2">
                  {item.type === 'blog' ? '博客' : '项目'}
                </Badge>
              </div>
              
              <p 
                className="text-muted-foreground text-sm mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: highlightText(item.description, query) 
                }}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {item.date.toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdvancedSearch
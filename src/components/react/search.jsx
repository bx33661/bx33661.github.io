import Fuse from 'fuse.js'
import { useState, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import BlogCardJSX from './blog-card'
import debounce from 'lodash.debounce'

const options = {
  keys: ['data.title', 'data.description', 'data.tags'],
  includeMatches: true,
  minMatchCharLength: 3,
  threshold: 0.3,
  distance: 100,
  sortFn: (a, b) => a.score - b.score,
}

function Search({ searchList, initialPosts }) {
  const [query, setQuery] = useState('')
  const [filteredPosts, setFilteredPosts] = useState(initialPosts)
  const [isSearching, setIsSearching] = useState(false)

  const processedSearchList = useMemo(
    () =>
      searchList.map((item) => ({
        ...item,
        data: {
          ...item.data,
          title: item.data.title.toLowerCase(),
          description: item.data.description.toLowerCase(),
          tags: item.data.tags.map((tag) => tag.toLowerCase()),
        },
      })),
    [searchList],
  )

  const fuse = useMemo(
    () => new Fuse(processedSearchList, options),
    [processedSearchList],
  )

  const handleOnSearch = useCallback(
    debounce((searchQuery) => {
      setIsSearching(true)
      try {
        if (searchQuery.length > 2) {
          const results = fuse
            .search(searchQuery.toLowerCase())
            .map((result) => result.item)
          setFilteredPosts(results)
        } else {
          setFilteredPosts(initialPosts)
        }
      } catch (error) {
        // 优雅处理搜索错误
        setFilteredPosts(initialPosts)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [fuse, initialPosts],
  )

  const handleInputChange = (event) => {
    const searchQuery = event.target.value
    setQuery(searchQuery)
    
    if (searchQuery.length > 2) {
      setIsSearching(true)
    }
    
    handleOnSearch(searchQuery)
  }

  return (
    <div className="w-full">
      <div className="relative">
        <Input
          className="w-full pr-10"
          placeholder="搜索文章标题、描述或标签..."
          type="search"
          value={query}
          onChange={handleInputChange}
          aria-label="搜索博客文章"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        {filteredPosts.length === 0 && query.length > 2 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              没有找到匹配 "{query}" 的文章
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              尝试使用不同的关键词或标签
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <BlogCardJSX key={post.id} entry={post} slug={post.slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Search

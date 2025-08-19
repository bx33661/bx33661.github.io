import { Badge } from '@/components/ui/badge'
import { Hash, Calendar, Clock, Eye } from 'lucide-react'
import type { CollectionEntry } from 'astro:content'
import { motion } from 'framer-motion'
import { useState, memo } from 'react'
import { cn } from '@/lib/utils'

interface BlogCardProps {
  entry: CollectionEntry<'blog'>
  slug: string
  index?: number
  priority?: boolean
}

const BlogCardJSX = memo(({ entry, slug, index = 0, priority = false }: BlogCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  // 估算阅读时间（基于字数）
  const estimatedReadTime = Math.ceil((entry.body?.length || 0) / 1000 * 2) || 3

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: priority ? 0 : index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
        "bg-card/50 backdrop-blur-sm"
      )}
    >
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <article className="relative p-4 sm:p-6">
        <a
          href={`/blog/${slug}`}
          className="flex flex-col gap-4"
          aria-label={`阅读文章: ${entry.data.title}`}
        >
          {/* 文章元信息 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <time dateTime={entry.data.date.toISOString()}>
                {formatDate(entry.data.date)}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{estimatedReadTime} 分钟读完</span>
            </div>
            {entry.data.featured && (
              <Badge variant="default" className="text-xs px-2 py-0.5">
                精选
              </Badge>
            )}
          </div>

          {/* 文章标题 */}
          <div className="space-y-2">
            <h3 className={cn(
              "font-semibold leading-tight transition-colors duration-200",
              "group-hover:text-primary",
              "text-base sm:text-lg lg:text-xl"
            )}>
              {entry.data.title}
            </h3>
            
            {/* 文章描述 */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-2">
              {entry.data.description}
            </p>
          </div>

          {/* 标签和互动元素 */}
          <div className="flex items-center justify-between">
            {/* 标签 */}
            {entry.data.tags && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {entry.data.tags.slice(0, 3).map((tag, tagIndex) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (index * 0.1) + (tagIndex * 0.05) }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 transition-all duration-200",
                        "hover:bg-primary/10 hover:text-primary cursor-pointer"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/tags/${tag}`
                      }}
                    >
                      <Hash className="w-2.5 h-2.5" />
                      {tag}
                    </Badge>
                  </motion.div>
                ))}
                {entry.data.tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 opacity-60"
                  >
                    +{entry.data.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* 阅读指示器 */}
            <motion.div
              className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={isHovered ? { x: 0 } : { x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <Eye className="w-3 h-3" />
              <span>阅读更多</span>
            </motion.div>
          </div>

          {/* 悬停时的动画效果 */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: isHovered ? '100%' : '0%' }}
            transition={{ duration: 0.3 }}
          />
        </a>
      </article>

      {/* 特色文章标记 */}
      {entry.data.featured && (
        <div className="absolute top-3 right-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className="w-2 h-2 bg-primary rounded-full"
          />
        </div>
      )}
    </motion.div>
  )
})

BlogCardJSX.displayName = 'BlogCard'

export default BlogCardJSX

import { memo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Hash, Calendar, Clock, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SearchCardEntry {
  id: string
  body?: string
  data: {
    title: string
    description: string
    date: Date | string
    tags?: string[]
    featured?: boolean
  }
}

interface BlogCardProps {
  entry: SearchCardEntry
  slug: string
  index?: number
  priority?: boolean
  basePath?: string
  tagLinkBase?: string | null
}

const normalizeBasePath = (basePath: string): string => {
  const trimmed = basePath.trim()
  if (!trimmed) return '/blog'
  if (trimmed === '/') return ''
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

const BlogCardJSX = memo(
  ({
    entry,
    slug,
    index = 0,
    priority = false,
    basePath = '/blog',
    tagLinkBase = '/tags',
  }: BlogCardProps) => {
    const [isHovered, setIsHovered] = useState(false)

    const estimatedReadTime = Math.ceil(((entry.body?.length ?? 0) / 1000) * 2) || 3
    const normalizedBasePath = normalizeBasePath(basePath)
    const articleHref = `${normalizedBasePath}/${slug}`

    const formatDate = (date: Date | string) =>
      new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date))

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: priority ? 0 : index * 0.1,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'neo-post-card group relative overflow-hidden rounded-xl border transition-all duration-300 ease-out',
          'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20',
          'bg-card/50 backdrop-blur-sm',
          'dark:bg-gradient-to-br dark:from-card dark:to-background/50',
          'dark:border-border/30 dark:hover:border-primary/50',
          'dark:hover:shadow-2xl dark:hover:shadow-primary/20',
          'touch-manipulation',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'bg-gradient-to-br from-primary/5 to-transparent',
            'dark:from-primary/20 dark:via-primary/10 dark:to-accent/10',
          )}
        />

        <article className="relative p-4 sm:p-6">
          <a
            href={articleHref}
            className="flex min-h-[164px] flex-col gap-3.5 sm:gap-4"
            aria-label={`阅读文章: ${entry.data.title}`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <time dateTime={new Date(entry.data.date).toISOString()}>
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

            <div className="space-y-2">
              <h3
                className={cn(
                  'font-semibold leading-tight transition-colors duration-200',
                  'group-hover:text-primary',
                  'text-base sm:text-lg lg:text-xl',
                  'dark:text-foreground dark:group-hover:text-primary',
                  'dark:group-hover:drop-shadow-[0_0_8px_rgba(100,255,100,0.5)]',
                )}
              >
                {entry.data.title}
              </h3>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-2 dark:text-muted-foreground/90 dark:group-hover:text-accent-foreground/80">
                {entry.data.description}
              </p>
            </div>

            <div className="flex items-start justify-between gap-2">
              {entry.data.tags && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {entry.data.tags.slice(0, 3).map((tag, tagIndex) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + tagIndex * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          'flex items-center gap-1 text-xs px-2 py-1 transition-all duration-200',
                          tagLinkBase && 'hover:bg-primary/10 hover:text-primary cursor-pointer',
                        )}
                        onClick={
                          tagLinkBase
                            ? (e) => {
                                e.preventDefault()
                                window.location.href = `${normalizeBasePath(tagLinkBase)}/${encodeURIComponent(tag)}`
                              }
                            : undefined
                        }
                      >
                        <Hash className="w-2.5 h-2.5" />
                        {tag}
                      </Badge>
                    </motion.div>
                  ))}
                  {entry.data.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 opacity-60">
                      +{entry.data.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
                <Eye className="w-3 h-3" />
                <span>阅读更多</span>
              </div>
            </div>

            <motion.div
              className={cn(
                'absolute bottom-0 left-0 h-0.5',
                'bg-primary dark:bg-primary dark:shadow-lg dark:shadow-primary/50',
              )}
              initial={{ width: 0 }}
              animate={{ width: isHovered ? '100%' : '0%' }}
              transition={{ duration: 0.3 }}
            />
          </a>
        </article>

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
  },
)

BlogCardJSX.displayName = 'BlogCard'

export default BlogCardJSX

import { Badge } from '@/components/ui/badge'
import { Hash } from 'lucide-react'
import type { CollectionEntry } from 'astro:content'

interface BlogCardProps {
  entry: CollectionEntry<'blog'>
  slug: string // 添加slug参数
}

const BlogCardJSX = ({ entry, slug }: BlogCardProps) => {
  return (
    <div className="hover:bg-secondary/50 rounded-xl border p-4 transition-colors duration-300 ease-in-out touch-feedback mobile-card">
      <a
        href={`/blog/${slug}`}
        className="flex flex-col gap-3 sm:flex-row sm:gap-4 touch-target"
      >
        <div className="grow">
          <h3 className="mb-2 text-base font-medium leading-tight sm:mb-1 sm:text-lg">{entry.data.title}</h3>
          <p className="text-muted-foreground mb-3 text-sm leading-relaxed line-clamp-2 sm:mb-2">
            {entry.data.description}
          </p>

          {entry.data.tags && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {entry.data.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-x-1 text-xs px-2 py-1 sm:text-sm"
                >
                  <Hash size={10} className="sm:w-3 sm:h-3" />
                  {tag}
                </Badge>
              ))}
              {entry.data.tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 sm:text-sm"
                >
                  +{entry.data.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </a>
    </div>
  )
}

export default BlogCardJSX

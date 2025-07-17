import { Badge } from '@/components/ui/badge'
import { Hash } from 'lucide-react'
import type { CollectionEntry } from 'astro:content'

const BlogCardJSX = ({ entry }: { entry: CollectionEntry<'blog'> }) => {
  return (
    <div className="hover:bg-secondary/50 rounded-xl border p-4 transition-colors duration-300 ease-in-out">
      <a
        href={`/${entry.collection}/${entry.id}`}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <div className="grow">
          <h3 className="mb-1 text-lg font-medium">{entry.data.title}</h3>
          <p className="text-muted-foreground mb-2 text-sm">
            {entry.data.description}
          </p>

          {entry.data.tags && (
            <div className="flex flex-wrap gap-2">
              {entry.data.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-x-1"
                >
                  <Hash size={12} />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </a>
    </div>
  )
}

export default BlogCardJSX

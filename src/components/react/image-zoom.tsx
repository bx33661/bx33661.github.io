import { useState, useEffect } from 'react'
import { X, ZoomIn, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageZoomProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}

export function ImageZoom({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes
}: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {/* 缩略图 */}
      <div 
        className={cn(
          'group relative cursor-zoom-in overflow-hidden rounded-lg',
          'transition-all duration-300 hover:shadow-lg',
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        {isLoading && (
          <div 
            className="absolute inset-0 bg-muted animate-pulse rounded-lg"
            style={{ width, height }}
          />
        )}
        
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding="async"
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-all duration-300 group-hover:scale-105',
            isLoading ? 'opacity-0' : 'opacity-100',
            error && 'opacity-50'
          )}
        />
        
        {/* 放大图标覆盖层 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">图片加载失败</span>
          </div>
        )}
      </div>

      {/* 模态框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            aria-label="关闭"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 下载按钮 */}
          <button
            className="absolute top-4 right-16 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
            aria-label="下载图片"
          >
            <Download className="w-6 h-6" />
          </button>

          {/* 大图 */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-contain"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
            
            {/* 图片信息 */}
            {alt && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
                <p className="text-sm">{alt}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default ImageZoom
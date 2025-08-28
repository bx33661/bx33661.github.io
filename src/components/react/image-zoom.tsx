import { useState, useEffect, useCallback, memo } from 'react'
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
  loading?: 'lazy' | 'eager'
}

export const ImageZoom = memo(function ImageZoom({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  loading = 'lazy'
}: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  // 优化的键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  // 图片预加载
  useEffect(() => {
    if (priority && src) {
      const img = new Image()
      img.src = src
      img.onload = () => setIsLoading(false)
      img.onerror = () => {
        setIsLoading(false)
        setError(true)
      }
    }
  }, [src, priority])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setError(true)
  }, [])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [src, alt])

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <>
      {/* 缩略图 */}
      <div 
        className={cn(
          'group relative cursor-zoom-in overflow-hidden rounded-lg',
          'transition-all duration-300 hover:shadow-lg',
          'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
          className
        )}
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openModal()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`查看大图: ${alt}`}
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
          loading={priority ? "eager" : loading}
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
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={(e) => {
              e.stopPropagation()
              closeModal()
            }}
            aria-label="关闭"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 下载按钮 */}
          <button
            className="absolute top-4 right-16 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
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
              id="image-modal-title"
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
})

export default ImageZoom
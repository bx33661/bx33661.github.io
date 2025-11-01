import { useState, useEffect, useCallback, memo, useRef } from 'react'
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
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const preloadedRef = useRef(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false)
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

  // 统一的图片加载处理
  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setError(true)
  }, [])

  // 预加载处理：避免重复加载
  useEffect(() => {
    if (priority && src && !preloadedRef.current) {
      preloadedRef.current = true
      const img = new Image()
      img.src = src
      img.onload = handleImageLoad
      img.onerror = handleError
    }
  }, [src, priority, handleImageLoad, handleError])

  // 水合后检查：如果水合前已加载完成
  useEffect(() => {
    const el = imgRef.current
    if (el && (el.complete || el.naturalWidth > 0)) {
      setIsLoading(false)
      setIsLoaded(true)
    }
  }, [src])

  const handleLoad = useCallback(() => {
    handleImageLoad()
  }, [handleImageLoad])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [src, alt])

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

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
        {/* 占位符骨架屏 */}
        {isLoading && (
          <div
            className="absolute inset-0 bg-muted/80 animate-pulse rounded-lg pointer-events-none z-10"
            style={{ aspectRatio: width && height ? `${width}/${height}` : '1/1' }}
          />
        )}

        {/* 图片容器 - 使用绝对定位确保布局稳定 */}
        <div className="relative w-full" style={{ aspectRatio: width && height ? `${width}/${height}` : '1/1' }}>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : loading}
            fetchPriority={priority ? 'high' : 'low'}
            decoding="async"
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            ref={imgRef}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              // 优化过渡效果：只在已加载状态下应用变化
              'transition-opacity duration-500 ease-out',
              'transition-transform duration-300 ease-out group-hover:scale-105',
              // 避免使用 blur，改用 opacity 实现更平滑的过渡
              isLoaded ? 'opacity-100' : 'opacity-0',
              error && 'opacity-50'
            )}
            style={{
              // 确保图片加载前不占位
              visibility: isLoaded ? 'visible' : 'hidden'
            }}
          />
        </div>

        {/* 放大图标覆盖层 - 只在图片加载完成后显示 */}
        {isLoaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center pointer-events-none">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* 错误状态显示 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
            <span className="text-xs text-muted-foreground">图片加载失败</span>
          </div>
        )}
      </div>

      {/* 模态框 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white hover:scale-110"
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
            className="absolute top-4 right-16 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white hover:scale-110"
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
            aria-label="下载图片"
          >
            <Download className="w-6 h-6" />
          </button>

          {/* 大图容器 */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-lg animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              id="image-modal-title"
              className="w-full h-full object-contain transition-opacity duration-300"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              // 预加载模态框图片以避免闪烁
              loading="eager"
              decoding="sync"
            />

            {/* 图片信息 */}
            {alt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 animate-in slide-in-from-bottom duration-300">
                <p className="text-sm font-medium">{alt}</p>
              </div>
            )}
          </div>

          {/* 图片加载指示器 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      )}
    </>
  )
})

export default ImageZoom
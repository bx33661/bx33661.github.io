import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import ImageZoom from '../react/image-zoom'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  webpSrc?: string
  enableZoom?: boolean
  lazy?: boolean
}

function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  webpSrc,
  enableZoom = false,
  lazy = true
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [inView, setInView] = useState(!lazy || priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // 提前50px开始加载
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, inView])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  // 如果没有提供webpSrc，尝试自动生成
  const autoWebpSrc = webpSrc || src.replace(/\.(jpg|jpeg|png)$/i, '.webp')

  // 如果启用了缩放功能，使用ImageZoom组件
  if (enableZoom) {
    return (
      <ImageZoom
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        sizes={sizes}
      />
    )
  }

  return (
    <div ref={imgRef} className={cn("relative", className)}>
      {/* 占位符 */}
      {(isLoading || !inView) && (
        <div 
          className="bg-muted animate-pulse rounded-md"
          style={{ width, height, aspectRatio: width && height ? `${width}/${height}` : undefined }}
        />
      )}
      
      {/* 只有在视图中时才渲染图片 */}
      {inView && (
        <picture>
          {/* WebP格式优先 */}
          <source 
            srcSet={autoWebpSrc} 
            type="image/webp"
            sizes={sizes}
          />
          
          {/* 原始格式后备 */}
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
              "transition-opacity duration-300 rounded-md",
              isLoading ? "opacity-0" : "opacity-100",
              error && "opacity-50"
            )}
          />
        </picture>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md">
          <span className="text-xs text-muted-foreground">图片加载失败</span>
        </div>
      )}
    </div>
  )
}

export default OptimizedImage
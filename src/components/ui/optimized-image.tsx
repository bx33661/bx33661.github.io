import { cn } from "@/lib/utils"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  webpSrc?: string
}

function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  webpSrc
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError(true)
  }

  // 如果没有提供webpSrc，尝试自动生成
  const autoWebpSrc = webpSrc || src.replace(/\.(jpg|jpeg|png)$/i, '.webp')

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse rounded-md"
          style={{ width, height }}
        />
      )}
      
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
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            error && "opacity-50",
            className
          )}
        />
      </picture>
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md">
          <span className="text-xs text-muted-foreground">图片加载失败</span>
        </div>
      )}
    </div>
  )
}

export default OptimizedImage 
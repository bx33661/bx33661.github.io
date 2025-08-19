import { lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'

// 懒加载搜索组件
const LazySearch = lazy(() => import('./search'))

// 懒加载图片缩放组件
const LazyImageZoom = lazy(() => import('./image-zoom'))

// 懒加载高级搜索组件
const LazyAdvancedSearch = lazy(() => import('./advanced-search'))

// 加载占位符组件
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )
}

// 搜索组件的懒加载包装器
export function SearchWrapper(props: any) {
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-[200px]" />}>
      <LazySearch {...props} />
    </Suspense>
  )
}

// 图片缩放组件的懒加载包装器
export function ImageZoomWrapper(props: any) {
  return (
    <Suspense fallback={
      <div className={cn('bg-muted animate-pulse rounded-lg', props.className)} 
           style={{ width: props.width, height: props.height }} />
    }>
      <LazyImageZoom {...props} />
    </Suspense>
  )
}

// 高级搜索组件的懒加载包装器
export function AdvancedSearchWrapper(props: any) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyAdvancedSearch {...props} />
    </Suspense>
  )
}

export default {
  SearchWrapper,
  ImageZoomWrapper,
  AdvancedSearchWrapper,
}
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// 骨架屏组件
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'shimmer';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 w-full rounded';
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-wave';
      default:
        return 'animate-shimmer';
    }
  };

  return (
    <motion.div
      className={cn(
        'bg-muted relative overflow-hidden',
        getVariantClasses(),
        getAnimationClasses(),
        className
      )}
      style={{
        width: width || (variant === 'circular' ? height : undefined),
        height: height || (variant === 'text' ? '1rem' : undefined)
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {animation === 'shimmer' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
    </motion.div>
  );
};

// 博客文章卡片骨架屏
export const BlogCardSkeleton: React.FC = () => {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        {/* 标题骨架 */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* 描述骨架 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        {/* 标签骨架 */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        
        {/* 日期和阅读时间骨架 */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};

// 导航栏骨架屏
export const NavbarSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4">
      {/* Logo 骨架 */}
      <Skeleton variant="circular" width={40} height={40} />
      
      {/* 导航链接骨架 */}
      <div className="hidden md:flex items-center gap-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14" />
      </div>
      
      {/* 主题切换按钮骨架 */}
      <Skeleton variant="circular" width={40} height={40} />
    </div>
  );
};

// 加载旋转器
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  return (
    <motion.div
      className={cn('inline-block', getSizeClasses(), className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
          className="opacity-25"
        />
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="31.416"
          initial={{ strokeDashoffset: 31.416 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
    </motion.div>
  );
};

// 脉冲加载器
interface PulseLoaderProps {
  count?: number;
  size?: number;
  color?: string;
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  count = 3,
  size = 8,
  color = 'currentColor',
  className = ''
}) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: color
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// 波浪加载器
interface WaveLoaderProps {
  count?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const WaveLoader: React.FC<WaveLoaderProps> = ({
  count = 5,
  height = 20,
  color = 'currentColor',
  className = ''
}) => {
  return (
    <div className={cn('flex items-end gap-1', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="w-1 rounded-full"
          style={{
            backgroundColor: color,
            height: height / 2
          }}
          animate={{
            height: [height / 2, height, height / 2]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// 加载状态容器
interface LoadingContainerProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  className?: string;
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  loading,
  children,
  skeleton,
  className = ''
}) => {
  return (
    <div className={className}>
      {loading ? (
        skeleton || (
          <div className="flex items-center justify-center p-8">
            <Spinner size="lg" />
          </div>
        )
      ) : (
        children
      )}
    </div>
  );
};

export default {
  Skeleton,
  BlogCardSkeleton,
  NavbarSkeleton,
  Spinner,
  PulseLoader,
  WaveLoader,
  LoadingContainer
};
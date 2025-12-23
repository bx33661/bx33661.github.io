import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// 全局观察者缓存，避免重复创建 IntersectionObserver
const observerCache = new Map<string, IntersectionObserver>();
const observedElements = new Set<Element>();

interface AnimatedElementProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'rotateIn' | 'bounceIn';
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  stagger?: boolean;
  staggerDelay?: number;
}

const animationVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  },
  slideDown: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  },
  slideRight: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },
  rotateIn: {
    hidden: { opacity: 0, rotate: -10, scale: 0.9 },
    visible: { opacity: 1, rotate: 0, scale: 1 }
  },
  bounceIn: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    }
  }
};

// 获取或创建观察者
const getObserver = (threshold: number): IntersectionObserver => {
  const key = `threshold-${threshold}`;
  if (!observerCache.has(key)) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement & {
            __onVisibilityChange?: (isVisible: boolean) => void;
          };

          if (element.__onVisibilityChange) {
            element.__onVisibilityChange(entry.isIntersecting);
          }
        });
      },
      {
        threshold,
        rootMargin: '50px' // 提前触发，提升用户体验
      }
    );
    observerCache.set(key, observer);
  }
  return observerCache.get(key)!;
};

// 优化的 AnimatedElement - 使用共享观察者
const OptimizedAnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  className,
  animation = 'fadeIn',
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  once = true,
  stagger = false,
  staggerDelay = 0.1
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const controls = useAnimation();
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleVisibilityChange = useCallback((visible: boolean) => {
    if (visible && (!once || !hasAnimated)) {
      setIsInView(true);
      controls.start('visible');
      if (once) setHasAnimated(true);
    } else if (!visible && !once) {
      setIsInView(false);
      controls.start('hidden');
    }
  }, [controls, once, hasAnimated]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 设置回调
    (element as any).__onVisibilityChange = handleVisibilityChange;

    // 使用共享观察者
    const observer = getObserver(threshold);
    observerRef.current = observer;

    if (!observedElements.has(element)) {
      observer.observe(element);
      observedElements.add(element);
    }

    return () => {
      if (element && observedElements.has(element)) {
        observer.unobserve(element);
        observedElements.delete(element);
      }
      if (element) {
        delete (element as any).__onVisibilityChange;
      }
    };
  }, [threshold, handleVisibilityChange]);

  // 清理所有观察者
  useEffect(() => {
    return () => {
      observerCache.forEach((observer) => observer.disconnect());
      observerCache.clear();
      observedElements.clear();
    };
  }, []);

  const variants = animationVariants[animation];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      transition={{
        duration,
        delay: stagger ? delay + staggerDelay : delay,
        ease: "easeOut"
      }}
      className={cn(className)}
      style={{
        willChange: isInView ? 'auto' : 'contents' // 优化渲染性能
      }}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedAnimatedElement;

// 用于批量动画的容器组件 - 优化版本
export const OptimizedAnimatedContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerChildren?: number;
  delayChildren?: number;
}> = ({ children, className, staggerChildren = 0.1, delayChildren = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren,
        staggerChildren
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
      style={{
        willChange: isInView ? 'auto' : 'contents'
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

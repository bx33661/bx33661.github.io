import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// 全局观察者缓存
const observerCache = new Map<string, IntersectionObserver>();
const observedElements = new Set<Element>();

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
        rootMargin: '50px'
      }
    );
    observerCache.set(key, observer);
  }
  return observerCache.get(key)!;
};

// 优化的 ScrollReveal 组件
interface OptimizedScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export const OptimizedScrollReveal: React.FC<OptimizedScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  className = '',
  threshold = 0.1,
  once = true
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const handleVisibilityChange = useCallback((visible: boolean) => {
    if (visible && (!once || !hasAnimated)) {
      setIsInView(true);
      if (once) setHasAnimated(true);
    } else if (!visible && !once) {
      setIsInView(false);
    }
  }, [once, hasAnimated]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 设置回调
    (element as any).__onVisibilityChange = handleVisibilityChange;

    // 使用共享观察者
    const observer = getObserver(threshold);

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

  const getInitialState = () => {
    switch (direction) {
      case 'up':
        return { y: distance, opacity: 0 };
      case 'down':
        return { y: -distance, opacity: 0 };
      case 'left':
        return { x: distance, opacity: 0 };
      case 'right':
        return { x: -distance, opacity: 0 };
      case 'scale':
        return { scale: 0.8, opacity: 0 };
      case 'fade':
        return { opacity: 0 };
      default:
        return { y: distance, opacity: 0 };
    }
  };

  const getAnimateState = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { y: 0, opacity: 1 };
      case 'left':
      case 'right':
        return { x: 0, opacity: 1 };
      case 'scale':
        return { scale: 1, opacity: 1 };
      case 'fade':
        return { opacity: 1 };
      default:
        return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={getInitialState()}
      animate={isInView ? getAnimateState() : getInitialState()}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      className={className}
      style={{
        willChange: isInView ? 'auto' : 'contents'
      }}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedScrollReveal;

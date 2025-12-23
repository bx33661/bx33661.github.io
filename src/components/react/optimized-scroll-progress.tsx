import React, { useEffect, useRef, useState } from 'react';

// 优化后的滚动进度指示器 - 仅在可见时激活
interface OptimizedScrollProgressProps {
  className?: string;
  height?: string;
  color?: string;
  rootMargin?: string; // 用于提前触发
}

export const OptimizedScrollProgress: React.FC<OptimizedScrollProgressProps> = ({
  className = '',
  height = '3px',
  color = 'hsl(var(--primary))',
  rootMargin = '0px' // 可以设置为 '100px' 来提前开始
}) => {
  const [scaleX, setScaleX] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin,
        threshold: 0 // 只要任何部分可见就激活
      }
    );

    if (progressRef.current) {
      observer.observe(progressRef.current);
    }

    return () => {
      if (progressRef.current) {
        observer.unobserve(progressRef.current);
      }
    };
  }, [rootMargin]);

  useEffect(() => {
    if (!isVisible) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

      setScaleX(Math.min(scrollPercent, 1));
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateProgress);
        ticking.current = true;
      }
    };

    // 使用 passive listener 提高滚动性能
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 初始计算
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isVisible]);

  // 使用 CSS transform 替代 Framer Motion，性能更好
  return (
    <div
      ref={progressRef}
      className={`fixed top-0 left-0 right-0 z-50 origin-left ${className}`}
      style={{
        height,
        backgroundColor: color,
        transform: `scaleX(${scaleX})`,
        transition: scaleX === 0 ? 'none' : 'transform 0.1s ease-out',
        willChange: 'transform' // 提示浏览器优化此属性的动画
      }}
    />
  );
};

export default OptimizedScrollProgress;

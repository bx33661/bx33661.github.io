import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// 滚动视差组件
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({ 
  children, 
  speed = 0.5, 
  className = '' 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// 滚动触发动画组件
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
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
  const isInView = useInView(ref, { 
    amount: threshold,
    once
  });

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
    >
      {children}
    </motion.div>
  );
};

// 滚动进度指示器
interface ScrollProgressProps {
  className?: string;
  height?: string;
  color?: string;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  className = '',
  height = '3px',
  color = 'hsl(var(--primary))'
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 z-50 origin-left ${className}`}
      style={{
        scaleX,
        height,
        backgroundColor: color
      }}
    />
  );
};

// 滚动数字计数器
interface ScrollCounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const ScrollCounter: React.FC<ScrollCounterProps> = ({
  from,
  to,
  duration = 2,
  className = '',
  suffix = '',
  prefix = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.3, once: true });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const startValue = from;
    const endValue = to;
    const duration_ms = duration * 1000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration_ms, 1);
      
      // 使用 easeOutCubic 缓动函数
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setCount(Math.floor(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, from, to, duration]);

  return (
    <div ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
};

// 滚动触发的渐变背景
interface ScrollGradientProps {
  children: React.ReactNode;
  gradients: string[];
  className?: string;
}

export const ScrollGradient: React.FC<ScrollGradientProps> = ({
  children,
  gradients,
  className = ''
}) => {
  const { scrollYProgress } = useScroll();
  
  const backgroundImage = useTransform(
    scrollYProgress,
    [0, 1],
    [gradients[0], gradients[gradients.length - 1]]
  );

  return (
    <motion.div
      style={{ backgroundImage }}
      className={`transition-all duration-1000 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// 滚动视差文字效果
interface ParallaxTextProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxText: React.FC<ParallaxTextProps> = ({
  children,
  speed = 0.5,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default {
  Parallax,
  ScrollReveal,
  ScrollProgress,
  ScrollCounter,
  ScrollGradient,
  ParallaxText
};
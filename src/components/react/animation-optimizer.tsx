import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// 动画偏好上下文
interface AnimationPreferences {
  reducedMotion: boolean;
  enableParticles: boolean;
  enableHoverEffects: boolean;
  enableScrollAnimations: boolean;
  animationSpeed: number;
}

interface AnimationContextType {
  preferences: AnimationPreferences;
  updatePreferences: (updates: Partial<AnimationPreferences>) => void;
}

const AnimationContext = createContext<AnimationContextType | null>(null);

// 动画偏好提供者
interface AnimationProviderProps {
  children: React.ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const systemReducedMotion = useReducedMotion();
  const [preferences, setPreferences] = useState<AnimationPreferences>({
    reducedMotion: systemReducedMotion || false,
    enableParticles: true,
    enableHoverEffects: true,
    enableScrollAnimations: true,
    animationSpeed: 1
  });

  useEffect(() => {
    // 从 localStorage 读取用户偏好
    const savedPreferences = localStorage.getItem('animation-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse animation preferences:', error);
      }
    }
  }, []);

  useEffect(() => {
    // 监听系统偏好变化
    setPreferences(prev => ({
      ...prev,
      reducedMotion: systemReducedMotion || prev.reducedMotion
    }));
  }, [systemReducedMotion]);

  const updatePreferences = (updates: Partial<AnimationPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      localStorage.setItem('animation-preferences', JSON.stringify(newPreferences));
      return newPreferences;
    });
  };

  return (
    <AnimationContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </AnimationContext.Provider>
  );
};

// 使用动画偏好的 Hook
export const useAnimationPreferences = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationPreferences must be used within AnimationProvider');
  }
  return context;
};

// 优化的 Motion 组件
interface OptimizedMotionProps extends MotionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  respectReducedMotion?: boolean;
  animationType?: 'hover' | 'scroll' | 'entrance' | 'background';
}

export const OptimizedMotion: React.FC<OptimizedMotionProps> = ({
  children,
  fallback,
  respectReducedMotion = true,
  animationType = 'entrance',
  ...motionProps
}) => {
  const { preferences } = useAnimationPreferences();
  const shouldAnimate = getShouldAnimate(preferences, animationType, respectReducedMotion);

  if (!shouldAnimate) {
    return fallback ? <>{fallback}</> : <div {...(motionProps as any)}>{children}</div>;
  }

  // 调整动画速度
  const adjustedProps = adjustAnimationSpeed(motionProps, preferences.animationSpeed);

  return <motion.div {...adjustedProps}>{children}</motion.div>;
};

// 判断是否应该启用动画
function getShouldAnimate(
  preferences: AnimationPreferences,
  animationType: string,
  respectReducedMotion: boolean
): boolean {
  if (respectReducedMotion && preferences.reducedMotion) {
    return false;
  }

  switch (animationType) {
    case 'hover':
      return preferences.enableHoverEffects;
    case 'scroll':
      return preferences.enableScrollAnimations;
    case 'background':
      return preferences.enableParticles;
    default:
      return true;
  }
}

// 调整动画速度
function adjustAnimationSpeed(props: MotionProps, speed: number): MotionProps {
  const adjustedProps = { ...props };

  if (adjustedProps.transition) {
    if (typeof adjustedProps.transition === 'object') {
      adjustedProps.transition = {
        ...adjustedProps.transition,
        duration: adjustedProps.transition.duration ? adjustedProps.transition.duration / speed : undefined
      };
    }
  }

  if (adjustedProps.animate && typeof adjustedProps.animate === 'object') {
    adjustedProps.animate = {
      ...adjustedProps.animate,
      transition: {
        ...((adjustedProps.animate as any).transition || {}),
        duration: ((adjustedProps.animate as any).transition?.duration || 0.3) / speed
      }
    };
  }

  return adjustedProps;
}

// 性能监控 Hook
export const usePerformanceMonitor = () => {
  const [fps, setFps] = useState(60);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        setIsLowPerformance(currentFPS < 30);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return { fps, isLowPerformance };
};

// 自适应动画组件
interface AdaptiveAnimationProps {
  children: React.ReactNode;
  highPerformanceAnimation: MotionProps;
  lowPerformanceAnimation?: MotionProps;
  fallback?: React.ReactNode;
}

export const AdaptiveAnimation: React.FC<AdaptiveAnimationProps> = ({
  children,
  highPerformanceAnimation,
  lowPerformanceAnimation,
  fallback
}) => {
  const { isLowPerformance } = usePerformanceMonitor();
  const { preferences } = useAnimationPreferences();

  if (preferences.reducedMotion) {
    return fallback ? <>{fallback}</> : <div>{children}</div>;
  }

  const animationProps = isLowPerformance && lowPerformanceAnimation
    ? lowPerformanceAnimation
    : highPerformanceAnimation;

  return <motion.div {...animationProps}>{children}</motion.div>;
};

// 动画偏好设置组件
interface AnimationSettingsProps {
  className?: string;
}

export const AnimationSettings: React.FC<AnimationSettingsProps> = ({ className }) => {
  const { preferences, updatePreferences } = useAnimationPreferences();
  const { fps, isLowPerformance } = usePerformanceMonitor();

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg', className)}>
      <h3 className="text-lg font-semibold">动画设置</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">减少动画</label>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">背景粒子效果</label>
          <input
            type="checkbox"
            checked={preferences.enableParticles}
            onChange={(e) => updatePreferences({ enableParticles: e.target.checked })}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">悬停效果</label>
          <input
            type="checkbox"
            checked={preferences.enableHoverEffects}
            onChange={(e) => updatePreferences({ enableHoverEffects: e.target.checked })}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">滚动动画</label>
          <input
            type="checkbox"
            checked={preferences.enableScrollAnimations}
            onChange={(e) => updatePreferences({ enableScrollAnimations: e.target.checked })}
            className="rounded"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">动画速度: {preferences.animationSpeed}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={preferences.animationSpeed}
            onChange={(e) => updatePreferences({ animationSpeed: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div className="pt-3 border-t text-xs text-muted-foreground">
        <div>当前 FPS: {fps}</div>
        {isLowPerformance && (
          <div className="text-yellow-600 dark:text-yellow-400">
            检测到低性能，建议减少动画效果
          </div>
        )}
      </div>
    </div>
  );
};

// 延迟加载动画组件
interface LazyAnimationProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  animationProps?: MotionProps;
}

export const LazyAnimation: React.FC<LazyAnimationProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  animationProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { preferences } = useAnimationPreferences();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasAnimated]);

  if (preferences.reducedMotion) {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      {...(isVisible ? animationProps : { initial: animationProps.initial })}
    >
      {children}
    </motion.div>
  );
};

export default {
  AnimationProvider,
  useAnimationPreferences,
  OptimizedMotion,
  usePerformanceMonitor,
  AdaptiveAnimation,
  AnimationSettings,
  LazyAnimation
};
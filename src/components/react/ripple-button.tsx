import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RippleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  rippleColor?: string;
  rippleDuration?: number;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  rippleDuration = 600,
  type = 'button',
  variant = 'default',
  size = 'md'
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nextRippleId = useRef(0);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: RippleEffect = {
      id: nextRippleId.current++,
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    // 移除波纹效果
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, rippleDuration);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.(e);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'ghost':
        return 'hover:bg-accent hover:text-accent-foreground';
      case 'outline':
        return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-3 text-sm';
      case 'lg':
        return 'h-11 px-8 text-base';
      default:
        return 'h-10 px-4 py-2 text-sm';
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-95',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 17
      }}
    >
      {/* 按钮内容 */}
      <span className="relative z-10">{children}</span>

      {/* 波纹效果容器 */}
      <div className="absolute inset-0 overflow-hidden rounded-md">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                backgroundColor: rippleColor,
              }}
              initial={{
                scale: 0,
                opacity: 1,
              }}
              animate={{
                scale: 2,
                opacity: 0,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: rippleDuration / 1000,
                ease: 'easeOut',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 悬停光效 */}
      <motion.div
        className="absolute inset-0 opacity-0 rounded-md"
        style={{
          background: `linear-gradient(45deg, transparent 30%, ${rippleColor} 50%, transparent 70%)`,
        }}
        whileHover={{
          opacity: 0.1,
          transition: { duration: 0.3 }
        }}
      />
    </motion.button>
  );
};

// 简化版波纹效果 Hook
export const useRipple = () => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const nextRippleId = useRef(0);

  const createRipple = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: RippleEffect = {
      id: nextRippleId.current++,
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const RippleContainer = ({ color = 'rgba(255, 255, 255, 0.6)' }) => (
    <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  return { createRipple, RippleContainer };
};

export default RippleButton;
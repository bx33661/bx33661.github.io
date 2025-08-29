import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
  scale?: number;
  glowColor?: string;
  enableGlow?: boolean;
  enableTilt?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 15,
  perspective = 1000,
  scale = 1.02,
  glowColor = 'rgba(var(--primary), 0.15)',
  enableGlow = true,
  enableTilt = true
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 鼠标位置追踪
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 平滑的弹簧动画
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });

  // 3D 旋转变换
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-intensity, intensity]);

  // 光泽效果位置
  const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !enableTilt) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 将鼠标位置转换为 -0.5 到 0.5 的范围
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative transform-gpu ${className}`}
      style={{
        perspective: `${perspective}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: scale,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20
        }
      }}
    >
      <motion.div
        className="relative w-full h-full transform-gpu"
        style={{
          rotateX: enableTilt ? rotateX : 0,
          rotateY: enableTilt ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30
        }}
      >
        {/* 主要内容 */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>

        {/* 光泽效果 */}
        {enableGlow && (
          <motion.div
            className="absolute inset-0 opacity-0 pointer-events-none rounded-lg"
            style={{
              background: `radial-gradient(circle at ${glowX} ${glowY}, ${glowColor} 0%, transparent 50%)`,
            }}
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* 边框光效 */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${glowColor} 50%, transparent 100%)`,
            filter: 'blur(1px)',
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
        />

        {/* 阴影增强 */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-lg"
          style={{
            filter: 'blur(20px)',
            background: glowColor,
          }}
          animate={{
            opacity: isHovered ? 0.3 : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// 简化版本的卡片悬停效果
interface SimpleCard3DProps {
  children: React.ReactNode;
  className?: string;
}

export const SimpleCard3D: React.FC<SimpleCard3DProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={`transform-gpu ${className}`}
      whileHover={{
        scale: 1.02,
        rotateX: 2,
        rotateY: 2,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20
        }
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
};

export default Card3D;
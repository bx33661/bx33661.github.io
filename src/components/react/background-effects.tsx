import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// 粒子接口
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

// 粒子背景组件
interface ParticleBackgroundProps {
  particleCount?: number;
  particleColor?: string;
  particleSize?: number;
  speed?: number;
  className?: string;
  interactive?: boolean;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  particleCount = 50,
  particleColor = 'rgba(255, 255, 255, 0.5)',
  particleSize = 2,
  speed = 0.5,
  className = '',
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * particleSize + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: particleColor
        });
      }
    };

    const updateParticles = () => {
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // 鼠标交互
        if (interactive) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const force = (100 - distance) / 100;
            particle.vx += (dx / distance) * force * 0.01;
            particle.vy += (dy / distance) * force * 0.01;
          }
        }
      });
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 绘制连接线
      particlesRef.current.forEach((particle, i) => {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const other = particlesRef.current[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.save();
            ctx.globalAlpha = (100 - distance) / 100 * 0.2;
            ctx.strokeStyle = particleColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      });
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleResize = () => {
      resizeCanvas();
      createParticles();
    };

    resizeCanvas();
    createParticles();
    animate();

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount, particleColor, particleSize, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 pointer-events-none z-0', className)}
      style={{ background: 'transparent' }}
    />
  );
};

// 几何图形背景
interface GeometricBackgroundProps {
  shapes?: ('circle' | 'triangle' | 'square' | 'hexagon')[];
  shapeCount?: number;
  animationSpeed?: number;
  className?: string;
}

export const GeometricBackground: React.FC<GeometricBackgroundProps> = ({
  shapes = ['circle', 'triangle', 'square'],
  shapeCount = 20,
  animationSpeed = 1,
  className = ''
}) => {
  const [geometricShapes, setGeometricShapes] = useState<any[]>([]);

  useEffect(() => {
    const newShapes = Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      type: shapes[Math.floor(Math.random() * shapes.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 60 + 20,
      rotation: Math.random() * 360,
      opacity: Math.random() * 0.1 + 0.05,
      duration: Math.random() * 20 + 10
    }));
    setGeometricShapes(newShapes);
  }, [shapes, shapeCount]);

  const renderShape = (shape: any) => {
    const commonStyle = {
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      width: shape.size,
      height: shape.size,
      opacity: shape.opacity
    };
    
    const commonAnimate = {
      rotate: [shape.rotation, shape.rotation + 360],
      scale: [1, 1.2, 1]
    };
    
    const commonTransition = {
      duration: shape.duration / animationSpeed,
      repeat: Infinity,
      ease: 'linear' as const
    };

    switch (shape.type) {
      case 'circle':
        return (
          <motion.div
            key={shape.id}
            className="absolute rounded-full border border-current"
            style={commonStyle}
            animate={commonAnimate}
            transition={commonTransition}
          />
        );
      case 'triangle':
        return (
          <motion.div
            key={shape.id}
            className="absolute border-l-transparent border-r-transparent border-b-current"
            style={{
              ...commonStyle,
              borderLeftWidth: shape.size / 2,
              borderRightWidth: shape.size / 2,
              borderBottomWidth: shape.size,
              width: 0,
              height: 0
            }}
            animate={commonAnimate}
            transition={commonTransition}
          />
        );
      case 'square':
        return (
          <motion.div
            key={shape.id}
            className="absolute border border-current"
            style={commonStyle}
            animate={commonAnimate}
            transition={commonTransition}
          />
        );
      case 'hexagon':
        return (
          <motion.div
            key={shape.id}
            className="absolute border border-current"
            style={{
              ...commonStyle,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={commonAnimate}
            transition={commonTransition}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-0 text-muted-foreground/20', className)}>
      {geometricShapes.map(renderShape)}
    </div>
  );
};

// 渐变背景动画
interface AnimatedGradientProps {
  colors?: string[];
  duration?: number;
  className?: string;
}

export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
  duration = 10,
  className = ''
}) => {
  return (
    <motion.div
      className={cn('fixed inset-0 pointer-events-none z-0', className)}
      animate={{
        background: [
          `linear-gradient(45deg, ${colors[0]}, ${colors[1]})`,
          `linear-gradient(135deg, ${colors[1]}, ${colors[2]})`,
          `linear-gradient(225deg, ${colors[2]}, ${colors[3]})`,
          `linear-gradient(315deg, ${colors[3]}, ${colors[4]})`,
          `linear-gradient(45deg, ${colors[4]}, ${colors[0]})`
        ]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear'
      }}
      style={{
        opacity: 0.1
      }}
    />
  );
};

// 网格背景
interface GridBackgroundProps {
  gridSize?: number;
  strokeWidth?: number;
  className?: string;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  gridSize = 50,
  strokeWidth = 1,
  className = ''
}) => {
  return (
    <div className={cn('fixed inset-0 pointer-events-none z-0', className)}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted-foreground/10"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

// 浮动元素
interface FloatingElementsProps {
  elements?: React.ReactNode[];
  count?: number;
  className?: string;
}

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  elements = ['✨', '🌟', '💫', '⭐'],
  count = 15,
  className = ''
}) => {
  const [floatingItems, setFloatingItems] = useState<any[]>([]);

  useEffect(() => {
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      element: elements[Math.floor(Math.random() * elements.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 5
    }));
    setFloatingItems(items);
  }, [elements, count]);

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-0', className)}>
      {floatingItems.map(item => (
        <motion.div
          key={item.id}
          className="absolute text-2xl"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut'
          }}
        >
          {item.element}
        </motion.div>
      ))}
    </div>
  );
};

export default {
  ParticleBackground,
  GeometricBackground,
  AnimatedGradient,
  GridBackground,
  FloatingElements
};
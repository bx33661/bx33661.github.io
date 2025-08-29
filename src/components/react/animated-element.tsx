import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedElementProps {
  children: React.ReactNode
  className?: string
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'rotateIn' | 'bounceIn'
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
  stagger?: boolean
  staggerDelay?: number
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
}

const AnimatedElement: React.FC<AnimatedElementProps> = ({
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
  const ref = useRef(null)
  const isInView = useInView(ref, { amount: threshold, once })
  const controls = useAnimation()
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isInView && (!once || !hasAnimated)) {
      controls.start('visible')
      if (once) setHasAnimated(true)
    } else if (!isInView && !once) {
      controls.start('hidden')
    }
  }, [isInView, controls, once, hasAnimated])

  const variants = animationVariants[animation]

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
    >
      {children}
    </motion.div>
  )
}

export default AnimatedElement

// 用于批量动画的容器组件
export const AnimatedContainer: React.FC<{
  children: React.ReactNode
  className?: string
  staggerChildren?: number
  delayChildren?: number
}> = ({ children, className, staggerChildren = 0.1, delayChildren = 0 }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { amount: 0.1, once: true })

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren,
        staggerChildren
      }
    }
  }

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
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowUp, MessageCircle, Heart, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// 页面进度指示器
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

// 返回顶部按钮
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [0, 1])
  const scale = useTransform(scrollY, [0, 300], [0.8, 1])

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsVisible(latest > 300)
    })
    return unsubscribe
  }, [scrollY])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{ opacity, scale }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            aria-label="返回顶部"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 浮动操作按钮
export function FloatingActionButtons() {
  const [isOpen, setIsOpen] = useState(false)
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const toggleLike = () => {
    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)
  }

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href
        })
      } catch (err) {
        console.log('分享取消')
      }
    } else {
      // 备用方案：复制链接到剪贴板
      await navigator.clipboard.writeText(window.location.href)
      // 可以添加提示消息
    }
  }

  const actionButtons = [
    {
      icon: Heart,
      label: `点赞 (${likes})`,
      onClick: toggleLike,
      className: cn(
        'transition-colors duration-200',
        isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground'
      )
    },
    {
      icon: Share2,
      label: '分享',
      onClick: shareArticle,
      className: 'text-muted-foreground hover:text-blue-500'
    },
    {
      icon: MessageCircle,
      label: '评论',
      onClick: () => {
        const commentsSection = document.getElementById('comments')
        commentsSection?.scrollIntoView({ behavior: 'smooth' })
      },
      className: 'text-muted-foreground hover:text-green-500'
    }
  ]

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <motion.div
        className="flex flex-col gap-3"
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
      >
        <AnimatePresence>
          {actionButtons.map((button, index) => (
            <motion.div
              key={button.label}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={button.onClick}
                size="icon"
                variant="outline"
                className={cn(
                  'w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-border/20',
                  button.className
                )}
                aria-label={button.label}
              >
                <button.icon className="w-5 h-5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// 页面加载动画
export function PageLoadingAnimation() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-background z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 悬浮提示组件
export function HoverTooltip({ children, content, delay = 500 }: {
  children: React.ReactNode
  content: string
  delay?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-sm text-white bg-gray-900 rounded whitespace-nowrap z-50"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 视差滚动容器
export function ParallaxContainer({ children, offset = 50 }: {
  children: React.ReactNode
  offset?: number
}) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 1000], [0, offset])

  return (
    <motion.div style={{ y }}>
      {children}
    </motion.div>
  )
}

export default {
  ScrollProgressBar,
  BackToTop,
  FloatingActionButtons,
  PageLoadingAnimation,
  HoverTooltip,
  ParallaxContainer
}
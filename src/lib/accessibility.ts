// 可访问性优化工具类
export class AccessibilityUtils {
  // 焦点管理
  static manageFocus() {
    // 焦点在模态框内循环
    this.trapFocusInModal()
    // 设置跳过链接
    this.setupSkipLinks()
  }

  static trapFocusInModal() {
    const modals = document.querySelectorAll('[role="dialog"]')
    
    modals.forEach(modal => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length === 0) return
      
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      })
    })
  }

  static setupSkipLinks() {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = '跳过到主要内容'
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded'
    
    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  // 键盘导航支持
  static enhanceKeyboardNavigation() {
    // 为没有 href 的按钮添加键盘支持
    document.querySelectorAll('[role="button"]:not(button):not(a)').forEach(element => {
      element.tabIndex = 0
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          element.click()
        }
      })
    })
  }

  // 动态内容通告
  static announceToScreenReader(message, priority = 'polite') {
    const announcer = document.getElementById('screen-reader-announcer') || 
      this.createScreenReaderAnnouncer()
    
    announcer.setAttribute('aria-live', priority)
    announcer.textContent = message
    
    // 清除消息
    setTimeout(() => {
      announcer.textContent = ''
    }, 1000)
  }

  static createScreenReaderAnnouncer() {
    const announcer = document.createElement('div')
    announcer.id = 'screen-reader-announcer'
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
    return announcer
  }

  // 色彩对比度检查
  static checkColorContrast() {
    // 基础的对比度检查（实际项目中可使用更专业的工具）
    const elements = document.querySelectorAll('[data-check-contrast]')
    elements.forEach(element => {
      const styles = getComputedStyle(element)
      const bgColor = styles.backgroundColor
      const textColor = styles.color
      // 这里可以添加对比度计算逻辑
    })
  }

  // 动画偏好设置
  static respectMotionPreferences() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleMotionPreference = (mq) => {
      if (mq.matches) {
        document.documentElement.classList.add('reduce-motion')
      } else {
        document.documentElement.classList.remove('reduce-motion')
      }
    }
    
    handleMotionPreference(prefersReducedMotion)
    prefersReducedMotion.addEventListener('change', handleMotionPreference)
  }

  // 初始化所有可访问性功能
  static init() {
    this.manageFocus()
    this.enhanceKeyboardNavigation()
    this.respectMotionPreferences()
    this.createScreenReaderAnnouncer()
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    AccessibilityUtils.init()
  })
}
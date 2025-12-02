import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordProtectProps {
  articleId: string
  correctPassword: string
  children: React.ReactNode
}

export default function PasswordProtect({
  articleId,
  correctPassword,
  children,
}: PasswordProtectProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 检查是否已经解锁过（从 sessionStorage 读取）
  useEffect(() => {
    const storageKey = `article_unlocked_${articleId}`
    const unlocked = sessionStorage.getItem(storageKey)
    if (unlocked === 'true') {
      setIsUnlocked(true)
    }
    setIsLoading(false)
    
    // 检测是否为移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [articleId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password === correctPassword) {
      setIsUnlocked(true)
      // 保存解锁状态到 sessionStorage
      const storageKey = `article_unlocked_${articleId}`
      sessionStorage.setItem(storageKey, 'true')
      // 移动端收起键盘
      if (isMobile && inputRef.current) {
        inputRef.current.blur()
      }
    } else {
      setError('密码错误，请重试')
      setPassword('')
      // 震动反馈（支持的设备）
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      // 重新聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 已解锁，显示内容
  if (isUnlocked) {
    return <>{children}</>
  }

  // 未解锁，显示密码输入界面
  return (
    <div className={`flex items-center justify-center px-4 ${isMobile ? 'min-h-[calc(100vh-200px)] py-8' : 'min-h-[500px]'}`}>
      <div className="w-full max-w-md">
        <div className={`bg-card border border-border rounded-lg shadow-lg transition-all ${isMobile ? 'p-6' : 'p-8'}`}>
          <div className={`text-center ${isMobile ? 'mb-5' : 'mb-6'}`}>
            <div className={`mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}`}>
              <svg
                className={`text-primary ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className={`font-bold text-foreground mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              受保护的文章
            </h2>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
              这篇文章需要密码才能访问
            </p>
          </div>

          <form onSubmit={handleSubmit} className={isMobile ? 'space-y-3' : 'space-y-4'}>
            <div>
              <label
                htmlFor="password"
                className={`block font-medium text-foreground mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                请输入密码
              </label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入文章密码"
                  className={`w-full pr-10 ${isMobile ? 'h-12 text-base' : 'h-10'}`}
                  autoFocus={!isMobile}
                  autoComplete="off"
                  inputMode="text"
                  enterKeyHint="go"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className={`bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 flex items-center gap-2 animate-shake ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full touch-manipulation active:scale-95 transition-transform" 
              size={isMobile ? 'default' : 'lg'}
              style={{ minHeight: isMobile ? '48px' : 'auto' }}
            >
              <svg
                className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              解锁文章
            </Button>
          </form>

          <div className={`border-t border-border ${isMobile ? 'mt-4 pt-4' : 'mt-6 pt-6'}`}>
            <p className={`text-muted-foreground text-center leading-relaxed ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
              💡 {isMobile ? '密码会话期间有效' : '提示：密码在当前浏览器会话中保存，刷新页面不需要重新输入'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

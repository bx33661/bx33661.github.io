import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordProtectProps {
  articleId: string
  passwordSalt: string
  passwordIterations: number
  passwordVerifier: string
  children: React.ReactNode
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30_000
const PERSIST_UNLOCK_TTL_MS = 7 * 24 * 60 * 60 * 1000
const SESSION_UNLOCK_PREFIX = 'article_unlocked_session_'
const PERSIST_UNLOCK_PREFIX = 'article_unlocked_persist_'
const LOCK_STATE_PREFIX = 'article_lock_state_'

interface PersistUnlockState {
  expiresAt: number
}

interface LockState {
  failedAttempts: number
  lockUntil: number
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function derivePasswordVerifier(password: string, salt: string, iterations: number): Promise<string> {
  if (!window.crypto?.subtle) {
    throw new Error('当前浏览器不支持加密校验')
  }

  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )

  return toHex(derivedBits)
}

function parsePersistState(raw: string | null): PersistUnlockState | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PersistUnlockState
    if (typeof parsed.expiresAt !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function parseLockState(raw: string | null): LockState | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as LockState
    if (typeof parsed.failedAttempts !== 'number' || typeof parsed.lockUntil !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export default function PasswordProtect({
  articleId,
  passwordSalt,
  passwordIterations,
  passwordVerifier,
  children,
}: PasswordProtectProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberUnlock, setRememberUnlock] = useState(true)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  const sessionUnlockKey = useMemo(() => `${SESSION_UNLOCK_PREFIX}${articleId}`, [articleId])
  const persistUnlockKey = useMemo(() => `${PERSIST_UNLOCK_PREFIX}${articleId}`, [articleId])
  const lockStateKey = useMemo(() => `${LOCK_STATE_PREFIX}${articleId}`, [articleId])
  const isLocked = lockUntil > now
  const lockSecondsRemaining = isLocked ? Math.max(1, Math.ceil((lockUntil - now) / 1000)) : 0
  const passwordErrorId = `password-error-${articleId}`

  const saveLockState = (next: LockState) => {
    sessionStorage.setItem(lockStateKey, JSON.stringify(next))
  }

  // 恢复会话状态
  useEffect(() => {
    try {
      const sessionUnlocked = sessionStorage.getItem(sessionUnlockKey) === 'true'
      if (sessionUnlocked) {
        setIsUnlocked(true)
        return
      }

      const persistState = parsePersistState(localStorage.getItem(persistUnlockKey))
      if (persistState && persistState.expiresAt > Date.now()) {
        setIsUnlocked(true)
        sessionStorage.setItem(sessionUnlockKey, 'true')
      } else {
        localStorage.removeItem(persistUnlockKey)
      }

      const lockState = parseLockState(sessionStorage.getItem(lockStateKey))
      if (lockState) {
        setFailedAttempts(Math.max(lockState.failedAttempts, 0))
        setLockUntil(lockState.lockUntil > Date.now() ? lockState.lockUntil : 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [lockStateKey, persistUnlockKey, sessionUnlockKey])

  // 锁定倒计时
  useEffect(() => {
    if (!isLocked) {
      return
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isLocked])

  // 锁定结束后重置失败状态
  useEffect(() => {
    if (lockUntil === 0 || now < lockUntil) {
      return
    }

    setLockUntil(0)
    setFailedAttempts(0)
    setError('')
    saveLockState({ failedAttempts: 0, lockUntil: 0 })
  }, [lockUntil, now])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!password || isLocked || isVerifying) {
      return
    }

    setError('')
    setIsVerifying(true)

    try {
      const computedVerifier = await derivePasswordVerifier(password, passwordSalt, passwordIterations)

      if (computedVerifier === passwordVerifier) {
        setIsUnlocked(true)
        setPassword('')
        setFailedAttempts(0)
        setLockUntil(0)
        setNow(Date.now())
        sessionStorage.setItem(sessionUnlockKey, 'true')
        saveLockState({ failedAttempts: 0, lockUntil: 0 })

        if (rememberUnlock) {
          localStorage.setItem(
            persistUnlockKey,
            JSON.stringify({
              expiresAt: Date.now() + PERSIST_UNLOCK_TTL_MS,
            } satisfies PersistUnlockState),
          )
        } else {
          localStorage.removeItem(persistUnlockKey)
        }

        inputRef.current?.blur()
        return
      }

      const nextFailedAttempts = failedAttempts + 1
      if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const nextLockUntil = Date.now() + LOCKOUT_DURATION_MS
        setFailedAttempts(0)
        setLockUntil(nextLockUntil)
        setNow(Date.now())
        saveLockState({ failedAttempts: 0, lockUntil: nextLockUntil })
        setError(`输错次数过多，请在 ${Math.ceil(LOCKOUT_DURATION_MS / 1000)} 秒后重试`)
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - nextFailedAttempts
        setFailedAttempts(nextFailedAttempts)
        saveLockState({ failedAttempts: nextFailedAttempts, lockUntil: 0 })
        setError(`密码错误，还可尝试 ${remainingAttempts} 次`)
      }

      setPassword('')
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } catch {
      setError('浏览器加密能力不可用，暂时无法验证密码')
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-220px)] md:min-h-[500px] px-4 py-8 md:py-0">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg transition-all p-6 md:p-8">
          <div className="text-center mb-5 md:mb-6">
            <div className="mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 w-14 h-14 md:w-16 md:h-16">
              <svg
                className="text-primary w-7 h-7 md:w-8 md:h-8"
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
            <h2 className="font-bold text-foreground mb-2 text-xl md:text-2xl">受保护的文章</h2>
            <p className="text-muted-foreground text-sm md:text-base">这篇文章需要密码才能访问</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block font-medium text-foreground mb-2 text-xs md:text-sm"
              >
                请输入密码
              </label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (!isLocked && error) {
                      setError('')
                    }
                  }}
                  placeholder="输入文章密码"
                  className="w-full pr-10 h-12 md:h-10 text-base md:text-sm"
                  autoComplete="current-password"
                  inputMode="text"
                  enterKeyHint="go"
                  disabled={isVerifying || isLocked}
                  aria-invalid={error ? true : false}
                  aria-describedby={error ? passwordErrorId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isVerifying || isLocked}
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

            <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={rememberUnlock}
                onChange={(event) => setRememberUnlock(event.target.checked)}
                className="h-4 w-4 rounded border-border"
                disabled={isVerifying}
              />
              记住此设备 7 天
            </label>

            {error && (
              <div
                id={passwordErrorId}
                role="alert"
                aria-live="polite"
                className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 flex items-center gap-2 animate-shake text-xs md:text-sm"
              >
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

            {isLocked && (
              <p className="text-xs text-muted-foreground text-center">请等待 {lockSecondsRemaining} 秒后再试</p>
            )}

            <Button
              type="submit"
              className="w-full touch-manipulation active:scale-95 transition-transform min-h-12 md:min-h-11"
              size="lg"
              disabled={!password || isVerifying || isLocked}
            >
              <svg
                className="mr-2 w-4 h-4 md:w-5 md:h-5"
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
              {isVerifying ? '验证中...' : isLocked ? `请等待 ${lockSecondsRemaining}s` : '解锁文章'}
            </Button>
          </form>

          <div className="border-t border-border mt-4 pt-4 md:mt-6 md:pt-6">
            <p className="text-muted-foreground text-center leading-relaxed text-[11px] md:text-xs">
              提示：默认会在当前会话内保持解锁，关闭浏览器标签页后失效。
            </p>
            <p className="text-muted-foreground text-center leading-relaxed text-[11px] md:text-xs mt-1">
              勾选“记住此设备”后可保持 7 天。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

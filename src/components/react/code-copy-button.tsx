import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeCopyButtonProps {
  code: string
  className?: string
}

export function CodeCopyButton({ code, className }: CodeCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={cn(
        'group relative inline-flex items-center justify-center',
        'w-8 h-8 rounded-md transition-all duration-200',
        'bg-muted/50 hover:bg-muted border border-border/50',
        'text-muted-foreground hover:text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        'active:scale-95',
        className
      )}
      title={copied ? '已复制!' : '复制代码'}
      aria-label={copied ? '已复制' : '复制代码'}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      
      {/* 复制成功提示 */}
      {copied && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-green-500 text-white rounded whitespace-nowrap opacity-0 animate-in fade-in-0 zoom-in-95 duration-200">
          已复制!
        </span>
      )}
    </button>
  )
}

export default CodeCopyButton
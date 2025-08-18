import { useEffect, useRef, useState } from 'react'
import { CodeCopyButton } from './code-copy-button'
import { cn } from '@/lib/utils'

interface EnhancedCodeBlockProps {
  children: React.ReactNode
  language?: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

export function EnhancedCodeBlock({
  children,
  language,
  filename,
  showLineNumbers = false,
  className
}: EnhancedCodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [codeText, setCodeText] = useState('')

  useEffect(() => {
    if (codeRef.current) {
      // 提取纯文本代码，去除行号和其他装饰
      const text = codeRef.current.textContent || ''
      setCodeText(text)
    }
  }, [children])

  return (
    <div className={cn(
      'group relative my-6 overflow-hidden rounded-lg border border-border/50',
      'bg-muted/30 shadow-sm transition-all duration-200',
      'hover:shadow-md hover:border-border',
      className
    )}>
      {/* 代码块头部 */}
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="text-sm font-medium text-foreground">
                {filename}
              </span>
            )}
            {language && (
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                {language.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* 复制按钮 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CodeCopyButton code={codeText} />
          </div>
        </div>
      )}
      
      {/* 代码内容 */}
      <div className="relative">
        {/* 如果没有头部，在右上角显示复制按钮 */}
        {!filename && !language && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CodeCopyButton code={codeText} />
          </div>
        )}
        
        <pre className={cn(
          'overflow-x-auto p-4 text-sm leading-relaxed',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30',
          showLineNumbers && 'pl-12'
        )}>
          <code ref={codeRef} className="font-mono">
            {children}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default EnhancedCodeBlock
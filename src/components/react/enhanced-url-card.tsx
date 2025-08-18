import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedUrlCardProps {
  href: string;
  title?: string;
  description?: string;
  className?: string;
  showFavicon?: boolean;
}

const EnhancedUrlCard: React.FC<EnhancedUrlCardProps> = ({
  href,
  title,
  description,
  className,
  showFavicon = true,
}) => {
  const [favicon, setFavicon] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // 提取域名
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // 获取网站图标
  useEffect(() => {
    if (!showFavicon) return;

    const domain = getDomain(href);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    setIsLoading(true);
    setError(false);

    const img = new Image();
    img.onload = () => {
      setFavicon(faviconUrl);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
    img.src = faviconUrl;
  }, [href, showFavicon]);

  // 获取默认图标
  const getDefaultIcon = (url: string) => {
    const domain = getDomain(url).toLowerCase();
    
    // 常见网站的图标映射
    const iconMap: { [key: string]: string } = {
      'github.com': '🐙',
      'stackoverflow.com': '📚',
      'medium.com': '📝',
      'dev.to': '👨‍💻',
      'youtube.com': '📺',
      'twitter.com': '🐦',
      'x.com': '🐦',
      'linkedin.com': '💼',
      'facebook.com': '📘',
      'instagram.com': '📷',
      'reddit.com': '🤖',
      'discord.com': '💬',
      'telegram.org': '✈️',
      'whatsapp.com': '💚',
      'google.com': '🔍',
      'wikipedia.org': '📖',
      'npmjs.com': '📦',
      'codepen.io': '🖊️',
      'figma.com': '🎨',
      'dribbble.com': '🏀',
      'behance.net': '🎭',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (domain.includes(key)) {
        return icon;
      }
    }

    return '🌐';
  };

  const displayTitle = title || getDomain(href);
  const displayIcon = favicon || getDefaultIcon(href);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block w-full p-4 rounded-xl border border-gray-200/60 bg-white/80 backdrop-blur-sm',
        'hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1',
        'dark:border-gray-700/60 dark:bg-gray-900/80 dark:hover:border-blue-600/60 dark:hover:shadow-blue-900/20',
        'no-underline relative overflow-hidden',
        'transition-all duration-300 ease-out',
        'my-3',
        className
      )}
      style={{
        backgroundImage: 'linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.03) 100%)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* 网站图标 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center shadow-md shadow-blue-200/50 dark:shadow-blue-900/30 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 border border-blue-300/30 dark:border-blue-600/30">
          {showFavicon && !error && !isLoading && favicon ? (
            <img
              src={favicon}
              alt={`${getDomain(href)} favicon`}
              className="w-6 h-6 rounded"
              onError={() => setError(true)}
            />
          ) : (
            <span className="text-white text-lg font-bold">
              {isLoading ? '⏳' : displayIcon}
            </span>
          )}
        </div>

        {/* 链接内容 */}
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {displayTitle}
          </div>
          
          {description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {description}
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-70 group-hover:opacity-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all duration-200 truncate">
            {href} ↗
          </div>
        </div>
      </div>

      {/* 悬停光效 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </a>
  );
};

export default EnhancedUrlCard;
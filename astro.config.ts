import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'

import expressiveCode from 'astro-expressive-code'
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'

import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import remarkSectionize from 'remark-sectionize'
import rehypeDocument from 'rehype-document'
import { rehypeAutoLanguage } from './src/lib/auto-language-plugin'

import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import { pluginFrames } from '@expressive-code/plugin-frames'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'

import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // 如果使用自定义域名，保持 'https://www.bx33661.com'
  // 如果使用 GitHub Pages 默认域名，改为 'https://bx33661.github.io'
  site: 'https://www.bx33661.com',
  
  // 如果仓库名是 portfolio（不是 username.github.io），需要设置 base
  // 如果使用自定义域名或仓库名是 username.github.io，保持 '/'
  base: '/',
  
  output: 'static',
  
  // Content Layer API 在 Astro 5 中已经稳定，不再需要实验性标志
  
  // 图片优化配置
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689, // 增加支持的图片像素限制
      },
    },
  },

  integrations: [
    expressiveCode({
      themes: ['github-light', 'one-dark-pro'],
      plugins: [pluginCollapsibleSections(), pluginLineNumbers(), pluginFrames(), pluginTextMarkers()],
      useDarkModeMediaQuery: true,
      // 配置复制按钮和其他实用功能
      frames: {
        showCopyToClipboardButton: true, // 启用复制按钮
        extractFileNameFromCode: true, // 自动提取文件名作为标题
        removeCommentsWhenCopyingTerminalFrames: true, // 复制终端代码时移除注释行
      },
      defaultProps: {
        wrap: false,
        collapseStyle: 'collapsible-auto',
        preserveIndent: true, // 保持缩进
        showLineNumbers: true,
        overridesByLang: {
          'ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh':
            {
              showLineNumbers: true,
            },
        },
      },
      styleOverrides: {
        borderRadius: '0.5rem',
        borderWidth: '1px',
        // 自定义复制按钮和框架样式
        frames: {
          shadowColor: 'rgba(0, 0, 0, 0.04)', // 柔和阴影
        },
        uiLineHeight: '1.4',
        codeFontSize: '0.875rem',
        codeLineHeight: '1.5',
        // 增强暗色模式对比度
        codeBackground: ['#1e1e1e', '#f6f8fa'],
        codeForeground: ['#d4d4d4', '#24292e']
      },
    }),
    mdx(),
    react(),
    sitemap(),
    icon(),
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["satori", "satori-html"],
      include: [
        "react",
        "react-dom",
        "clsx",
        "framer-motion",
        "lucide-react",
        "lodash.debounce",
        "@radix-ui/react-icons",
        "@radix-ui/react-avatar",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-scroll-area",
        "@radix-ui/react-separator",
        "@radix-ui/react-slot"
      ]
    },
    build: {
      // 代码分割优化
      rollupOptions: {
        output: {
          manualChunks: {
            // 将大型第三方库分离成单独的 chunk
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': ['@radix-ui/react-icons', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu'],
            'vendor-animation': ['framer-motion'],
            'vendor-utils': ['clsx', 'tailwind-merge', 'lodash.debounce'],
            'vendor-search': ['fuse.js'],
            'vendor-icons': ['lucide-react'],
          }
        }
      },
      // 压缩优化
      cssMinify: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // 生产环境移除 console
          drop_debugger: true,
        }
      },
      // 资源大小警告阈值
      chunkSizeWarningLimit: 1000,
    },
    // 开发服务器优化
    server: {
      fs: {
        allow: ['..']
      }
    }
  },

  server: {
    port: 3000,
    host: true,
  },

  devToolbar: {
    enabled: false,
  },

  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypeDocument,
        {
          css: 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css',
        },
      ],
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['nofollow', 'noreferrer', 'noopener'],
        },
      ],
      rehypeHeadingIds,
      [
        rehypeAutoLanguage,
        {
          enabled: true,
          fallbackLanguage: 'text',
          addDetectionMark: true,
          minCodeLength: 10,
          excludeLanguages: ['text', 'plain', 'txt']
        }
      ],
      rehypeKatex,

    ],
    remarkPlugins: [remarkMath, remarkEmoji, remarkSectionize],
  },
})

# 📝 BX's Blog

> 个人技术博客 - 网络安全 & CTF 研究

🌍 **网站：** [www.bx33661.com](https://www.bx33661.com)

## ✨ 特性

- 🎨 **现代化设计** - 基于 Astro 5 + React 19 + Tailwind CSS
- 🌙 **深浅主题** - 智能主题切换支持
- 📱 **响应式** - 移动端优先设计
- ⚡ **高性能** - 静态生成 + 图片优化
- 🔍 **搜索功能** - 内置文章搜索
- 🏷️ **标签系统** - 智能内容分类
- 📊 **SEO 优化** - 完整的 SEO 配置

## 🗺️ 内容区域

- **技术博客** - 网络安全、CTF、渗透测试
- **项目展示** - 开源项目和作品集
- **友链页面** - 与同好交流分享

## 🛠️ 技术栈

- **框架**: [Astro](https://astro.build/) 5.13.2
- **UI 库**: [React](https://react.dev/) 19.1.0
- **样式**: [Tailwind CSS](https://tailwindcss.com/) + CSS Variables
- **组件**: [Radix UI](https://www.radix-ui.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **图标**: [Lucide React](https://lucide.dev/)
- **代码高亮**: [Expressive Code](https://expressive-code.com/)
- **数学公式**: [KaTeX](https://katex.org/)
- **部署**: GitHub Pages + GitHub Actions

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm 或 yarn 或 pnpm

### 本地开发

```bash
# 克隆项目
git clone https://github.com/bx33661/bx33661.github.io.git
cd bx33661.github.io

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览生产版本
npm run preview
```

### 环境变量

创建 `.env` 文件：

```bash
# 数据库连接（可选）
NEON_DATABASE_URL=your_database_url_here
```

## 📁 项目结构

```
├── public/                 # 静态资源
│   ├── fonts/            # 字体文件
│   ├── gallery/          # 图片库
│   └── static/           # 项目截图
├── src/
│   ├── components/       # 组件
│   │   ├── react/        # React 组件
│   │   └── ui/           # UI 组件库
│   ├── config/           # 配置文件
│   ├── content/          # 内容集合
│   │   ├── blog/         # 博客文章
│   │   └── projects/     # 项目介绍
│   ├── layouts/          # 布局模板
│   ├── lib/              # 工具函数
│   ├── pages/            # 页面路由
│   └── styles/           # 样式文件
└── astro.config.ts       # Astro 配置
```

## ✍️ 内容管理

### 添加新文章

在 `src/content/blog/` 目录下创建 `.md` 文件：

```markdown
---
title: "文章标题"
description: "文章描述"
publishedAt: "2024-01-15"
tags: ["tag1", "tag2"]
featured: true
draft: false
---

# 文章内容

这里写你的文章内容...
```

### 添加新项目

在 `src/content/projects/` 目录下创建 `.md` 文件：

```markdown
---
title: "项目名称"
description: "项目描述"
technologies: ["React", "TypeScript"]
featured: true
live: "https://demo.example.com"
source: "https://github.com/username/repo"
---

# 项目介绍

详细介绍你的项目...
```

## 🔧 定制化

### 修改站点信息

编辑 `src/config/site.ts`：

```typescript
export const SITE: Site = {
  title: '你的名字',
  description: '你的博客描述',
  href: 'https://yourdomain.com',
  author: '你的名字',
  locale: 'zh-CN',
  location: 'China',
}
```

### 修改导航菜单

编辑 `src/config/navigation.ts`：

```typescript
export const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/blog', label: '博客' },
  { href: '/projects', label: '项目' },
  { href: '/about', label: '关于' },
]
```

## 🚀 部署

该项目使用 GitHub Actions 自动部署到 GitHub Pages。

### 部署步骤：

1. Fork 该仓库
2. 在 GitHub 仓库设置中启用 GitHub Pages
3. 选择 "GitHub Actions" 作为源
4. 推送代码到 main 分支即可触发自动部署

## 📊 SEO & 性能

- ✅ 语义化 HTML 结构
- ✅ Open Graph 和 Twitter Cards
- ✅ 自动生成 Sitemap
- ✅ RSS 订阅源
- ✅ 图片懒加载
- ✅ 代码分割和优化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 该项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 鸣谢

- [Astro](https://astro.build/) - 现代化的网站构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 优秀的组件库
- [Vercel](https://vercel.com/) - 部署和托管平台

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
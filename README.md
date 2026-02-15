# BX Blog (Astro)

个人博客项目，基于 Astro + React + Tailwind 构建，包含博客、笔记、项目、搜索、RSS、Sitemap 与 PWA 支持。

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址：`http://localhost:3000`

## 常用命令

```bash
# 类型检查
npm run typecheck

# 代码规范检查（Prettier）
npm run lint

# 运行测试
npm run test

# 一键检查（typecheck + lint + test）
npm run check

# 生产构建
npm run build
```

## 环境变量

复制模板并按需填写：

```bash
cp .env.example .env
```

生产环境至少建议配置：

- `SITE`
- `PUBLIC_ENABLE_ANALYTICS`
- `PUBLIC_GOOGLE_ANALYTICS_ID`（可选）
- `PUBLIC_GTM_ID`（可选）
- `PUBLIC_POSTHOG_KEY` / `PUBLIC_POSTHOG_HOST`（可选）

## 内容目录

- 博客：`src/content/blog`
- 笔记：`src/content/notes`
- 项目：`src/content/projects`

`slug` 为可选项；未提供时会根据文件名生成稳定 slug。

## 部署

GitHub Actions 工作流：`/Users/zhangboxiang/Progarm/bx33661/bx33661.github.io/.github/workflows/deploy.yml`  
推送到 `main` 分支后自动执行质量检查并部署到 GitHub Pages。

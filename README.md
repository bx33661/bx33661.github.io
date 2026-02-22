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

# 部署后 SEO 自检（Search Console 向）
# 默认读取 src/config/site.ts 的 href
npm run seo:check

# 指定目标站点
npm run seo:check -- --site https://www.bx33661.com

# 内容结构校验（frontmatter/slug/link/date）
npm run content:check

# 生成新内容模板（blog/notes/projects）
npm run content:new -- --type blog --title "Your Post Title"

# 同步 CyberChef 自托管静态包（默认版本见脚本）
npm run cyberchef:sync

# 指定 CyberChef 版本同步
CYBERCHEF_VERSION=v10.22.1 npm run cyberchef:sync
```

## CyberChef 集成说明

- 工具导航页：`/tools/`
- CyberChef 入口：`/tools/cyberchef/`
- 自托管静态目录：`public/vendor/cyberchef/`
- 同步脚本：`scripts/sync-cyberchef.mjs`
- CI 会在构建前自动执行同步（`.github/workflows/deploy.yml`）

> 说明：`public/vendor/cyberchef/` 默认已加入 `.gitignore`，避免将大体积发布包提交到仓库历史。

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

推荐发布前执行一次：

```bash
npm run content:check
```

## 部署

GitHub Actions 工作流：`/Users/zhangboxiang/Progarm/bx33661/bx33661.github.io/.github/workflows/deploy.yml`  
推送到 `main` 分支后自动执行质量检查并部署到 GitHub Pages。

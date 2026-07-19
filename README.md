# bx33661.github.io

BX 的个人站点（博客 / Notes / 相册），基于 [Astro](https://astro.build) 构建，部署到 GitHub Pages（自定义域名 [www.bx33661.com](https://www.bx33661.com)）。

## 环境要求

- **Node.js** ≥ 22.12
- 包管理器：**npm**（CI 使用 `npm ci`）

## 快速开始

```bash
# 安装依赖
npm ci

# 复制环境变量（可选）
cp .env.example .env

# 本地开发
npm run dev

# 类型 / lint / 源码冒烟
npm run check

# 生产构建（含 Pagefind 搜索索引）
npm run build

# 本地预览 dist
npm run preview

# 构建产物冒烟
npm run smoke:dist
```

开发服务器默认：<http://localhost:4321>

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 构建到 `dist/` + Pagefind |
| `npm run check` | ESLint + 源码 smoke |
| `npm run content:new` | 新建文章/笔记脚手架 |
| `npm run content:check` | 内容校验 |
| `npm run gallery:optimize` | 相册图片多尺寸优化 |
| `npm run baidu:push` | 推送新 URL 到百度（需 token） |
| `npm run lighthouse:ci` | Lighthouse 采集与断言 |

## 环境变量

见 [`.env.example`](./.env.example)。常用项：

| 变量 | 说明 |
|------|------|
| `SITE` / `BASE_URL` | 站点 origin 与 base path |
| `PUBLIC_ENABLE_ANALYTICS` | 是否启用分析（`true`/`false`） |
| `PUBLIC_ENABLE_COMMENTS` | 是否启用 Giscus 评论 |
| `PUBLIC_GISCUS_*` | Giscus 仓库与分类配置 |
| `BAIDU_PUSH_SITE` / `BAIDU_PUSH_TOKEN` | 百度普通收录推送（**勿提交 token**） |

GitHub Actions 部署时从 **Repository variables / secrets** 注入同名变量；百度 token 使用 `secrets.BAIDU_PUSH_TOKEN`。

## 项目结构（简）

```
src/
  config.ts          # 站点元数据（唯一 SITE 源）
  config/            # friends / env / theme
  content/           # 博客、笔记等内容集合
  pages/             # 路由
  components/        # UI 组件
  layouts/           # Layout / PostDetails / Main
public/              # 静态资源、CNAME、sw.js
scripts/             # 构建辅助与 smoke 检查
.github/workflows/   # Pages 部署 + 百度推送
```

站点配置入口：`src/config.ts`（`SITE.website` 等）。Astro `site` 与之对齐。

## 部署

推送到 `main` 后，[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) 会：

1. `npm ci` → `npm run check` → `npm run build` → `smoke:dist`
2. 部署 `dist/` 到 GitHub Pages
3. （可选）向百度推送新 URL，并回写 `.baidu-push-cache.json`

自定义域名：`public/CNAME` → `www.bx33661.com`。

边缘 301 / 安全响应头说明见 [`docs/EDGE_SETUP.md`](./docs/EDGE_SETUP.md)（GitHub Pages 本身不解析 `_headers` / `_redirects`）。

## 内容约定

- 博客：`src/content/blog/`
- 笔记：`src/content/notes/`
- 图片优先放 `public/` 或走 Astro 资源管线；文件名建议 kebab-case、避免空格

## 许可

个人站点内容，如无特别说明请先联系作者后再转载。

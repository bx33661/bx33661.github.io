<p align="center">
  <img src="docs/github-banner.png" alt="Astro Orbit" width="100%" />
</p>

<h1 align="center">Astro Orbit · 双语技术博客与知识库模板</h1>

<p align="center">
  以纸感学术版式、轨道星图与双语阅读体验为核心的 Astro 7 个人博客模板<br/>
  当前承载 <a href="https://www.bx33661.com"><strong>BX 的个人博客 (www.bx33661.com)</strong></a>
</p>

<p align="center">
  <a href="https://www.bx33661.com"><img src="https://img.shields.io/badge/site-bx33661.com-0ea5e9?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website" /></a>
  <a href="https://github.com/bx33661/bx33661.github.io/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/bx33661/bx33661.github.io/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=deploy" alt="Deploy" /></a>
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://pages.github.com/"><img src="https://img.shields.io/badge/GitHub%20Pages-live-222?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" /></a>
</p>

---

这是 [BX 的个人站点](https://www.bx33661.com) 的源码，保留了真实文章、个人介绍和域名配置。可以 Fork 后改成自己的博客；它不是去掉所有个人内容的空白主题。首次部署前，请按下方清单替换站点身份、首页内容和服务配置。

## 站点一览

| 模块  | 路径                                                | 说明                    |
| ----- | --------------------------------------------------- | ----------------------- |
| 博客  | [`/blog/`](https://www.bx33661.com/blog/)           | 安全研究、CTF、工程笔记 |
| Notes | [`/notes/`](https://www.bx33661.com/notes/)         | 短记录与学习备忘        |
| 相册  | [`/galleries/`](https://www.bx33661.com/galleries/) | 图片画廊                |
| 搜索  | [`/search/`](https://www.bx33661.com/search/)       | Pagefind 全文检索       |
| 友链  | [`/friends/`](https://www.bx33661.com/friends/)     | 朋友与组织              |

同时提供 [`/en/`](https://www.bx33661.com/en/) 英文版本首页、文章、笔记与检索路由。

技术栈：Astro 7 · MDX · React islands · Tailwind CSS 4 · Pagefind · GitHub Actions。静态页面部署在 GitHub Pages；搜索索引随构建生成，不需要独立搜索服务。

## 快速开始

```bash
# 推荐使用 .nvmrc 指定的 Node.js 22.23.1
npm ci
cp .env.example .env   # 可选

npm run dev            # http://localhost:4321
npm run verify:quick   # lint + 类型、源码和内容检查
npm run build          # dist/ + Pagefind
npm run preview
```

## 用作博客模板 (`astro-orbit`)

1. Fork 本仓库，安装 `.nvmrc` 指定的 Node.js 版本，运行 `npm ci`。
2. 优先编辑统一配置入口 [`src/config.ts`](./src/config.ts) 中的站点信息与身份字段：`website`、`title`、`author`、`email`、`defaultAuthorId`、`profile`、`brandLogo`、`ogKicker`、`footerTagline`、`footerColophon`、`friendCard`、`editPost` 等。`astro.config.ts` 的 `site` 与多个页面卡片均直接读取此处配置；仅改 `.env` 里的 `SITE` 不会覆盖它。
3. 改写 [`src/components/AcademicHome.astro`](./src/components/AcademicHome.astro) 中的个人介绍、教育经历与 `focusTopics`；按需要更新 `src/config/friends.ts`、`src/data/article-series.ts`、`src/data/academic/` 以及 `public/` 头像/品牌图标资源。
4. 用自己的文章替换 `src/content/blog/`，笔记和相册分别在 `src/data/notes/`、`src/data/galleries/`。保留本仓库现有文章时，请勿随意改动已发布的 slug 和图片 URL。
5. 自定义域名时，修改 [`public/CNAME`](./public/CNAME) 和 `.env`/GitHub Variables 中的站点地址。使用 GitHub Pages 默认域名时，移除 `public/CNAME`；若站点位于仓库子路径，还需在 `astro.config.ts` 配置 Astro 的 `base`，并检查以 `/` 开头的站内路径。
6. 运行 `npm run template:check` 审计尚未替换的模板默认字段（严格模式可加 `-- --strict`）；按需配置 `.env` 中的评论、统计与百度推送（详情见 [`.env.example`](./.env.example)）。

新文章或命令行工具可使用：

```bash
npm run cli                                                   # 打开 astro-orbit 命令面板
npm run content:new -- --title "文章标题" --slug "your-post-slug"  # 不传 --title 可进入交互向导
npm run template:check                                        # 检查尚未定制的个人/域名默认配置
npm run verify:full                                           # 完整质量与浏览器回归验证
```

脚手架生成的文章默认是草稿（`draft: true`）；完善内容和元数据后再改为公开。完整验证需要可用的 Chrome/Playwright Chromium，本仓库 CI 会安装浏览器。

## 常用脚本

| 命令                       | 说明                                             |
| -------------------------- | ------------------------------------------------ |
| `npm run cli`              | `astro-orbit` CLI 工具总览与快捷入口             |
| `npm run dev`              | 智能开发服务器（自动检测重复进程与锁文件状态）   |
| `npm run dev:force`        | 强制接管已有端口/锁并重启开发服务器              |
| `npm run dev:stop`         | 停止后台运行中的 Astro 开发服务器                |
| `npm run dev:status`       | 查看当前开发服务器状态                           |
| `npm run build`            | 生产构建 + Pagefind 搜索索引                     |
| `npm run check`            | ESLint + 单元测试 + 源码冒烟检查                 |
| `npm run harness:doctor`   | 运行环境、依赖、Git 状态与预览端口自检           |
| `npm run verify:quick`     | ESLint、Astro 类型、单元测试、源码和内容检查     |
| `npm run verify:full`      | 快速检查 + 构建、产物检查、桌面/移动端浏览器截图 |
| `npm run template:check`   | 模板个性化定制检查（识别遗留默认身份/域名配置）  |
| `npm run format`           | Prettier 代码与文档格式化                        |
| `npm run format:check`     | Prettier 格式校验                                |
| `npm run smoke:dist`       | 构建产物检查                                     |
| `npm run content:new`      | 新建文章/笔记脚手架（支持交互式向导）            |
| `npm run content:check`    | 内容元数据、本地图片与 slug 校验                 |
| `npm run gallery:optimize` | 相册多尺寸优化                                   |
| `npm run baidu:push`       | 百度收录推送（需 token）                         |

## 环境变量

详见 [`.env.example`](./.env.example)。

| 变量                      | 说明                     |
| ------------------------- | ------------------------ |
| `SITE` / `BASE_URL`       | 站点 origin 与 base path |
| `PUBLIC_ENABLE_ANALYTICS` | 分析开关                 |
| `PUBLIC_ENABLE_COMMENTS`  | Giscus 评论开关          |
| `PUBLIC_GISCUS_*`         | Giscus 配置              |
| `BAIDU_PUSH_TOKEN`        | 百度推送 token（勿提交） |

CI 从 GitHub Variables / Secrets 注入；百度 token 使用 `secrets.BAIDU_PUSH_TOKEN`。

## 结构

```text
src/
  config.ts        # 站点元信息和 Astro site 地址
  config/          # friends / env
  content/         # blog 文章
  data/            # notes、galleries、academic 数据
  pages/           # 路由
  components/      # UI
  layouts/         # Layout / PostDetails / Main
public/            # 静态资源、CNAME、sw.js
scripts/           # smoke / SEO / 内容工具
.github/workflows/ # Pages 部署 + 百度推送
docs/              # 部署说明与仓库视觉素材
```

## 部署

Fork 中配置好 GitHub Pages 后，推送到 `main` 会触发 Actions：

1. `npm ci` → `verify:full`（禁用线上评论/统计开关，执行检查、构建、搜索索引与浏览器回归）
2. 若仓库变量启用了 `PUBLIC_ENABLE_COMMENTS == 'true'` 或 `PUBLIC_ENABLE_ANALYTICS == 'true'`，使用生产环境变量重编 `dist/` 并执行 `smoke:dist`
3. 部署 `dist/` 到 GitHub Pages
4. 触发 `.github/workflows/baidu-notify.yml`，按需推送百度与 IndexNow 收录通知

其他分支的推送不会触发本站的 Pages 部署；针对 `main` 的 Pull Request 只运行构建检查（跳过条件线上重编）。

- 自定义域名：`public/CNAME` → `www.bx33661.com`
- 边缘 301 / 安全头：见 [`docs/EDGE_SETUP.md`](./docs/EDGE_SETUP.md)

## 仓库社交预览图

生成了 `docs/github-social.png`（1280×640）。若 About 区缩略图未更新，在仓库：

**Settings → General → Social preview → Edit → Upload image**  
选择 `docs/github-social.png` 即可。

## 内容约定

- 博客：`src/content/blog/`
- 笔记：`src/data/notes/`
- 相册元数据：`src/data/galleries/`
- 已发布文章的图片 URL 应保持稳定；新图可放 `public/`，需要 Astro 图片优化时放 `src/assets/`
- 全站布局 `src/layouts/Layout.astro` 已统一注入 `<meta name="referrer" content="no-referrer" />` 以减少外链图防盗链拦截，无需在文章正文中重复添加 `<meta>` 标签；外链图片应优先本地化到 `public/`

## 联系

- 站点：<https://www.bx33661.com>
- 邮件：bx33661@gmail.com
- 安全反馈：[`/.well-known/security.txt`](https://www.bx33661.com/.well-known/security.txt)

---

<p align="center">
  <sub>Built with Astro · Deployed on GitHub Pages</sub>
</p>

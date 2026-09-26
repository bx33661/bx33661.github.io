<p align="center">
  <img src="docs/github-banner.png" alt="BX Blog" width="100%" />
</p>

<h1 align="center">BX Blog · Astro 博客模板</h1>

<p align="center">
  一个正在使用的个人技术博客，也可作为 Astro 博客的起点<br/>
  <a href="https://www.bx33661.com"><strong>www.bx33661.com</strong></a>
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

| 模块 | 路径 | 说明 |
|------|------|------|
| 博客 | [`/blog/`](https://www.bx33661.com/blog/) | 安全研究、CTF、工程笔记 |
| Notes | [`/notes/`](https://www.bx33661.com/notes/) | 短记录与学习备忘 |
| 相册 | [`/galleries/`](https://www.bx33661.com/galleries/) | 图片画廊 |
| 搜索 | [`/search/`](https://www.bx33661.com/search/) | Pagefind 全文检索 |
| 友链 | [`/friends/`](https://www.bx33661.com/friends/) | 朋友与组织 |

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

## 用作博客模板

1. Fork 本仓库，安装 `.nvmrc` 指定的 Node.js 版本，运行上面的本地命令。
2. 修改 [`src/config.ts`](./src/config.ts) 中的站点地址、标题、作者、简介、GitHub 链接和文章编辑链接。`astro.config.ts` 的 `site` 取自这里；只改 `.env` 里的 `SITE` 不会替换它。
3. 改写 [`src/components/AcademicHome.astro`](./src/components/AcademicHome.astro) 中的个人介绍、教育经历、联系方式和近期动态；项目与奖项分别在 `src/data/academic/projects/`、`src/data/academic/awards/`。按需要检查 `src/config/friends.ts`、页眉、页脚和头像等 `public/` 资源。
4. 用自己的文章替换 `src/content/blog/`，笔记和相册在 `src/data/notes/`、`src/data/galleries/`。保留本仓库现有文章时，不要随意改动已发布的 slug 和图片 URL。
5. 自定义域名时，修改 [`public/CNAME`](./public/CNAME) 和 `.env`/GitHub Variables 中的站点地址。使用 GitHub Pages 默认域名时，移除 `public/CNAME`；若站点位于仓库子路径，还需在 `astro.config.ts` 配置 Astro 的 `base`，并逐一检查目前以 `/` 开头的站内链接和资源路径。只设置 `BASE_URL` 环境变量不足以完成子路径部署。
6. 按需配置评论、统计和百度推送；不用的服务保持关闭。配置项见 [`.env.example`](./.env.example)，密钥放在 GitHub Secrets，不写进仓库。

仓库里仍有个人资料、文章和服务地址。公开自己的版本前，可运行 `rg -n 'bx33661|www\.bx33661\.com' src public .github` 检查遗留引用。模板改造应在自己的 Fork 中进行，不需要修改本站的已发布 URL。

新文章可用：

```bash
npm run content:new -- --title "文章标题" --slug "your-post-slug"
npm run verify:full
```

脚手架生成的文章默认是草稿；完善内容和元数据后再改为公开。完整验证需要可用的 Chrome/Playwright Chromium，本仓库 CI 会安装浏览器。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 + 搜索索引 |
| `npm run check` | ESLint + 源码冒烟检查 |
| `npm run verify:quick` | ESLint、Astro 类型、源码和内容检查 |
| `npm run verify:full` | 快速检查 + 构建、产物检查、桌面/移动端浏览器截图 |
| `npm run smoke:dist` | 构建产物检查 |
| `npm run content:new` | 新建文章脚手架 |
| `npm run gallery:optimize` | 相册多尺寸优化 |
| `npm run baidu:push` | 百度收录推送（需 token） |

## 环境变量

详见 [`.env.example`](./.env.example)。

| 变量 | 说明 |
|------|------|
| `SITE` / `BASE_URL` | 站点 origin 与 base path |
| `PUBLIC_ENABLE_ANALYTICS` | 分析开关 |
| `PUBLIC_ENABLE_COMMENTS` | Giscus 评论开关 |
| `PUBLIC_GISCUS_*` | Giscus 配置 |
| `BAIDU_PUSH_TOKEN` | 百度推送 token（勿提交） |

CI 从 GitHub Variables / Secrets 注入；百度 token 使用 `secrets.BAIDU_PUSH_TOKEN`。

## 结构

```text
src/
  config.ts        # 站点元信息和 Astro site 地址
  config/          # friends / env / theme
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

1. `npm ci` → `verify:full`（包含构建、搜索索引和浏览器检查）
2. 部署 `dist/` 到 GitHub Pages
3. 若配置了 token，再执行百度 URL 推送

其他分支的推送不会触发本站的 Pages 部署；针对 `main` 的 Pull Request 只运行构建检查。

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
- 外链图（如语雀 CDN）若遇防盗链，文内可保留 `<meta name="referrer" content="no-referrer">`

## 联系

- 站点：<https://www.bx33661.com>
- 邮件：bx33661@gmail.com
- 安全反馈：[`/.well-known/security.txt`](https://www.bx33661.com/.well-known/security.txt)

---

<p align="center">
  <sub>Built with Astro · Deployed on GitHub Pages</sub>
</p>

<p align="center">
  <img src="docs/github-banner.png" alt="BX Blog" width="100%" />
</p>

<h1 align="center">BX · 个人技术博客</h1>

<p align="center">
  网络安全 · CTF · Web 安全 · 工程实践<br/>
  <a href="https://www.bx33661.com"><strong>www.bx33661.com</strong></a>
</p>

<p align="center">
  <a href="https://www.bx33661.com"><img src="https://img.shields.io/badge/site-bx33661.com-0ea5e9?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Website" /></a>
  <a href="https://github.com/bx33661/bx33661.github.io/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/bx33661/bx33661.github.io/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=deploy" alt="Deploy" /></a>
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-6-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://pages.github.com/"><img src="https://img.shields.io/badge/GitHub%20Pages-live-222?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" /></a>
</p>

---

## ✨ 站点一览

| 模块 | 路径 | 说明 |
|------|------|------|
| 博客 | [`/blog/`](https://www.bx33661.com/blog/) | 安全研究、CTF、工程笔记 |
| Notes | [`/notes/`](https://www.bx33661.com/notes/) | 短记录与学习备忘 |
| 相册 | [`/galleries/`](https://www.bx33661.com/galleries/) | 图片画廊 |
| 搜索 | [`/search/`](https://www.bx33661.com/search/) | Pagefind 全文检索 |
| 友链 | [`/friends/`](https://www.bx33661.com/friends/) | 朋友与组织 |

技术栈：**Astro 6** · React · Tailwind CSS 4 · Pagefind · GitHub Actions

## 🚀 快速开始

```bash
# 环境：Node.js ≥ 22.12
npm ci
cp .env.example .env   # 可选

npm run dev            # http://localhost:4321
npm run check          # lint + smoke
npm run build          # dist/ + Pagefind
npm run preview
```

## 📜 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 + 搜索索引 |
| `npm run check` | ESLint + 源码冒烟检查 |
| `npm run smoke:dist` | 构建产物检查 |
| `npm run content:new` | 新建文章脚手架 |
| `npm run gallery:optimize` | 相册多尺寸优化 |
| `npm run baidu:push` | 百度收录推送（需 token） |

## ⚙️ 环境变量

详见 [`.env.example`](./.env.example)。

| 变量 | 说明 |
|------|------|
| `SITE` / `BASE_URL` | 站点 origin 与 base path |
| `PUBLIC_ENABLE_ANALYTICS` | 分析开关 |
| `PUBLIC_ENABLE_COMMENTS` | Giscus 评论开关 |
| `PUBLIC_GISCUS_*` | Giscus 配置 |
| `BAIDU_PUSH_TOKEN` | 百度推送 token（**勿提交**） |

CI 从 GitHub **Variables / Secrets** 注入；百度 token 使用 `secrets.BAIDU_PUSH_TOKEN`。

## 📁 结构

```text
src/
  config.ts        # SITE 唯一配置源
  config/          # friends / env / theme
  content/         # blog、notes 等内容集合
  pages/           # 路由
  components/      # UI
  layouts/         # Layout / PostDetails / Main
public/            # 静态资源、CNAME、sw.js
scripts/           # smoke / SEO / 内容工具
.github/workflows/ # Pages 部署 + 百度推送
docs/              # 部署说明与仓库视觉素材
```

## 🌐 部署

推送到 `main` 后，Actions 会：

1. `npm ci` → `check` → `build` → `smoke:dist`
2. 部署 `dist/` 到 **GitHub Pages**
3. 可选：百度 URL 推送

- 自定义域名：`public/CNAME` → `www.bx33661.com`
- 边缘 301 / 安全头：见 [`docs/EDGE_SETUP.md`](./docs/EDGE_SETUP.md)

## 🖼️ 仓库社交预览图

生成了 `docs/github-social.png`（1280×640）。若 About 区缩略图未更新，在仓库：

**Settings → General → Social preview → Edit → Upload image**  
选择 `docs/github-social.png` 即可。

## 📝 内容约定

- 博客：`src/content/blog/`
- 笔记：`src/content/notes/`
- 图片优先放 `public/`；文件名建议 kebab-case，避免空格

## 📬 联系

- 站点：<https://www.bx33661.com>
- 邮件：bx33661@gmail.com
- 安全反馈：[`/.well-known/security.txt`](https://www.bx33661.com/.well-known/security.txt)

---

<p align="center">
  <sub>Built with Astro · Deployed on GitHub Pages</sub>
</p>

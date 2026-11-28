<div align="center">

<a href="https://www.bx33661.com">
  <img src="docs/github-banner.png" alt="BX's Blog" width="100%" />
</a>

<br /><br />

<h1>BX's Blog</h1>

<p>
  <strong>网络安全 · CTF · Web 安全 · AI 安全与工程实践</strong>
</p>

<p>
  <a href="https://www.bx33661.com"><img src="https://img.shields.io/badge/site-www.bx33661.com-0ea5e9?style=flat-square&logo=googlechrome&logoColor=white" alt="Website" /></a>
  <a href="https://github.com/bx33661/bx33661.github.io/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/bx33661/bx33661.github.io/deploy.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=deploy" alt="Deploy" /></a>
  <a href="https://github.com/bx33661/astro-orbit"><img src="https://img.shields.io/badge/theme-Astro%20Orbit-1e293b?style=flat-square&logo=astro&logoColor=38bdf8" alt="Powered by Astro Orbit" /></a>
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-7-bc52ee?style=flat-square&logo=astro&logoColor=white" alt="Astro 7" /></a>
  <a href="https://www.bx33661.com/rss.xml"><img src="https://img.shields.io/badge/feed-RSS-f97316?style=flat-square&logo=rss&logoColor=white" alt="RSS Feed" /></a>
</p>

<p>
  <a href="https://www.bx33661.com">在线访问</a>
  &nbsp;·&nbsp;
  <a href="https://www.bx33661.com/blog/">文章</a>
  &nbsp;·&nbsp;
  <a href="https://www.bx33661.com/notes/">短记</a>
  &nbsp;·&nbsp;
  <a href="https://www.bx33661.com/projects/">项目</a>
  &nbsp;·&nbsp;
  <a href="https://www.bx33661.com/galleries/">相册</a>
  &nbsp;·&nbsp;
  <a href="https://www.bx33661.com/en/">English</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/bx33661/astro-orbit">使用同款模板 ↗</a>
</p>

</div>

---

> [!TIP]
> 本仓库承载 [**BX 的个人技术博客**](https://www.bx33661.com) 源码与全量文章内容（含个人文章、域名 `CNAME` 与站内数据）。
> 如果你想搭建同款双语学术 / 技术博客，请直接使用独立维护的开源模板仓库：**[`bx33661/astro-orbit`](https://github.com/bx33661/astro-orbit)**。

## 站点导览

| 模块       | 路径                                                | 说明                                            |
| :--------- | :-------------------------------------------------- | :---------------------------------------------- |
| **文章**   | [`/blog/`](https://www.bx33661.com/blog/)           | 漏洞分析、CTF Writeup、Web / AI 安全与工程实践  |
| **短记**   | [`/notes/`](https://www.bx33661.com/notes/)         | 碎片思考、排查备忘与实验记录                    |
| **项目**   | [`/projects/`](https://www.bx33661.com/projects/)   | 开源工具与安全研究项目展示                      |
| **相册**   | [`/galleries/`](https://www.bx33661.com/galleries/) | 摄影与生活记录画廊                              |
| **检索**   | [`/search/`](https://www.bx33661.com/search/)       | Pagefind 构建期静态全文搜索                     |
| **友链**   | [`/friends/`](https://www.bx33661.com/friends/)     | 朋友站点、安全团队与研究组织                    |
| **英文版** | [`/en/`](https://www.bx33661.com/en/)               | 英文首页、文章、短记、归档与独立 RSS / 搜索索引 |

## 技术栈与工程体系

- **核心架构**：基于 **Astro 7**、MDX、React Islands、Tailwind CSS 4 与 TypeScript 5 构建，纯静态输出至 GitHub Pages。
- **阅读与排版**：自托管 **Plus Jakarta Sans** + **JetBrains Mono** 可变字体，支持双语路由、明暗主题切换、Mermaid 图表、交互式演示岛屿与 **Pagefind** 离线全文检索。
- **上游模板同步**：主题与通用引擎已接入 [`bx33661/astro-orbit`](https://github.com/bx33661/astro-orbit) 上游基线，可通过标准 Git 合并同步通用能力改进（详见 [`docs/UPSTREAM_SYNC.md`](./docs/UPSTREAM_SYNC.md)）。
- **质量与自动部署**：通过 `npm run verify:full`（ESLint、`astro check`、单元测试、内容校验、产物冒烟、Playwright 视觉/动效回归）把关，推送 `main` 后自动部署至 GitHub Pages 并触发百度 / IndexNow 收录推送。

## 本地写作与同步

```bash
npm ci                                                           # 安装依赖（Node 版本见 .nvmrc）
npm run dev                                                      # 启动本地开发服务器 (http://localhost:4321)
npm run content:new -- --title "文章标题" --slug "post-slug"     # 新建文章/笔记脚手架（支持交互向导）
npm run verify:quick                                             # 提交前快速检查：lint + typecheck + test + content:check
npm run verify:full                                              # 完整验证：快速检查 + build + 产物冒烟 + Playwright 回归
```

从上游模板仓库 [`bx33661/astro-orbit`](https://github.com/bx33661/astro-orbit) 同步通用更新：

```bash
git fetch upstream && git merge upstream/main
```

<details>
<summary><strong>工程参考：目录结构 · 常用脚本 · 环境变量与 CI/CD 部署</strong></summary>

### 目录结构

```text
src/
  config.ts          # 站点元信息、多语言主页文案与全局身份配置
  config/            # 友链分组与环境变量读取
  content/blog/      # Markdown / MDX 技术文章（含中英文对照）
  data/              # notes、galleries、系列文章与学术数据
  pages/             # 中英文路由、RSS、Sitemap 与动态 manifest
  components/        # 通用模板组件与博客专属交互专题组件
  layouts/           # Layout / Main / PostDetails
public/              # 静态资源、CNAME、_headers、_redirects、sw.js
scripts/             # 内容脚手架、冒烟测试、Playwright 回归、SEO 推送脚本
.github/workflows/   # GitHub Pages 构建部署、百度/IndexNow 通知工作流
docs/                # 工程文档、上游同步说明与社交预览资源
```

### 常用脚本

| 命令                                     | 说明                                                  |
| :--------------------------------------- | :---------------------------------------------------- |
| `npm run cli`                            | 打开命令行工具面板                                    |
| `npm run dev` / `dev:force` / `dev:stop` | 智能开发服务器与锁文件/端口管理                       |
| `npm run harness:doctor`                 | 检查本地 Node、依赖、Git 状态与预览端口健康度         |
| `npm run content:new` / `content:check`  | 新建文章脚手架与前置元数据、图片、slug 校验           |
| `npm run build` / `npm run preview`      | 生产构建 + Pagefind 搜索索引 / 本地预览产物           |
| `npm run verify:quick` / `verify:full`   | 快速静态与单测检查 / 全量构建与 Playwright 浏览器回归 |
| `npm run smoke:site`                     | 对 `dist/` 执行站点路由、字体与组件结构冒烟检查       |
| `npm run gallery:optimize`               | 生成相册多分辨率优化图像                              |
| `npm run baidu:push` / `seo:check`       | 百度收录推送与线上 SEO 元信息校验                     |

### 环境变量与自动部署

完整变量说明见 [`.env.example`](./.env.example)：

| 变量                                         | 说明                                      |
| :------------------------------------------- | :---------------------------------------- |
| `SITE` / `BASE_URL`                          | 站点 Origin 与 Base Path                  |
| `PUBLIC_ENABLE_ANALYTICS`                    | 统计分析开关                              |
| `PUBLIC_ENABLE_COMMENTS` / `PUBLIC_GISCUS_*` | Giscus 评论开关与仓库配置                 |
| `BAIDU_PUSH_TOKEN`                           | 百度推送 Token（仅存放在 GitHub Secrets） |

推送至 `main` 后，`.github/workflows/deploy.yml` 会依次执行：

1. `npm ci` 与 `npm run verify:full`（关闭线上统计/评论环境变量执行全量检查与浏览器回归）
2. 若启用了评论或统计变量，则以生产环境变量重编 `dist/` 并执行 `npm run smoke:dist`
3. 发布 `dist/` 至 GitHub Pages（自定义域名 `www.bx33661.com` 由 `public/CNAME` 绑定，边缘规则见 [`docs/EDGE_SETUP.md`](./docs/EDGE_SETUP.md)）
4. 触发 `.github/workflows/baidu-notify.yml` 推送百度与 IndexNow 收录通知（仓库社交预览图位于 `docs/github-social.png`）

</details>

## 联系

- **站点**：<https://www.bx33661.com>
- **邮箱**：`bx33661@gmail.com`
- **安全反馈**：[`/.well-known/security.txt`](https://www.bx33661.com/.well-known/security.txt)

---

<p align="center">
  <sub>Crafted by BX · Powered by <a href="https://github.com/bx33661/astro-orbit">Astro Orbit</a> · Deployed on GitHub Pages</sub>
</p>

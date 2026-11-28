<h1 align="center">Astro Orbit</h1>

<p align="center">
  <strong>基于 Astro 7、Tailwind CSS 4、MDX 与 Pagefind 构建的双语学术风技术博客与个人知识库模板。</strong><br/>
  <a href="./README.md">English</a> · 简体中文
</p>

<p align="center">
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro 7" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" /></a>
  <a href="https://pagefind.app"><img src="https://img.shields.io/badge/Search-Pagefind-1158D1?style=for-the-badge" alt="Pagefind" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## 特性亮点

- **纸感学术排版与主题配色系统**：内置 6 套强调色预设（`cobalt` / `emerald` / `amber` / `violet` / `rose` / `slate`）及自定义十六进制主色，支持默认亮/暗模式、按钮圆心 View Transitions 过渡动画与单 Pass WebGPU 星图 Shader；动态 OG 封面图自动跟随配色。
- **双语 / 单语全链路一致**：默认英文根路由（`/`）+ 中文次路由（`/zh/`），也可设 `DEFAULT_LOCALE = "zh-CN"` 或 `BILINGUAL = false`；包含导航、画廊控件、Markdown Callouts、脚注与开发审计面板在内的所有交互界面均完整双语化。
- **零侵入单文件配置引擎（`src/config.ts`）**：统一控制笔记、项目（含 GitHub 热力图）、友链、画廊、归档、搜索、社交链接、文章分享按钮与零负担统计分析（Umami / Plausible / GA4，自动同步 CSP 白名单）。
- **完整写作流水线**：内置 MDX、GFM 表格/任务列表、KaTeX 数学公式、Mermaid 流程图、GitHub Callouts、Shiki 代码文件名/高亮/Diff/长代码折叠、阅读时长估算及本地图片尺寸自动注入。
- **零后端本地全文搜索**：生产环境使用 Pagefind 静态索引（`⌘K` 弹窗 + `/search/` 页面），本地开发自动使用 JSON 回退检索，完整兼容子路径部署（`BASE_URL`）。
- **开源自托管字体**：通过 Astro 7 原生 Fonts API 本地打包 Plus Jakarta Sans 与 JetBrains Mono，无第三方字体追踪。
- **开箱即用 CLI 工具链**：内置 `npm run setup` 初始化向导、`npm run clean:demo` 一键清理示例数据、`content:new`、`content:check`、`template:check` 与浏览器端 Astro Dev Toolbar 审计面板。

---

## 快速开始

```bash
# 通过 Astro CLI 创建
npm create astro@latest -- --template bx33661/astro-orbit

# 安装依赖
npm install

# 运行交互式初始化向导（自动更新 src/config.ts）
npm run setup

# 可选：一键清理示例文章与画廊素材，生成 hello-world 起步文章
npm run clean:demo -- --yes

# 启动本地开发服务器
npm run dev
```

浏览器访问 `http://localhost:4321` 即可预览。

---

## 核心配置（`src/config.ts`）

所有站点元信息、首页文案、主题配色、社交/分享渠道、语言设置与模块开关统一集中在 [`src/config.ts`](./src/config.ts)，详细配置手册见 **[Customization Guide](./docs/CUSTOMIZATION.md)**：

- **站点地址与子路径**：修改 `SITE_ORIGIN` 与 `SITE_BASE`（GitHub Pages 子路径项目页可设为 `"/repo-name/"`）。
- **默认语言与双语开关**：修改 `DEFAULT_LOCALE`（`"en"` / `"zh-CN"`）与 `BILINGUAL`（`true` / `false`）。
- **模块开关（`FEATURES`）**：按需开启或关闭 `notes`、`projects`、`friends`、`galleries`、`archives`、`search`、`githubHeatmap`、`pwa`、`dynamicOgImage`。

扩展数据文件：
- [`src/config/friends.ts`](./src/config/friends.ts)：动态友链分组
- [`src/data/projects.ts`](./src/data/projects.ts)：项目卡片列表
- [`src/data/article-series.ts`](./src/data/article-series.ts)：系列文章章节排序
- [`src/data/gallery.ts`](./src/data/gallery.ts)：画廊轮播图与元信息

---

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run setup` | 交互式配置站点标题、作者、配色预设、模块开关与语言 |
| `npm run clean:demo` | 一键移除示例文章、笔记与画廊素材（支持 `--dry-run` / `--yes`） |
| `npm run dev` | 启动本地开发服务器（自动处理锁文件冲突） |
| `npm run build` | 执行生产构建并生成 Pagefind 全站索引 |
| `npm run content:new` | 新建文章或笔记草稿（`draft: true`） |
| `npm run content:check` | 校验 Frontmatter、Slug 唯一性与本地图片 |
| `npm run template:check` | 审计是否还有未替换的模板默认占位信息 |
| `npm run gallery:optimize` | 将 `src/data/galleries/` 图片转为多尺寸 AVIF/WebP/JPG |
| `npm run github:contributions` | 使用 `gh` CLI 刷新 GitHub 贡献热力图快照 |
| `npm run verify:full` | 依次运行 Lint、类型检查、单元测试、内容校验、构建与产物冒烟测试 |

---

## 部署

### GitHub Pages（内置工作流）

推送代码到 `main` 分支即可触发 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)。
- 部署在根域名时保持 `BASE_URL=/`。
- 部署在仓库子路径（`https://<user>.github.io/<repo>/`）时，在仓库 Variables 中设置 `SITE` 与 `BASE_URL=/<repo>/`。

### Vercel / Cloudflare Pages / Netlify

仓库已内置 [`vercel.json`](./vercel.json) 与 [`netlify.toml`](./netlify.toml)（配置了静态资源长期缓存与安全响应头）：
- **Build command**：`npm run build`
- **Output directory**：`dist`
- **Node.js**：`22`（内置 `.nvmrc`）

---

## 开源协议

[MIT](./LICENSE)

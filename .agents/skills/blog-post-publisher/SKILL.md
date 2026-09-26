---
name: blog-post-publisher
description: "Astro 个人技术博客发布与全流程规范审计套件。在新增、搬运（语雀/Notion/Typora）或重构文章时触发。提供包含 Frontmatter 校验、图片语义化重构、标签归一化、排版清洗、自动化 Lint 脚本（lint-post.mjs）与构建验收的全套工程规范。"
---

# Astro 博客文章发布与规范化审计套件 (blog-post-publisher)

本套件为当前 Astro 个人技术博客的官方发布规范指南与自动化工程套件，用于保障所有新增、搬迁与编辑的博客文章在 SEO、渲染性能、语法规范、代码质量和目录语义上保持高度统一。

---

## 快速工作流 (Standard Workflow)

```text
[阶段 1: 准备与初始化]
  │── 新建: 从 templates/article-template.md 派生
  └── 搬迁: 接收外部 Markdown 稿件 (语雀 / Notion / Typora)
         ↓
[阶段 2: 规范化处理]
  │── 1. Frontmatter 严格规范化 (首行起始、Slug 校验、标签归一化)
  │── 2. 静态资源工程化 (建立 public/blog/<slug>/、去除空格、序号语义化命名)
  └── 3. 内容与排版深度清洗 (代码高亮、清理 OCR/font 杂质、收敛空行)
         ↓
[阶段 3: 自动化验证]
  │── 运行套件专属检测: node .agents/skills/blog-post-publisher/scripts/lint-post.mjs <file> --fix
  │── 运行系统完整性检测: npm run verify:quick
  └── 运行全站编译、搜索索引与产物检查: npm run verify:full
         ↓
[阶段 4: 交付修改]
  └── 记录检查结果；提交、推送和上线分别等待任务明确要求
```

---

## 一、Frontmatter 规范约束

所有文章存放在 `src/content/blog/<文件名>.md`（或 `.mdx`），且文件**第 1 行严格以 `---` 起始**（禁止在 `---` 前出现多余空行）。

### 新文章建议填写的元数据字段

运行时字段约束以 `src/content.config.ts` 为准；全站附加检查以 `scripts/content-check.mjs` 为准。`docs/HARNESS.md` 记录两者差异。本节是新文章的编辑模板，不把可选字段误称为 Schema 必填。

```yaml
---
title: "文章主标题：简洁且有明确技术指向"
description: "一至两句话概括核心发现或技术要点，用于 SEO Meta Description 与列表页预览"
date: YYYY-MM-DD
tags:
  - "Web"
  - "安全审计"
  - "CTF"
authors:
  - "bx"
draft: false
slug: "kebab-case-unique-slug"
---
```

### 字段级工程规范

1. **`slug` 字段**：
   - 必须为纯英文字母、数字和短横线组成的短横线命名法（`kebab-case`）；
   - 严禁包含下划线、空格、中文或特殊符号；
   - 示例：`wechat-miniapp-security-audit`、`cnvd-2026-20654-lg-nas-rce`。

2. **`tags` 标签字典归一化**（杜绝同一技术因大小写或中英混淆生成碎片化的分类页）：
   - **技术体系**：`CTF`、`Web`、`AI`、`LLM`、`Security`、`SSTI`、`RCE`、`IDOR`、`XSS`、`XXE`、`CodeQL`
   - **编程语言**：`Python`、`JavaScript`、`TypeScript`、`Java`、`Go`、`Nginx`、`Lua`
   - **业务场景**：使用规范技术术语（如 `微信小程序`、`内网渗透`、`安全审计`、`逆向工程`）

3. **`authors` 字段**：统一为 `["bx"]`。
4. **`draft` 字段**：发布上线时设为 `false`。
5. **防盗链标头**：正文第 1 行建议紧跟 `<meta name="referrer" content="no-referrer" />`，保障引用外链图片时不会被第三方防盗链拦截。

---

## 二、图片与静态资源工程化治理

### 1. 独占目录与引用路径
- 每篇文章的本地图片必须集中存放于：`public/blog/<slug>/`
- Markdown 正文中的引用路径格式：`/blog/<slug>/<规范文件名>`
- 严禁不同文章混用同一图片目录，禁止零散散落在 `public/` 根目录。

### 2. 文件命名工业标准
- **禁止包含空格**：严禁出现 `image 1.png`，空格会导致 URL 编码为 `%20`，极易在外部转发、RSS 或构建中断链；
- **禁止原始截图名/UUID**：严禁使用 `PixPin_2026-xx.png`、`image.png` 或无序 UUID；
- **命名结构**：`[序号]-[功能模块/页面]-[简要语义说明].[ext]`
  - 示例：`01-environment-setup.png`、`02-vulnerable-code-snippet.png`、`03-poc-execution-result.png`
  - 如果为长流程操作演示序列：`step-00.png`、`step-01.png`、...、`step-72.png`

### 3. 断链排查清单
- 严禁遗留客户端本地临时绝对路径（如 `C:\Users\...\AppData\Roaming\Typora\`）；
- 严禁出现空的图片占位符号（如 `![]()`）。

---

## 三、正文排版与富文本导入清洗指南

### 1. 标题与结构层级
- 正文首个章节标题必须从二级标题 `## ` 开始（页面的 `<h1>` 已经由主题模板根据 Frontmatter 的 `title` 统一样式渲染，且项目配置了 `rehypeDemoteHeadings` 避免双 H1）；
- 严格禁止出现无文本的空标题标签（如 `### ` 或 `###   `）；
- 严禁无序跨级跳跃（如 `##` 紧接着 `####`）。

### 2. 代码块与格式美化
- 所有代码围栏（Code Fence）**严禁裸奔**，必须显式指定语法高亮标识：
  - 架构拓扑 / 目录结构树 / 流程图：`text` 或 `plain`（严禁将目录树标注为 `json` 或 `xml`）
  - 终端命令：`bash`、`shell`
  - 程序源码：`python`、`javascript`、`typescript`、`go`、`java`、`json`、`yaml` 等
- 行内代码与管道符冲突处理：Markdown 表格内包含 `|` 时，必须使用转义字符 `\|`，避免破坏表格行列结构。

### 3. 富文本平台（语雀/Notion 等）导入杂质清理
- **移除 OCR 描述注释**：语雀导出的 Markdown 中常带有 `<!-- 这是一张图片，ocr 内容为： -->`，发布前必须全部剔除；
- **清除富文本内联标签**：清理残留的 `<font style="...">` 及其闭合标签，转换为原生反引号或加粗语法。

### 4. 空行与空白符控制
- 代码块外禁止连续出现 3 行以上的冗余空行，保持标准的双换行（`\n\n`）段落节奏；
- 清理除 Markdown 行尾换行标记（2 个空格）以外的所有非语法性行尾孤立空格。

---

## 四、自动化检查与发布执行脚本

套件已内置专属的自动化检查脚本 `lint-post.mjs`，在发布新文章或完成文章编辑后，按顺序执行以下 3 步：

```bash
# 步骤 1: 执行文章针对性规范审计（带 --fix 可自动修复格式与标签归一化）
node .agents/skills/blog-post-publisher/scripts/lint-post.mjs src/content/blog/你的文章.md --fix

# 步骤 2: 执行快速验证（包含内容检查）
npm run verify:quick

# 步骤 3: 全站静态构建、Pagefind 索引与产物检查
npm run verify:full
```

检查通过只代表本地验证结果；提交、推送和部署是独立动作，按当前任务的明确要求执行。

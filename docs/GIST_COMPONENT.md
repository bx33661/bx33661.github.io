# Gist 组件使用文档

## 简介

`src/components/Gist.astro` 用于在 MDX 博客文章中渲染 GitHub Gist 外链卡片（跳转到 `https://gist.github.com/<id>` 新标签页），使用站内 CSS 变量（`--surface`、`--surface-raised`、`--border`、`--foreground`）适配浅色/深色主题，无需加载第三方 iframe 或阻断阅读渲染。

## 使用方法

### 1. 在 `.mdx` 文章中导入组件

在 `src/content/blog/`（`.mdx` 文件）的 frontmatter 之后导入组件：

```mdx
---
title: "你的文章标题"
description: "文章摘要"
date: 2026-07-29
---

import Gist from "@/components/Gist.astro";
```

也支持使用相对路径（如 `../../components/Gist.astro`）。

### 2. 渲染 Gist 卡片

```mdx
<Gist id="5672adaff13bc2bbae43f025faaebda2" />
```

可选自定义标题与语言：

```mdx
<Gist id="5672adaff13bc2bbae43f025faaebda2" title="Exploit PoC 完整源码" />
<Gist id="5672adaff13bc2bbae43f025faaebda2" locale="en" title="Full Exploit PoC" />
```

## Props

| 参数     | 类型              | 必填 | 默认值                                           | 说明                                  |
| -------- | ----------------- | ---- | ------------------------------------------------ | ------------------------------------- |
| `id`     | `string`          | 是   | -                                                | Gist ID（或 `username/gist_id` 路径） |
| `title`  | `string`          | 否   | 按路径语言默认为 `"完整代码"` 或 `"Full code"`   | 卡片主标题文本                        |
| `locale` | `"en" \| "zh-CN"` | 否   | 由 `localeFromPath(Astro.url.pathname)` 自动推断 | 控制默认标题与按钮文案的本地化语言    |

## 仓库参考示例

- 中文原文：[src/content/blog/CNVD-2026-20654-LG-NAS命令注入.mdx](../src/content/blog/CNVD-2026-20654-LG-NAS命令注入.mdx)
- 英文译文：[src/content/blog/cnvd-2026-20654-lg-nas-rce-en.mdx](../src/content/blog/cnvd-2026-20654-lg-nas-rce-en.mdx)

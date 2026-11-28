---
title: "Astro Orbit 快速上手指南"
description: "五分钟完成站点信息配置、模块开关定制、双语路由切换与静态部署。"
date: 2026-11-10
modDatetime: 2026-11-20
tags:
  - "Astro"
  - "指南"
  - "模板"
authors:
  - "orbit"
slug: "getting-started-with-astro-orbit-zh"
lang: "zh-CN"
translationKey: "getting-started"
---

## Table of contents

## 概览

**Astro Orbit** 是一套基于 Astro 7、Tailwind CSS 4、MDX 与 Pagefind 构建的纸感学术风技术博客与个人知识库模板。

站点身份、首页文案、双语开关与页面模块开关全部收口在 `src/config.ts`。

## 快速初始化

克隆仓库后运行交互式配置向导：

```bash
npm run setup
```

也可以直接编辑 `src/config.ts`：

- **站点身份**：`title`、`author`、`email`、`profile`、`website`、`base`
- **语言模式**：`i18n.defaultLocale`（`"en"` 或 `"zh-CN"`）与 `i18n.bilingual`（`true` / `false`）
- **功能开关**：`features.notes`、`features.projects`、`features.friends`、`features.galleries`、`features.archives`、`features.search`、`features.githubHeatmap`、`features.pwa`、`features.dynamicOgImage`

> [!TIP]
> 部署前可随时运行 `npm run template:check` 审计尚未替换的默认占位信息。

## 创作与构建

使用内置 CLI 脚手架创建文章或笔记草稿：

```bash
npm run content:new -- --title "我的第一篇文章" --tags "Astro, 工程实践"
npm run content:check
```

新建内容默认设置 `draft: true`，完善内容后改为 `draft: false` 即可发布。

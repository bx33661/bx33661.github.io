---
title: "Astro 7 字体接口与严格 CSP 策略"
description: "记录如何在 Astro 7 中自托管开源字体，并配合 ClientRouter 维持干净的 Content-Security-Policy。"
date: 2026-11-12
category: "工程笔记"
tags:
  - "Astro"
  - "字体"
authors:
  - "orbit"
slug: "astro-7-fonts-and-csp-zh"
lang: "zh-CN"
translationKey: "fonts-and-csp"
---

## 自托管字体

Astro Orbit 通过 Astro 7 原生 Fonts API 打包开源可变字体（Plus Jakarta Sans 与 JetBrains Mono），构建后全部同源分发，无需在访客浏览器请求第三方字体 CDN。

## 配合 ClientRouter 的 CSP 策略

在 Vite 配置中对 `.js` / `.mjs` 模块禁用内联，确保所有模块脚本从同源路径加载，避免触发严格 CSP 策略限制。

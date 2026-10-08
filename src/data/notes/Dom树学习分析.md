---
title: "DOM 树学习摘记"
description: "简要记录浏览器解析 HTML、创建 DOM 节点树及向 JavaScript 提供读写接口的过程，作为 DOM 概念学习的起点。"
date: 2025-07-21
tags:
  - "Dom"
  - "bx"
  - "安全分析"
  - "JavaScript"
authors:
  - "bx"
draft: false
slug: "bx33661dom"
formerBlogSlug: "bx33661dom"
category: "前端基础"
---


# Dom树学习分析

> DOM (Document Object Model) 是浏览器将HTML文档解析成的树形结构，每个HTML元素都是树中的一个节点。当网页加载时，浏览器会：
>
> 1. 解析HTML文档
> 2. 创建DOM树结构
> 3. 为JavaScript提供读写访问接口
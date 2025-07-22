# 随机URL功能使用说明

## 🎯 功能概述

这个功能为博客文章提供随机字符串URL，增强隐私性和安全性。文章URL将从 `/blog/文件名` 变为 `/blog/k8x9w2m7` 这样的随机字符串。

## 🔧 如何使用

### 新文章
为新文章添加 `slug` 字段到 frontmatter：

```yaml
---
title: "我的新文章"
description: "文章描述"
date: 2024-01-15
tags: ["技术", "前端"]
authors: ["bx"]
draft: false
slug: "k8x9w2m7"  # 8位随机字符串
---
```

### 自动生成
如果不提供 `slug` 字段，系统会自动生成唯一的随机字符串。

### 随机字符串规则
- 长度：8位字符（默认）
- 字符集：小写字母 + 数字 (a-z, 0-9)
- 自动去重：确保不与现有slug冲突
- 示例：`k8x9w2m7`, `p3n5x8z2`, `m9w4k7q1`

### 生成随机Slug

```typescript
import { generateRandomSlug } from '@/lib/utils'

// 生成一个8位随机字符串
const slug = generateRandomSlug() // 输出：例如 "k8x9w2m7"
```

## 📁 文件结构

```
src/content/blog/
├── my-post.md              # 文件名可以保持描述性
└── another-post.md         # URL将使用slug字段
```

## 🌐 URL映射示例

| 文件名 | Slug | 最终URL |
|--------|------|---------|
| `my-awesome-post.md` | `k8x9w2m7` | `/blog/k8x9w2m7` |
| `tech-tutorial.md` | `p3n5x8z2` | `/blog/p3n5x8z2` |
| `project-review.md` | `m9w4k7q1` | `/blog/m9w4k7q1` |

## ⚡ 优势

- **隐私保护**：URL不暴露文章主题
- **安全性**：防止基于URL的内容推测
- **灵活性**：文件名可以保持描述性
- **SEO友好**：保持URL简洁
- **防爬虫**：增加自动化抓取难度

## 🔍 查找文章

由于URL是随机的，建议通过以下方式查找文章：
1. 博客列表页面：`/blog`
2. 标签页面：`/tags/标签名`
3. 搜索功能：博客页面的搜索框
4. RSS订阅：`/rss.xml`

## 📝 注意事项

1. **slug唯一性**：确保每篇文章的slug都是唯一的
2. **字符限制**：只使用小写字母和数字
3. **长度建议**：推荐8位长度，既安全又不会太长
4. **备份重要**：记录重要文章的slug，以便直接访问

## 🔧 配置选项

在 `src/lib/utils.ts` 中可以调整：
- 默认长度：修改 `generateRandomSlug` 函数的默认参数
- 字符集：修改 `characters` 变量
- 冲突检测：调整 `maxAttempts` 参数 
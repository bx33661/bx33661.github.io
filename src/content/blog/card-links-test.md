---
title: "卡片链接测试"
description: "测试 Markdown 中的外部链接是否渲染为卡片样式"
date: 2025-01-20
tags: ["测试", "链接"]
---

# 卡片链接测试

这是一篇测试文章，用来验证 Markdown 中的外部链接是否能够正确渲染为卡片样式。

## 外部链接测试

以下是一些外部链接，它们应该被渲染为卡片样式：

[GitHub - 全球最大的代码托管平台](https://github.com)

[Astro - 现代化的静态站点生成器](https://astro.build)

[Tailwind CSS - 功能类优先的 CSS 框架](https://tailwindcss.com)

[TypeScript - JavaScript 的超集](https://typescriptlang.org)

[React - 用于构建用户界面的 JavaScript 库](https://react.dev)

## 内部链接测试

以下是一些内部链接，它们应该保持原有的样式：

[关于页面](/about)

[博客首页](/blog)

[项目页面](/projects)

## 混合内容测试

这是一段包含外部链接的文本：[Microsoft Learn](https://learn.microsoft.com) 提供了丰富的学习资源。

另一个例子：[Stack Overflow](https://stackoverflow.com) 是程序员问答社区。

## 代码块中的链接

```markdown
[这是一个 Markdown 链接示例](https://example.com)
```

## 列表中的链接

- [MDN Web Docs](https://developer.mozilla.org) - Web 开发文档
- [CSS-Tricks](https://css-tricks.com) - CSS 技巧和教程
- [Dev.to](https://dev.to) - 开发者社区

## 总结

通过这个测试，我们可以看到：

1. 外部链接（以 http 开头的链接）会被渲染为卡片样式
2. 内部链接保持原有的下划线样式
3. 卡片样式包含图标、标题和来源信息
4. 支持悬停效果和过渡动画 
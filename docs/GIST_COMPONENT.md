# Gist 组件使用文档

## 简介

Gist 组件允许你在博客文章中嵌入 GitHub Gist 代码片段。

## 安装

组件已创建在 `src/components/Gist.astro`，无需额外安装。

## 使用方法

### 1. 在文章中导入组件

在你的 `.mdx` 文件（注意：必须是 `.mdx` 格式，不支持 `.md`）的 frontmatter 后添加导入语句：

```markdown
---
title: "你的文章标题"
# ... 其他 frontmatter
---

import Gist from '../../components/Gist.astro';
```

**注意**：使用相对路径 `../../components/Gist.astro`，因为博客文章位于 `src/content/blog/` 目录。

### 2. 嵌入完整 Gist

```markdown
<Gist id="5672adaff13bc2bbae43f025faaebda2" />
```

这将嵌入该 Gist ID 的所有文件。

### 3. 嵌入 Gist 中的特定文件

```markdown
<Gist id="5672adaff13bc2bbae43f025faaebda2" file="share_set_user_info.php" />
```

这将只显示指定的文件。

### 4. 自定义高度

```markdown
<Gist id="5672adaff13bc2bbae43f025faaebda2" height="600px" />
```

默认高度为 500px，但会自动调整以适应内容。

## Props

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | 是 | - | Gist 的 ID（从 Gist URL 中获取） |
| `file` | string | 否 | - | 指定 Gist 中的某个文件名 |
| `height` | string | 否 | "500px" | iframe 初始高度（会自动调整） |

## 获取 Gist ID

从 GitHub Gist URL 中获取 ID：

```
https://gist.github.com/username/5672adaff13bc2bbae43f025faaebda2
                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                 这部分就是 Gist ID
```

## 示例

完整示例可参考：`src/content/blog/CNVD-2026-20654-LG-NAS命令注入.md`

```markdown
---
title: "示例文章"
date: 2026-07-29
---

import Gist from '@components/Gist.astro';

## 代码示例

下面是漏洞代码的完整版本：

<Gist id="5672adaff13bc2bbae43f025faaebda2" />

## 特定文件

只显示 PHP 文件：

<Gist id="5672adaff13bc2bbae43f025faaebda2" file="share_set_user_info.php" />
```

## 特性

- ✅ 自适应高度
- ✅ 响应式设计（移动端友好）
- ✅ 支持深色/浅色主题
- ✅ 支持单文件嵌入
- ✅ 点击链接在新标签页打开

## 注意事项

1. **网络要求**：需要能访问 GitHub Gist 服务
2. **隐私模式**：某些隐私设置可能阻止 iframe 加载
3. **文件名**：`file` 参数需要精确匹配 Gist 中的文件名（包括扩展名）

## 故障排除

### Gist 不显示

- 检查 Gist ID 是否正确
- 确认 Gist 是公开的（不是 secret gist）
- 检查浏览器控制台是否有错误信息

### 高度不正确

- 组件会自动调整高度，但如果失败可以手动设置 `height` 属性
- 某些浏览器的安全策略可能阻止自动调整

### 样式问题

- Gist 使用 GitHub 的默认样式
- 组件会尝试继承你的网站主题，但可能需要额外的 CSS 调整

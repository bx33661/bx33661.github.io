# 文章 Markdown 格式

文章继续使用原有 `.md` / `.mdx` 文件、Frontmatter 和公开 URL。两种文件共享 `src/utils/articleMarkdown.ts` 中的解析器；展示适配由 `src/styles/markdown-reading.css` 提供，不批量改写已有文章。

## 支持的写法

- CommonMark 标题、段落、强调/加粗、引用、嵌套有序/无序列表、分隔线、链接、图片和代码围栏。
- GFM 表格（含左右/居中对齐）、删除线、自动链接、只读任务列表和脚注。
- 行内公式 `$E=mc^2$`；独立公式使用 `$$`，或 `math` 代码围栏。支持 KaTeX 的分式、上下标、根式、矩阵、积分和 aligned 等数学环境。
- GitHub 风格提示框：`> [!NOTE]`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION`，标记独占第一行，下一行写内容。
- 原生 HTML 的 `<details>` / `<summary>`、`<dl>` / `<dt>` / `<dd>`、`<kbd>`、`<mark>`、`<sup>` / `<sub>`。MDX 内的 HTML 按 JSX 语法写。

```markdown
正文中的公式 $x^2+y^2=z^2$，金额写成转义的 \$99。

$$
\begin{aligned}
f(x) &= \frac{1}{N}\sum_{i=1}^N x_i \\
g(x) &= \sqrt{x}
\end{aligned}
$$

| 项目 | 状态 | 数量 |
| :--- | :---: | ---: |
| A | 就绪 | 10 |

- [x] 已完成
- [ ] 待完成

> [!NOTE]
> 提示正文支持 **加粗** 和链接。

正文[^source]

[^source]: 注释内容。
```

折叠区域中使用 Markdown 时，在 `<summary>` 后及结束标签前留空行：

```markdown
<details>
<summary>补充说明</summary>

这里的段落、列表和代码仍然显示。

</details>
```

## 展示约定

- 长公式、宽表格、长代码块在自身区域横向滚动，不撑宽页面；行内长公式也有自己的滚动区域。
- 公式保留本地 KaTeX 字体和 MathML；普通金额使用 `\$`，演示公式源码使用反引号或 `text` 围栏。
- 未知/错误 TeX 保留可读的错误内容；不会将错误表达式变成空白。数学命令以项目安装的 KaTeX 版本支持范围为准。
- 表格保留标题单元格、对齐和原始内容。用 Tab 聚焦公式/表格区域后可使用方向键滚动。
- 任务列表保留勾选状态，展示为只读内容，不把它当作在线待办工具。
- 普通折叠区域的段落保持可见和可选择；不再沿用目录隐藏段落的规则。
- 脚注有中文标签、正文跳转和返回链接；辅助技术标题不混入文章目录。
- `not-prose` 内的 MDX 组件继续管理自己的样式、表格、代码和控件；新规则不侵入组件。已有图片放大、代码复制与阅读进度继续工作。
- 图表继续采用现有静态 SVG/图片方案。Mermaid 源码需按 `docs/HARNESS.md` 的独立渲染器要求处理，不会把普通代码块伪装成已渲染图表。

## 回归检查

运行 `npm run verify:quick` 和 `npm run verify:full`。

`scripts/fixtures/markdown-reading.md` 覆盖上述格式。`scripts/markdown-reading.test.mjs` 使用与构建相同的真实 MD/MDX 解析器检查结构；`scripts/markdown-reading-browser.mjs` 将解析结果放进真实文章布局，检查样式、键盘滚动、代码复制、折叠区、脚注和图片，并生成浅色/深色、桌面/390px/320px 截图。这些样例只存在于测试文件和测试浏览器内，不新增公开文章、路由或 Pagefind 索引条目。

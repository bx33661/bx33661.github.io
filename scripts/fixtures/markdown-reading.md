# Markdown 格式适配样例

这份样例只用于本地回归测试，不加入文章集合、搜索或公开路由。

## 公式与数学排版

行内公式 $E = mc^2$ 与正文共享基线，分式 $\frac{a+b}{c+d}$ 保留上下结构。转义金额 \$99、普通反引号 `$x+y$` 都保持文本。

块级公式保留 MathML，可供辅助技术读取：

$$
\begin{aligned}
\mathcal{L}(\theta) &= -\frac{1}{N}\sum_{i=1}^{N} \log p_{\theta}(y_i\mid x_i) \\
\nabla_{\theta}\mathcal{L} &= \frac{1}{N}\sum_{i=1}^{N}\nabla_{\theta}\ell_i
\end{aligned}
$$

$$
\mathbf{A}=\begin{bmatrix}1 & 2 & 3\\4 & 5 & 6\\7 & 8 & 9\end{bmatrix},\qquad
\int_0^\infty e^{-x^2}\,dx=\frac{\sqrt{\pi}}{2}
$$

数学围栏也按公式渲染，而不是普通代码：

```math
\lim_{n\to\infty}\left(1+\frac{1}{n}\right)^n=e
```

长公式只在自己的区域横向滚动：

$$
\underbrace{a_1+a_2+a_3+a_4+a_5+a_6+a_7+a_8+a_9+a_{10}+a_{11}+a_{12}+a_{13}+a_{14}+a_{15}+a_{16}+a_{17}+a_{18}+a_{19}+a_{20}}_{\text{long expression}} = \sum_{i=1}^{20}a_i
$$

长行内公式 $x_1+x_2+x_3+x_4+x_5+x_6+x_7+x_8+x_9+x_{10}+x_{11}+x_{12}+x_{13}+x_{14}+x_{15}+x_{16}=\sum_{i=1}^{16}x_i$ 后面的文字仍正常换行。

## 表格、对齐与长内容

| 名称 | 左对齐字段 | 中间状态 | 右对齐数值 | 请求标识 | 备注 |
| :--- | :--- | :---: | ---: | :--- | :--- |
| 示例 A | `request.contentLength` | 就绪 | 123456 | `UNBROKEN_REQUEST_IDENTIFIER_0123456789_ABCDEFGHIJKLMN` | 中文长说明仍保留完整内容，不挤坏页面 |
| 示例 B | `response.statusCode` | 待检查 | 987654 | `ANOTHER_UNBROKEN_IDENTIFIER_ABCDEFGHIJKLMN_0123456789` | 支持表格中的 **加粗**、链接与 $x^2$ |

## 标题、正文与链接

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

**加粗文本**、*强调文本*、~~删除文本~~、<mark>标记文本</mark>、H<sub>2</sub>O 与 x<sup>2</sup>，以及 <kbd>Ctrl</kbd> + <kbd>K</kbd>。

[站内文章](/blog/codeql-learning/) 与自动链接 <https://example.com/a/very/long/path/without/short/segments/for/mobile/layout/check/0123456789abcdefghijklmnopqrstuvwxyz>。

长行内代码 `this_is_a_single_long_identifier_without_spaces_0123456789abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ` 会换行，围栏代码保留原始缩进。

## 列表与引用

1. 有序列表第一项。
   1. 第二层有序项目。
      - 第三层无序项目包含 `code`。
   2. 同层项目。
2. 有序列表第二项。

- 普通无序列表。
  - 嵌套列表包含行内公式 $a^2+b^2=c^2$。

- [x] 已完成的任务。
- [ ] 待完成的任务。
  - [x] 嵌套任务。

> 普通引用保留正文、**加粗**与链接。
>
> > 嵌套引用不丢内容。

> [!NOTE]
> 说明正文支持 **格式化文本**。

> [!TIP]
> 提示正文。

> [!IMPORTANT]
> 重要正文。

> [!WARNING]
> 注意正文。

> [!CAUTION]
> 警告正文。

## 代码与折叠内容

```typescript file="example.ts"
export const sample = "THIS_IS_AN_UNBROKEN_CODE_LINE_0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz_0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
console.log(sample); // [!code highlight]
```

```diff
- old value
+ new value
```

```
未指定语言的围栏代码也保留空白和可复制文本。
    缩进不被折叠
```

<details>
<summary>展开查看补充说明</summary>

折叠区的段落必须正常显示，不能被目录专用规则隐藏。

<table data-format-raw-table>
<caption>原生 HTML 表格也保留说明与键盘滚动。</caption>
<thead><tr><th>字段</th><th>示例</th></tr></thead>
<tbody><tr><td>Identifier</td><td><code>RAW_HTML_TABLE_IDENTIFIER_0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ</code></td></tr></tbody>
</table>

- 补充列表。
- [站内链接](/blog/codeql-learning/)。

```text
折叠区域里的代码
```

</details>

<dl>
<dt>Markdown</dt>
<dd>一种轻量级文本标记格式。</dd>
<dt>KaTeX</dt>
<dd>用于呈现公式的本地数学排版组件。</dd>
</dl>

## 图片与脚注

![CodeQL 架构图](/blog/codeql-learning/01-codeql-architecture.png)

正文中的脚注[^note]可以跳到页尾，并通过返回链接回到引用位置。

---

<div class="not-prose" data-format-island>
<p>组件自有段落 <code>island_code</code>。</p>
<table><tbody><tr><td>组件自有表格</td></tr></tbody></table>
<pre><code>component_owned_code</code></pre>
</div>

[^note]: 脚注内容包含 **加粗**、[引用链接](/blog/codeql-learning/) 与公式 $\alpha + \beta$。

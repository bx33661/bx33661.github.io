# 首批英文文章

2026-10-18 为最近发布的三篇中文文章增加英文译文，复用原站多语言组件，没有新增英文主题或布局。英文文章保留原文发表日期；译文上线不修改中文文章正文或既有 URL。

| 中文源文件 | 英文 slug | translationKey |
| --- | --- | --- |
| `websocket-handshake-message-replay.md` | `websocket-handshake-message-replay-en` | `websocket-handshake-message-replay` |
| `rasp.md` | `openrasp-sql-detect-bypass-en` | `openrasp-sql-detect-bypass` |
| `cybergym-ai-security-agent-benchmark.mdx` | `cybergym-ai-security-agent-benchmark-en` | `cybergym-ai-security-agent-benchmark` |

用户选择最近三篇，并明确要求较轻量模型子 Agent；本批使用 `gpt-6-luna` 翻译，主 Agent 复核，另一轮子 Agent 对照原文审阅。RASP 长文拆成四段，代码先保护、译后逐字恢复；没有缩写成摘要。

## 保真检查

- 正文标题层级与代码块数量分别为：WebSocket 16 / 13，RASP 56 / 72，CyberGym 9 / 2。
- 所有 fenced code、内联代码原 token、引用目标和本地图片路径保留；图片及代码输出可能仍有源文中的中文，不伪造英文截图。
- 表格、说明、限定条件和历史榜单日期按原文翻译，不将历史数字改成当前排名。
- 中文文章仅新增 `translationKey`，无正文差异。
- CyberGym 使用同一个交互组件，服务端初始文字和客户端状态切换均按 locale 取文案。
- 英文 `lang: en`、`draft: false`；英文页 self-canonical，双向 `hreflang` 对应明确译文；中文列表、RSS 和搜索仍只使用中文集合。

## 可复用翻译任务

```text
将 SOURCE 完整翻译为英文，保存 TARGET；不要发布或编辑其他文件。
保留每段信息、标题层级、表格和列表，不缩写、扩写或更新事实。
fenced code、内联代码、命令、URL、图片地址和 import 必须原样保留。
翻译标题、description、正文、图片 alt/caption 和组件界面文案。
保留原日期和作者，使用 lang: en、独立英文 slug，以及与原文相同的 translationKey。
先逐段翻译，再对照原文校读；报告遗漏或技术术语疑点。
```

## 验收入口

```bash
node --test scripts/english-publication.test.mjs
npm run verify:full
node scripts/i18n-browser.mjs
node scripts/english-publication-browser.mjs
# 上线后复验真实站点：
ENGLISH_BASE_URL=https://www.bx33661.com node scripts/english-publication-browser.mjs
```

语言检查兼容空集合、正式内容和独立 fixture，不再把“英文必须为空”写成永久断言。首批浏览器检查覆盖三篇正文、真实搜索结果点击、双向语言切换、图片解码、目录和代码按钮，以及 CyberGym 差分交互；在桌面/手机及明暗主题各运行一次。

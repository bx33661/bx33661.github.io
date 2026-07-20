---
title: "Usage"
description: "oh-my-vul 安装、工作区初始化与常用 CLI / Skills 入口。"
navLabel: "Usage"
order: 30
draft: false
---

## 环境

- Node.js 22+
- 可选：Claude Code 或 Codex（跑 Skills）
- 本地可写目录作为研究工作区

具体安装以仓库 README 为准：

- <https://github.com/bx33661/oh-my-vul>

## 快速路径（概念）

```bash
# 安装 CLI（示例，以 README 为准）
npm i -g oh-my-vul   # 或项目文档中的包名

# 初始化 / 进入工作区
omv init
# → 生成 .omv/ 结构

# 查看帮助
omv --help
omv doctor           # 若提供：环境与 Skills 诊断
```

## 研究节奏（推荐）

1. **定范围** — 目标包 / 版本 / 攻击面  
2. **find / audit** — 出 candidate，写清 source → sink → guard  
3. **repro** — 本地触发；`observed_result` 必须来自真实运行  
4. **dedup** — 查 NVD / GHSA / 生态库，避免重复披露  
5. **critic / review** — 严格模式拦未完成项  
6. **report** — 生成 Markdown / OSV 等草稿，带 provenance  

## Skills 入口（Claude Code）

在已安装 Skills 的环境中，常见入口类似：

- `/omv` — 总控  
- find / audit / repro / report / radar / dedup / disclose / critic  

（以当前仓库 Skills 列表为准。）

## 工作区里有什么

```text
.omv/
  findings/          # Evidence.v1 YAML
  repro/             # 复现材料
  reports/           # 报告草稿
  ...                # ThreatMap / Verification 等侧车
```

## 注意事项

- 默认面向**公开/本地可读**的 OSS 元数据与源码，不做未授权扫描  
- `unknown` 请保留到真正验证为止  
- 报告前优先跑严格 review，而不是直接让模型「写得更像 CVE」

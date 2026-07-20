---
title: "Approach"
description: "oh-my-vul 的工作流与关键设计。"
navLabel: "Approach"
order: 20
draft: false
---

## Approach

- 以本地 `.omv/` 工作区承载 campaign、finding、repro 与报告产物
- Skills 覆盖 find / audit / repro / report / radar / dedup / disclose / critic 等阶段
- 强调 **evidence-before-claims**：先固定范围与数据流，再谈 exploitability
- CLI（`omv`）+ 只读 TUI 队列，方便查看进度而不打断研究节奏
- 面向多生态 OSS（npm、Python、Go、Rust、Java 等），默认只消费公开/本地可读信息

## Mental model

```text
scope → audit (source/sink/guards) → local repro → review → advisory draft
```

每一步都落盘；跳步会被流程和 critic 拦住。

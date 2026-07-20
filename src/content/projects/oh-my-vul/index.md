---
title: "oh-my-vul"
description: "Evidence-first 漏洞研究工作区：把 OSS 目标变成可复核 finding、本地复现门禁与披露草稿。"
pubDatetime: 2026-07-11
tags:
  - "Vuln Research"
  - "Claude Code"
  - "CLI"
  - "Security"
category: "TOOLING — 2026"
workId: "WRK_001"
status: "active"
repo: "https://github.com/bx33661/oh-my-vul"
order: 1
featured: true
draft: false
navLabel: "Overview"
relatedPosts:
  - "oh-my-vul-1-0"
---

## 定位

**oh-my-vul** 是面向漏洞研究的本地工作区与 AI Skills 工具集。

我对它的定位很简单：

> 让 Agent 负责理解代码，让程序负责约束状态，让研究员保留最后的判断权。

它解决的不是「模型能不能找到 sink」，而是研究过程太容易断：版本在一段对话里，数据流在另一段上下文，复现留在终端历史，写报告时模型又把没确认的部分补成流畅结论。

**流畅 ≠ 证据完整。**

## 适合谁

- 用 Claude Code / Codex 做 OSS 审计与漏洞研究
- 需要把 finding 从聊天记录落成可回放工作区
- 希望 advisory 草稿建立在同一组可校验事实上

## 你能得到什么

| 能力 | 说明 |
|------|------|
| `.omv/` 工作区 | campaign、finding、repro、报告产物本地落盘 |
| Skills | find · audit · repro · report · radar · dedup · disclose · critic |
| Evidence.v1 | 结构化 finding，而不是纯自然语言 |
| 复现门禁 | 过不了 repro 的条目不轻易进披露稿 |
| CLI + TUI | `omv` 校验/审查；只读队列看进度 |

## 文档导航

| 页 | 内容 |
|----|------|
| [Problem](/projects/oh-my-vul/problem/) | 为什么需要证据优先工作流 |
| [Approach](/projects/oh-my-vul/approach/) | Evidence、Skills、CLI 如何分工 |
| [Usage](/projects/oh-my-vul/usage/) | 安装与常用命令 |
| [Architecture](/projects/oh-my-vul/architecture/) | 目录与数据模型 |
| [Highlights](/projects/oh-my-vul/highlights/) | 要点与链接 |

## Stack

TypeScript · Python · Node.js CLI · Ink TUI · Claude Code / Codex Skills

## Links

- 仓库：<https://github.com/bx33661/oh-my-vul>
- 设计长文：[oh-my-vul 1.0 设计与实践](/blog/oh-my-vul-1-0/)

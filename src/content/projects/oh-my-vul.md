---
title: "oh-my-vul"
description: "Evidence-first 漏洞研究工作区：把 OSS 目标变成可复核 finding、本地复现门禁与披露草稿。"
pubDatetime: 2026-07-11
tags:
  - "vulnerability-research"
  - "Claude Code"
  - "CLI"
  - "security"
status: "active"
repo: "https://github.com/bx33661/oh-my-vul"
order: 1
featured: true
draft: false
slug: "oh-my-vul"
---

## Overview

**oh-my-vul** 是面向漏洞研究的本地工作区与 AI Skills 工具集。它把「找目标 → 审计 → 复现 → 严格评审 → 写 advisory」收成可重复流程，而不是一次性的聊天记录。

适用于在 Claude Code / Codex 里做开源组件研究，并希望每条结论都能落到证据上。

## Problem

常见痛点：

- Agent 输出「像漏洞」的叙述，但缺少 source → sink → guard 的可核对路径
- 复现、去重、披露格式分散在多个目录和手工步骤里
- 研究过程难回放，团队/未来的自己无法快速接手

## Approach

- 以本地 `.omv/` 工作区承载 campaign、finding、repro 与报告产物
- Skills 覆盖 find / audit / repro / report / radar / dedup / disclose / critic 等阶段
- 强调 evidence-before-claims：先固定范围与数据流，再谈 exploitability
- CLI（`omv`）+ 只读 TUI 队列，方便查看进度而不打断研究节奏
- 面向多生态 OSS（npm、Python、Go、Rust、Java 等），默认只消费公开/本地可读信息

## Highlights

- 结构化 finding 与侧车证据，而不是纯自然语言结论
- 本地复现门禁：过不了 repro 的条目不轻易进入披露稿
- 多格式 advisory 草稿（Markdown / OSV 等方向）
- 可与 Claude Code Skills 工作流直接组合

## Stack

TypeScript · Python · Node.js CLI · Ink TUI · Claude Code / Codex Skills

## Links

- 仓库：<https://github.com/bx33661/oh-my-vul>

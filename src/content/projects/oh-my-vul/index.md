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
---

## Overview

**oh-my-vul** 是面向漏洞研究的本地工作区与 AI Skills 工具集。它把「找目标 → 审计 → 复现 → 严格评审 → 写 advisory」收成可重复流程，而不是一次性的聊天记录。

适用于在 Claude Code / Codex 里做开源组件研究，并希望每条结论都能落到证据上。

## What you get

- 本地 `.omv/` 工作区：campaign、finding、repro、报告产物
- Skills：find / audit / repro / report / radar / dedup / disclose / critic
- Evidence-before-claims：先固定范围与数据流，再谈 exploitability
- CLI（`omv`）+ 只读 TUI 队列

## Stack

TypeScript · Python · Node.js CLI · Ink TUI · Claude Code / Codex Skills

## Links

- 仓库：<https://github.com/bx33661/oh-my-vul>

下一页：[Problem](/projects/oh-my-vul/problem/) · [Approach](/projects/oh-my-vul/approach/) · [Highlights](/projects/oh-my-vul/highlights/)

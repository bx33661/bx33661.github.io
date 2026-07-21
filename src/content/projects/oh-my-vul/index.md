---
title: "oh-my-vul"
description: "面向 Codex / Claude Code 的证据优先漏洞研究工作台：Campaign、Evidence.v1、本地复现门禁与可校验报告草稿。"
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

**oh-my-vul**（npm：`oh-my-vul@1.0.0`，CLI：`omv`）是给 **Codex** 和 **Claude Code** 用的本地漏洞研究工作台。

它不是又一个「让模型去扫仓库」的包装。它做的事更窄、也更硬：

> 让 Agent 负责理解代码，让程序负责约束状态，让研究员保留最后的判断权。

Coding Agent 找 sink、读调用链已经很强了。真正容易塌的是研究**状态**：版本在一段对话里，数据流在另一段上下文，复现留在终端历史，写报告时模型又把 `unknown` 补成流畅结论。

**流畅 ≠ 证据完整。**

## 适合谁 / 不适合谁

**适合**

- 用 Claude Code / Codex 做 **OSS 白盒 / 灰盒** 漏洞研究
- 需要把 finding 从聊天记录落成 **可回放的 `.omv/` 工作区**
- 希望 VulDB / CVE / GHSA / OSV 草稿建立在同一组可校验事实上

**不适合**

- 想对第三方线上服务做自动化攻击或批量扫描
- 期望「一键确认 CVE、无需本地复现」
- 只想要一段漂亮分析、不在乎字段是否可晋级

安全边界很明确：被动研究公开元数据与源码；复现只在本地或明确授权环境；未知必须保持未知。

## 你能直接用到的能力

| 能力 | 实际落点 |
|------|----------|
| 开题 | `omv start` → Campaign.v1 + 攻击面卡片 propose/select/seed |
| 证据对象 | `.omv/findings/<id>.yaml`（**Evidence.v1**） |
| Agent Skills | 10 个：`using-omv`、`omv`、`omv-find`、`omv-audit`、`omv-repro`、`omv-dedup`、`omv-critic`、`omv-report`、`omv-disclose`、`omv-radar` |
| 程序门禁 | `omv review` / `omv findings validate|promote`；出报告看 **submission_score ≥ 75** |
| 只读 TUI | 终端直接 `omv`：看队列与下一步，**不改** finding |
| 生态 | npm / PyPI / Go / Rust / Java 等 **14** 个 pattern-pack 生态 |

## 版本

当前文档对齐 **oh-my-vul 1.0.0**（CLI 与内置 Skills 同发行版绑定）。升级后应跑 `omv doctor`，必要时 `omv setup … --force`。

## 文档导航

| 页 | 内容 |
|----|------|
| [Problem](/projects/oh-my-vul/problem/) | 研究为什么会在「发现 → 报告」之间断掉 |
| [Approach](/projects/oh-my-vul/approach/) | Campaign、Evidence、Skills 与 CLI 如何分工 |
| [Usage](/projects/oh-my-vul/usage/) | 安装、主路径与命令速查 |
| [Architecture](/projects/oh-my-vul/architecture/) | `.omv/`、三套状态机与契约 |
| [Highlights](/projects/oh-my-vul/highlights/) | 要点、技术栈与链接 |

## Links

- 仓库：<https://github.com/bx33661/oh-my-vul>
- 设计长文：[oh-my-vul 1.0 设计与实践](/blog/oh-my-vul-1-0/)

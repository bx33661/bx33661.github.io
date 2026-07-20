---
title: "PureAutoCodeQL"
description: "多 Agent CodeQL 流水线：从 CVE 情报到 source/sink、查询生成、路径筛选的自动化研究辅助。"
pubDatetime: 2026-05-01
tags:
  - "CodeQL"
  - "multi-agent"
  - "CVE"
  - "static-analysis"
status: "active"
repo: "https://github.com/Fruit-Guardians/PureAutoCodeql"
order: 3
featured: true
draft: false
slug: "pure-auto-codeql"
---

## Overview

**PureAutoCodeQL**（[Fruit-Guardians](https://github.com/Fruit-Guardians)）是一套面向 CVE 研究的多 Agent 流水线：聚合漏洞情报与补丁线索，辅助识别 source/sink，自动生成并迭代 CodeQL 查询，再从 SARIF 里做路径筛选与汇总。

我参与并维护该方向的工程实践，把它当作静态分析 × LLM 的研究底座之一。

## Problem

- 手工写 CodeQL 查询门槛高、迭代慢
- CVE 情报、补丁 diff、数据库构建、跑查询、读 SARIF 链路碎片化
- 需要在 Java / Python / C·C++ 等语言间复用同一套研究节奏

## Approach

- 多阶段 Agent：情报（GHSA/NVD + patch）→ source/sink → query gen/fix/rerun → path selection
- 支持从目录/zip/补丁导入项目，并创建 CodeQL database（含 C/C++ 构建命令场景）
- CLI 与本地 FastAPI + SSE，便于看任务进度与产物
- 输出 summary Markdown、SARIF、路径筛选 JSON/报告
- LLM 提供方可插拔（DeepSeek、OpenAI-compatible 等）

## Highlights

- 把「情报 → 查询 → 路径」串成可跑通的研究管道
- 结构化产物便于二次审计，而不是只留一段聊天总结
- 覆盖多种目标语言与导入方式
- 适合 CVE 复现、查询草稿加速、教学演示

## Stack

Python · CodeQL · FastAPI · uv · SARIF · LLM providers

## Links

- 仓库：<https://github.com/Fruit-Guardians/PureAutoCodeql>

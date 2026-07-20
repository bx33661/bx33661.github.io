---
title: "PureAutoCodeQL"
description: "多 Agent CodeQL 流水线：从 CVE 情报到 source/sink、查询生成、路径筛选的自动化研究辅助。"
pubDatetime: 2026-05-01
tags:
  - "CodeQL"
  - "Multi-Agent"
  - "CVE"
  - "Static Analysis"
category: "PIPELINE — 2026"
workId: "WRK_003"
status: "active"
repo: "https://github.com/Fruit-Guardians/PureAutoCodeql"
order: 3
featured: true
draft: false
navLabel: "Overview"
---

## 定位

**PureAutoCodeQL**（[Fruit-Guardians](https://github.com/Fruit-Guardians)）是一套面向 CVE 研究的多 Agent 流水线：

1. 聚合漏洞情报与补丁线索  
2. 辅助识别 source / sink  
3. 自动生成并迭代 CodeQL 查询  
4. 从 SARIF 做路径筛选与汇总  

我参与并维护该方向的工程实践，把它当作 **静态分析 × LLM** 的研究底座之一。

## 适合什么

- 已有 CVE / GHSA，想快速落到可跑的 CodeQL 草稿  
- 多语言目标（Java / Python / C·C++）需要同一套研究节奏  
- 希望产物是 SARIF / 报告，而不是只有聊天总结  

## 文档导航

| 页 | 内容 |
|----|------|
| [Problem](/projects/pure-auto-codeql/problem/) | 手工 CodeQL 与碎片链路 |
| [Approach](/projects/pure-auto-codeql/approach/) | 多 Agent 阶段划分 |
| [Usage](/projects/pure-auto-codeql/usage/) | CLI / API 使用概念 |
| [Architecture](/projects/pure-auto-codeql/architecture/) | 流水线与产物 |
| [Highlights](/projects/pure-auto-codeql/highlights/) | 要点与链接 |

## Stack

Python · CodeQL · FastAPI · uv · SARIF · LLM providers

## Links

- 仓库：<https://github.com/Fruit-Guardians/PureAutoCodeql>

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

## Overview

**PureAutoCodeQL**（[Fruit-Guardians](https://github.com/Fruit-Guardians)）是一套面向 CVE 研究的多 Agent 流水线：聚合漏洞情报与补丁线索，辅助识别 source/sink，自动生成并迭代 CodeQL 查询，再从 SARIF 里做路径筛选与汇总。

我参与并维护该方向的工程实践，把它当作静态分析 × LLM 的研究底座之一。

## Stack

Python · CodeQL · FastAPI · uv · SARIF · LLM providers

## Links

- 仓库：<https://github.com/Fruit-Guardians/PureAutoCodeql>

下一页：[Problem](/projects/pure-auto-codeql/problem/) · [Approach](/projects/pure-auto-codeql/approach/) · [Highlights](/projects/pure-auto-codeql/highlights/)

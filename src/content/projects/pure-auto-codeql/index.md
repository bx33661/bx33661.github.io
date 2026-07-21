---
title: "PureAutoCodeQL"
description: "Fruit-Guardians 多智能体 CodeQL 研究流水线（0.1.0 Alpha）：情报 → Sink/Source → 查询生成 → SARIF 路径精选。"
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

**PureAutoCodeQL** 是 [Fruit-Guardians](https://github.com/Fruit-Guardians) 组织下的多智能体 CodeQL 研究流水线（PyPI/分类器：**0.1.0 · Alpha**）。

它要解决的不是「一键出 CVE」，而是把一次 CVE 复盘里最碎的几段活串起来：

> 面向 CVE 复盘的多智能体 CodeQL 研究流水线：情报 → Sink/Source → 查询生成修复 → SARIF 路径精选，产物可落盘。

Fruit-Guardians 组织项目；我是活跃贡献者，参与过 CLI/API 边界、包命名空间、导入与配置等工程化维护。

## 适合谁 / 不适合谁

**适合**

- 已有 CVE / GHSA / 补丁线索，想尽快落到可跑的 CodeQL 草稿与 SARIF
- 目标语言落在 **python / java / cpp**，需要同一套 case 工作区与分析节奏
- 希望产物是 `summary.md`、`sarif/`、`path-selection/`，而不是只剩一段聊天

**不适合**

- 期望无人值守、端到端自动产出高价值 CVE
- 需要官方未支持语言（当前只有 python / java / cpp）
- 把 Alpha 研究辅助当成生产级漏洞工厂

成熟度要写清楚：**0.1.0 Alpha**。默认路径能跑通已知 case；`CodeQLComposeTool` 里不少 `enable_*` 能力**默认关闭**，需要显式打开。

## 你能直接用到的能力

| 能力 | 实际落点 |
|------|----------|
| Case 工作区 | `projects/<id>/{source_code,db,inputs,intel}`（可选 `queries/`） |
| 默认流水线 | `cve_analysis → sink_analysis → source_analysis → path_analysis → codeql_generation` |
| 后处理 | 跑完后 consolidate：`path-selection/{report.md,selection.json,dataflow.json}` |
| 查询组合 | `CodeQLComposeTool`：生成 / 语法检查 / 执行 / 修复；多项 `enable_*` 默认 off |
| 入口 | `uv run python Analyze.py …` 或 `uv run pure-auto-codeql analyze …` |
| 本地 API | FastAPI + SSE，默认只绑 `127.0.0.1`，导入与构建命令有 lockdown |

## 版本

当前文档对齐仓库 **0.1.0（Development Status · Alpha）**。依赖 **Python 3.13+**、**uv**、PATH 上的 **CodeQL CLI**；MCP ripgrep 工具需 `./build_mcp.sh` 构建。

## 文档导航

| 页 | 内容 |
|----|------|
| [Problem](/projects/pure-auto-codeql/problem/) | 手工 CodeQL 与碎片化研究链路 |
| [Approach](/projects/pure-auto-codeql/approach/) | 五步流水线、两层 path、compose 默认值 |
| [Usage](/projects/pure-auto-codeql/usage/) | 安装、doctor、主路径与排障 |
| [Architecture](/projects/pure-auto-codeql/architecture/) | case 布局、产物树、CLI/API 边界 |
| [Highlights](/projects/pure-auto-codeql/highlights/) | 要点、技术栈与链接 |

## 诚实边界

- 研究辅助，不是 CVE 量产线  
- 默认流水线可跑；compose 增强项多数 **default off**  
- 输出以 `output/<case>/<timestamp>/` 为准，不以虚构的 `reports/` 树为准  

## Stack

Python 3.13+ · uv · CodeQL CLI · FastAPI/SSE · LangChain/LangGraph · SARIF · LLM providers（CHAT / THINK）

## Links

- 仓库：<https://github.com/Fruit-Guardians/PureAutoCodeql>
- Org：<https://github.com/Fruit-Guardians>

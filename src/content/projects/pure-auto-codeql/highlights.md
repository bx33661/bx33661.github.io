---
title: "Highlights"
description: "PureAutoCodeQL 要点、技术栈、成熟度边界与链接。"
navLabel: "Highlights"
order: 50
draft: false
---

## 要点

- **Fruit-Guardians** 组织项目；我是活跃贡献者（CLI/API 边界、包命名空间、导入与配置等），非唯一维护者  
- **0.1.0 Alpha**：CVE 复盘研究辅助，不是无人值守 CVE 工厂  
- 默认流水线：`cve_analysis → sink_analysis → source_analysis → path_analysis → codeql_generation`，随后 consolidate **path-selection**  
- **两层 path**：pre-QL 的 `path_analysis` vs post-SARIF 的 `path-selection/dataflow.json`  
- Case 布局：`projects/<id>/{source_code,db,inputs,intel}`（可选 `queries/`）  
- 产物：`output/<case>/<timestamp>/{summary.md,sarif/…,codeql/…,path-selection/…}`  
- 语言：**python / java / cpp** only；Java `--build-mode=none`；C/C++ 需 build / 两步走 / Docker  
- `CodeQLComposeTool` 多项 `enable_*` **默认关闭**；API 默认只绑 `127.0.0.1` 并锁定导入面  

## Stack

| 层 | 技术 |
|----|------|
| 运行时 | Python 3.13+ · uv |
| 静态分析 | CodeQL CLI · SARIF |
| 编排 | 自研 Pipeline · Agents · LangChain/LangGraph |
| 查询组合 | `CodeQLComposeTool` · LSP 检查 |
| 服务 | FastAPI · SSE · uvicorn |
| 模型配置 | `keys.toml` · CHAT / THINK 角色 |

## Links

- 仓库：<https://github.com/Fruit-Guardians/PureAutoCodeql>  
- Org：<https://github.com/Fruit-Guardians>  
- 站内：[Overview](/projects/pure-auto-codeql/) · [Usage](/projects/pure-auto-codeql/usage/) · [Architecture](/projects/pure-auto-codeql/architecture/)  

## 非目标（一句话版）

不宣称 sole maintainer、不宣称端到端自动产 CVE、不把默认关闭的 compose 能力写成开箱全开。

## 一句话

> 面向 CVE 复盘的多智能体 CodeQL 研究流水线：情报 → Sink/Source → 查询生成修复 → SARIF 路径精选，产物可落盘。
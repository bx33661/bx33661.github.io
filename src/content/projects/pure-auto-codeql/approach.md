---
title: "Approach"
description: "PureAutoCodeQL 的多 Agent 流水线设计。"
navLabel: "Approach"
order: 20
draft: false
---

## Approach

- 多阶段 Agent：情报（GHSA/NVD + patch）→ source/sink → query gen/fix/rerun → path selection
- 支持从目录/zip/补丁导入项目，并创建 CodeQL database（含 C/C++ 构建命令场景）
- CLI 与本地 FastAPI + SSE，便于看任务进度与产物
- 输出 summary Markdown、SARIF、路径筛选 JSON/报告
- LLM 提供方可插拔（DeepSeek、OpenAI-compatible 等）

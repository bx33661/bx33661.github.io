---
title: "Architecture"
description: "PureAutoCodeQL 模块边界、任务流与产物布局。"
navLabel: "Architecture"
order: 40
draft: false
---

## 逻辑架构

```text
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Intel Agent  │ → │ S/S Agent    │ → │ QL Gen/Fix   │
└──────────────┘   └──────────────┘   └──────┬───────┘
                                             │
                                             ▼
                                      CodeQL CLI + DB
                                             │
                                             ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Path ranker  │ ← │ SARIF parse  │ ← │ Query runner │
└──────────────┘   └──────────────┘   └──────────────┘
        │
        ▼
  Markdown / JSON / SARIF 产物
```

## 运行形态

| 形态 | 说明 |
|------|------|
| CLI | 本地批处理、脚本友好 |
| FastAPI + SSE | 长任务进度、多项目队列 |

## 数据

建议每个任务/项目目录固定产物名，例如：

- `db/` 或 CodeQL database 路径  
- `queries/` 生成的 QL  
- `results/*.sarif`  
- `reports/summary.md`  
- `reports/paths.json`  

（实际布局以仓库为准。）

## 扩展

- **新语言**：加 DB 构建策略 + query 模板  
- **新 provider**：统一 chat/completions 适配层  
- **人在回路**：某阶段暂停，等待确认 source/sink 再继续  

## 非目标

- 全自动无人值守出 CVE  
- 替代 CodeQL 官方文档与查询库  
- 保证生成查询一定有高价值命中  

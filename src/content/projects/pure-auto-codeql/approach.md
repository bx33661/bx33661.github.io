---
title: "Approach"
description: "PureAutoCodeQL 的多 Agent 阶段与产物设计。"
navLabel: "Approach"
order: 20
draft: false
---

## 流水线阶段

```text
CVE / GHSA / patch intel
        │
        ▼
  Source / Sink 识别（LLM + LSP 等）
        │
        ▼
  CodeQL 查询生成 → 修复 → 重跑
        │
        ▼
  SARIF 路径筛选与汇总报告
```

各阶段可以由不同 Agent / 模块承担，中间用结构化产物衔接，而不是只传一段自然语言。

## 输入

- 项目目录 / zip / 补丁  
- CVE 标识或描述  
- （可选）C/C++ 构建命令，用于 DB 创建  

## 输出

| 产物 | 用途 |
|------|------|
| Summary Markdown | 人读纪要 |
| SARIF | 工具链与二次分析 |
| Path-selection JSON / 报告 | 排序后的数据流路径 |

## LLM 角色

- 读情报与补丁，提出 source/sink 假设  
- 生成 / 修补 CodeQL 查询草稿  
- 解释 SARIF 路径  

**不替代**：CodeQL 引擎的求值结果；最终利用判断仍归研究员。

## 原则

1. 管道可中断、可续跑  
2. 每阶段落盘，便于 debug  
3. 提供方（DeepSeek / OpenAI-compatible 等）可插拔  
4. 语言差异收敛到 DB 构建与 query pack，不散落到业务逻辑各处  

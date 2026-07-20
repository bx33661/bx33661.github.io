---
title: "Architecture"
description: "oh-my-vul 的工作区布局、契约与组件边界。"
navLabel: "Architecture"
order: 40
draft: false
---

## 组件边界

| 层 | 职责 | 不负责 |
|----|------|--------|
| Skills / Agent | 读代码、提假设、写叙述与 PoC 草稿 | 擅自确认 exploitability |
| CLI / Contracts | schema、状态晋级、provenance、归档 | 替代人工判断 |
| `.omv/` | 研究记忆与产物 | 远端同步（除非你自己加） |

## 关键契约（概念）

- **Evidence.v1** — finding 主对象  
- **ThreatMap.v1** — source/sink/guard 数据流笔记  
- **Verification.v1** — 独立审查结论  
- **SourceRef.v1** — 源码身份 / 哈希，防「看错版本」  

具体字段以仓库 schema 为准。

## Finding 生命周期（简化）

```text
candidate
  → needs-audit / needs-repro / needs-verification
  → ready
  → reported / archived

任意阶段 → blocked（路径明确断开）
```

## 与 Coding Agent 的接口

Agent 通过 Skills 读写工作区；CLI 在晋级与出报告时做硬校验。  
两边共享同一目录，而不是复制粘贴长 prompt。

## 扩展点

- 新生态：在 find/audit 策略中加 loader，不改 Evidence 主结构  
- 新报告格式：消费同一 Evidence，追加 renderer  
- TUI：只读观察队列，不绕过 review 门禁  

## 相关阅读

- [Approach](/projects/oh-my-vul/approach/)
- 博客：[oh-my-vul 1.0 设计与实践](/blog/oh-my-vul-1-0/)

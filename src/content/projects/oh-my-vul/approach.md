---
title: "Approach"
description: "Evidence.v1、Skills 与 CLI 如何把漏洞研究收成可校验流程。"
navLabel: "Approach"
order: 20
draft: false
---

## 总览

oh-my-vul 拆成两层：

1. **Skills / Agent** — 理解代码、追数据流、设计复现、写报告表达  
2. **CLI + Contracts + `.omv/`** — 字段合法吗、状态能不能晋级、报告是否过期

```text
Codex / Claude Code
        │
        │  Skills: find · audit · repro · dedup · critic · report
        ▼
  .omv/findings/<id>.yaml        ← Evidence.v1
        │
        ├── ThreatMap.v1         ← 数据流与 guard
        ├── Verification.v1      ← 独立审查结果
        ├── SourceRef.v1         ← 源码身份与哈希
        └── repro/ + reports/    ← 复现记录与报告
        │
        ▼
 TypeScript CLI: validate · review · provenance · archive
```

## Evidence.v1

finding 从「一段分析」变成有生命周期的对象。简化形态：

```yaml
schema: Evidence.v1
id: demo-package-path-traversal
status: candidate

package:
  ecosystem: npm
  name: demo-package
  tested_version: 1.2.3

evidence:
  source: request.params.filename
  sink: fs.readFile(...)
  guard: unknown
  reproducer: unknown
  observed_result: unknown

verdict:
  exploitability: plausible
  confidence: medium

blockers:
  - guard bypass has not been demonstrated
  - local reproduction is incomplete
```

`unknown` 很重要：它阻止模型把推测继续向下传递。

## 流程

```text
scope → audit (source/sink/guards) → local repro → review → advisory draft
```

模型可以说「这里可能有绕过」，但不能只靠语气把 candidate 改成 confirmed。  
`omv review <id> --strict` 会继续检查 Evidence、ThreatMap、Verification 和复现材料，给出例如：

- `ready`
- `needs-repro`
- `needs-audit`
- `needs-verification`
- `blocked`

`blocked` 不是失败，而是精确记录路径断点，方便下次接着做。

## 报告与 provenance

报告生成后记录 provenance。Evidence / ThreatMap / Verification / 复现材料一变，旧报告应被视为陈旧。  
VulDB、GHSA、OSV、Markdown 可以换模板，底层引用的仍是同一组事实。

## 原则

- **Evidence before claims**
- **本地复现优先于叙述**
- **状态机约束晋级**
- **研究员最终拍板**

---
title: "Approach"
description: "默认五步流水线、两层 path、CodeQLComposeTool 默认关闭项，以及 case 工作区设计。"
navLabel: "Approach"
order: 20
draft: false
---

## 设计原则

项目把 CVE 复盘拆成**固定顺序的分析步骤**，每步消费上一步的结构化结果，最后再 consolidate 到统一的 `output/<case>/<timestamp>/`。LLM 负责读情报、提假设、写/修 QL、解释路径；**CodeQL CLI 仍是求值权威**。

不追求「无人值守出洞」。0.1.0 Alpha 的定位是研究辅助：把草稿和产物成本压下来，把判断权留给人。

## 默认流水线（与 `create_default_pipeline` 一致）

代码里的默认步骤顺序是：

```text
cve_analysis
    → sink_analysis
    → source_analysis
    → path_analysis          # 生成 QL 之前的 flow-step 挖掘
    → codeql_generation      # 生成 / 修复 / 执行查询
         │
         ▼  (pipeline finally)
   consolidate + path-selection   # 对 SARIF 结果做路径精选
```

| 步骤 | 在做什么 |
|------|----------|
| `cve_analysis` | 聚合 GHSA/NVD、补丁、inputs 等上下文，形成 CVE 侧叙事 |
| `sink_analysis` | 在源码上下文里找危险调用 / 攻击落点 |
| `source_analysis` | 找可控入口，并给出 source→sink 候选关系 |
| `path_analysis` | 对候选路径做 **flow steps** 细化（仍在写 QL 之前） |
| `codeql_generation` | 用 `CodeQLComposeTool` 生成、检查、执行、按需修复查询 |
| post：`path-selection` | 从 SARIF / 原始 dataFlowPath 里精选高价值路径并落盘 |

注意：README 的 mermaid 有时会把「path」画在执行之后；**以 `core/pipeline.py` 为准**——流水线内的 `path_analysis` 在 `codeql_generation` **之前**；对 SARIF 的精选是 execute 结束后的 consolidate。

## 两层「path」，不要混

这是最容易写错文档的地方：

| 层 | 时机 | 产物语义 |
|----|------|----------|
| **Pre-QL `path_analysis`** | source 分析之后、写查询之前 | 从 LLM/源码侧挖掘 flow steps，喂给查询生成 |
| **Post-SARIF `path-selection`** | 查询跑完、consolidate 时 | 读 SARIF/原始路径，输出 `path-selection/dataflow.json` 等 |

前者回答「按我们对 source/sink 的理解，数据大概怎么走」；后者回答「CodeQL 真正报出来的路径里，优先看哪几条」。名字都叫 path，职责完全不同。

## Case 工作区：先对齐目录，再谈智能

每个分析用例固定在：

```text
projects/<case_id>/
├── source_code/     # 待分析源码
├── db/              # CodeQL database（如 db/java、db/python）
├── inputs/          # CVE JSON、diff、额外笔记等
├── intel/           # GHSA/NVD 缓存
└── queries/         # 可选：case 级查询覆盖
```

导入外部目录时，系统会把 `src/` 或 `source_code/`、patch、元数据同步进这套布局。额外丢进 `inputs/` 的任意文件，也会作为补充上下文喂给分析——没有花哨命名约定，有内容即可。

## 语言策略：只做三条，做透差异

当前支持 **python / java / cpp** only：

| 语言 | 建库要点 |
|------|----------|
| python | 解释型路径相对直接 |
| java | 导入侧默认 `--build-mode=none`，不追完整编译 |
| cpp | 需要 build command；本地两步走（先 configure/cmake，再用 CodeQL 包 make），失败可 Docker / 进一步降级 |

语言差异收敛在**导入与 DB 创建**，而不是让每个 Agent 各写一套目录约定。

## `CodeQLComposeTool`：主路径开，可选能力默认关

查询生成/执行核心是 `CodeQLComposeTool`（子 agent 组合：语法检查、执行、修复循环等）。若干增强开关在 CLI/工具层**默认 `False`**，例如：

- `enable_error_tidy`  
- `enable_source_sink_fallback`  
- `enable_sink_source_verification`  
- `enable_breakpoint_recovery`  

主路径不依赖这些开关「碰巧开着」。文档和演示若把它们写成 always-on，会高估 Alpha 的默认能力。

## LLM 角色：CHAT vs THINK

配置层把模型拆成两个角色（`LLMRole`）：

| 角色 | 典型用途 |
|------|----------|
| `CHAT` | 一般分析任务（情报解读、sink/source、路径解释等） |
| `THINK` | 更偏推理的 CodeQL 相关生成任务 |

Provider（`deepseek` / `siliconflow` / `zhipu` / `kimi` / `gemini` 或 OpenAI 兼容自定义）可插拔；同一 provider 可配不同的 chat/think 模型名。CLI 参数优先级高于环境变量和 `config/keys.toml`。

## 产物原则

1. **每次 run 一个时间戳目录**，避免覆盖上一次证据  
2. **summary + SARIF + 原始路径 + 精选路径** 分文件，而不是一个巨型 JSON  
3. 精选结果以 `path-selection/dataflow.json` 为二次集成首选；完整元数据在 `selection.json`

## 明确不做的事

- 不承诺端到端自动 CVE 生产或高价值命中率  
- 不把「人在回路暂停 / 持久 checkpoint 续跑」写成已交付产品能力（除非代码里有对应一等公民；当前主叙事是顺序流水线 + 落盘复查）  
- 不把默认关闭的 compose 能力写成开箱即用  

下一页是可以照着敲的安装与主路径。

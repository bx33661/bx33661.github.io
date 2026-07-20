---
title: "Problem"
description: "oh-my-vul 要解决的研究流程痛点：断点、幻觉报告、不可回放。"
navLabel: "Problem"
order: 10
draft: false
---

## 核心矛盾

Coding Agent 找危险函数、读调用链、写 PoC 已经很强了。真正麻烦的是：

**研究状态散落在对话、终端和半成品报告里，无法可靠交接。**

## 典型痛点

### 1. 发现与报告之间只有自然语言

早期流程往往是：

```text
vuln-finder →（一段很完整的分析）→ vuldb-report
```

Finder 写得很像正式结论，Reporter 却分不清：

- 哪些字段来自源码
- 哪些只是推测
- 复现到底跑过没有

### 2. 一条 finding 其实有很多硬字段

| 证据 | 需要回答 |
|------|----------|
| Tested version | 实际检查的是哪个版本 |
| Source | 哪个输入可被攻击者控制 |
| Sink | 数据最后到达什么危险操作 |
| Guard | 校验 / 编码 / 鉴权 / 沙箱是否有效 |
| Reproducer | 如何在本地重新触发 |
| Observed result | 真实运行后看到了什么 |
| Dedup | 是否已有 CVE / GHSA / 生态公告 |

缺一项，后面的「流畅报告」就可能建在过度整理的摘要上。

### 3. unknown 被悄悄填满

模型擅长把空白补成确定句。研究流程里这很危险：

- `reproducer` 写了但没跑 → `observed_result` 仍应是 `unknown`
- source 到 sink，但规范化已截断攻击 → 应是 `blocked`，不是 confirmed

### 4. 过程不可回放

一周后再打开同一目标，往往要围绕同一个 sink 重走一遍。没有工作区状态，就没有研究记忆。

## 设计目标

把一次研究收成 **可复核的工作区状态**，而不是一段会过期的聊天记录。

Agent 可以提出 bypass 假设；程序负责拦住「靠语气晋级」的 finding。

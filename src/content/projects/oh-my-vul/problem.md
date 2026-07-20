---
title: "Problem"
description: "oh-my-vul 要解决的研究流程痛点。"
navLabel: "Problem"
order: 10
draft: false
---

## Problem

常见痛点：

- Agent 输出「像漏洞」的叙述，但缺少 source → sink → guard 的可核对路径
- 复现、去重、披露格式分散在多个目录和手工步骤里
- 研究过程难回放，团队/未来的自己无法快速接手
- 公开情报与本地证据混在一起，难以形成可提交的 advisory 草稿

## Design goal

把一次研究收成**可复核的工作区状态**，而不是一段会过期的聊天记录。

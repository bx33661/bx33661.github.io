---
title: "Wireshark-MCP"
description: "给 AI 助手接上数据包分析能力：丢进 .pcap，用自然语言调用 tshark 做流量研判。"
pubDatetime: 2026-06-01
tags:
  - "MCP"
  - "PCAP"
  - "Network Security"
  - "Wireshark"
category: "MCP SERVER — 2026"
workId: "WRK_002"
status: "active"
repo: "https://github.com/bx33661/Wireshark-MCP"
order: 2
featured: true
draft: false
navLabel: "Overview"
---

## 定位

**Wireshark-MCP** 是一个 Python MCP Server：把 Wireshark / tshark 的能力接到 Claude、Cursor、VS Code 等 MCP 客户端。

你可以在对话里：

- 打开 `.pcap` / `.pcapng`
- 过滤、统计、抽 HTTP/DNS/TLS 等字段
- 跑安全向检查（威胁、凭据、隧道等）

**真实解析仍走 tshark；模型只负责编排与解释。**

## 为什么需要它

GUI 与终端来回切、过滤表达式记不住、AI「会说流量」却拿不到真实解码——这三者叠在一起，研判又慢又容易幻觉。

MCP 把「打开文件 / 跑分析 / 取结果」收成工具调用，对话变成工作台，而不是散文生成器。

## 文档导航

| 页 | 内容 |
|----|------|
| [Problem](/projects/wireshark-mcp/problem/) | 流量分析与 AI 协作的断裂点 |
| [Approach](/projects/wireshark-mcp/approach/) | 工具面设计与客户端接入 |
| [Usage](/projects/wireshark-mcp/usage/) | 安装、doctor、常用调用方式 |
| [Architecture](/projects/wireshark-mcp/architecture/) | 模块边界与数据流 |
| [Highlights](/projects/wireshark-mcp/highlights/) | 要点与链接 |

## Stack

Python · MCP · tshark / Wireshark · pip

## Links

- 仓库：<https://github.com/bx33661/Wireshark-MCP>

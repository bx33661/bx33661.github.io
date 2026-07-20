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

## Overview

**Wireshark-MCP** 是一个 Python MCP Server，把 Wireshark/tshark 能力暴露给 Claude、Cursor、VS Code 等 MCP 客户端。研究者可以在对话里打开 pcap、抽协议字段、做安全审计，而不必在终端和 GUI 之间来回切换。

## Quick start mindset

真实解析仍走 tshark；模型只负责编排与解释。幻觉空间被工具边界压住。

## Stack

Python · MCP · tshark / Wireshark · pip

## Links

- 仓库：<https://github.com/bx33661/Wireshark-MCP>

下一页：[Problem](/projects/wireshark-mcp/problem/) · [Approach](/projects/wireshark-mcp/approach/) · [Highlights](/projects/wireshark-mcp/highlights/)

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
slug: "wireshark-mcp"
---

## Overview

**Wireshark-MCP** 是一个 Python MCP Server，把 Wireshark/tshark 能力暴露给 Claude、Cursor、VS Code 等 MCP 客户端。研究者可以在对话里打开 pcap、抽协议字段、做安全审计，而不必在终端和 GUI 之间来回切换。

## Problem

- 流量分析步骤多：打开文件、过滤、导出、对照协议字段
- AI 助手「会说流量」，但拿不到真实 tshark 结果时容易幻觉
- 不同客户端各自配置 MCP 工具，安装与排障成本高

## Approach

- 以 MCP 工具集封装 tshark：打开捕获、统计、协议提取、安全检查等
- 覆盖 agentic 工作流、HTTP/DNS/TLS 等常见提取，以及威胁/凭据/隧道等安全向能力
- `wireshark-mcp install` 一键写入常见客户端配置；`doctor` 做环境诊断
- 真实解析仍走 tshark，模型只负责编排与解释

## Highlights

- 40+ 工具面，覆盖分析、提取、统计与安全审计
- 自然语言驱动，结果来自真实数据包而非凭空生成
- 一条命令适配多种 MCP 客户端
- 适合 CTF、应急、协议学习与自动化研判流水线

## Stack

Python · MCP · tshark / Wireshark · pip

## Links

- 仓库：<https://github.com/bx33661/Wireshark-MCP>

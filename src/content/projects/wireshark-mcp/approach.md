---
title: "Approach"
description: "Wireshark-MCP 如何把 tshark 能力接到 MCP 客户端。"
navLabel: "Approach"
order: 20
draft: false
---

## Approach

- 以 MCP 工具集封装 tshark：打开捕获、统计、协议提取、安全检查等
- 覆盖 agentic 工作流、HTTP/DNS/TLS 等常见提取，以及威胁/凭据/隧道等安全向能力
- `wireshark-mcp install` 一键写入常见客户端配置；`doctor` 做环境诊断
- 真实解析仍走 tshark，模型只负责编排与解释

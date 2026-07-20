---
title: "Approach"
description: "Wireshark-MCP 如何把 tshark 封装成 MCP 工具面。"
navLabel: "Approach"
order: 20
draft: false
---

## 核心思路

```text
MCP Client (Claude / Cursor / …)
        │  tools/call
        ▼
  Wireshark-MCP Server (Python)
        │  subprocess / API
        ▼
     tshark / dumpcap / …
        │
        ▼
  结构化结果回传对话
```

模型负责：选工具、组合步骤、解释结果。  
tshark 负责：解码、过滤、统计——**事实来源只有这里**。

## 工具面（概览）

覆盖大致几类（以仓库当前工具列表为准）：

| 类别 | 例子 |
|------|------|
| 会话 / 文件 | 打开 pcap、基本信息 |
| 分析 | 快速概览、安全审计入口 |
| 提取 | HTTP / DNS / TLS 等字段 |
| 统计 | 协议分布、对话、端点 |
| 安全向 | 凭据、隧道、异常模式等 |
| 运维 | install、doctor |

工具宜「小而可组合」，而不是一个万能 `analyze_everything`。

## 客户端接入

- `wireshark-mcp install`：写入常见 MCP 客户端配置  
- `doctor`：检查 tshark、权限、配置路径  

目标是把「能不能跑」从玄学变成清单。

## 设计原则

1. **真实数据优先** — 没有工具结果就不该编包内容  
2. **可诊断** — 失败要能指出缺 tshark 还是配置错  
3. **安全默认** — 本地文件分析；不把未授权网络扫描当默认能力  
4. **人机分工** — Agent 编排，研究员对结论负责  

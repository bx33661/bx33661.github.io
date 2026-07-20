---
title: "Architecture"
description: "Wireshark-MCP 的进程边界、工具层与客户端配置。"
navLabel: "Architecture"
order: 40
draft: false
---

## 进程边界

```text
┌─────────────────┐     stdio/SSE      ┌──────────────────┐
│  MCP Client     │ ◄────────────────► │  wireshark-mcp   │
│  (IDE / Claude) │                    │  Python server   │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │ tshark / system  │
                                       └──────────────────┘
```

- Client：对话、工具选择、展示  
- Server：参数校验、调用 tshark、规范化输出  
- tshark：解码权威  

## 工具层

建议保持：

- **薄封装** — 一个工具 ≈ 一类 tshark 能力  
- **显式输入** — 文件路径、显示过滤、字段列表  
- **结构化输出** — 便于模型二次处理，也便于人核对  

可选能力（若版本支持）可按「套件自动探测」挂载，避免硬依赖所有插件。

## 配置

`install` 写入各客户端的 MCP 配置片段（command + args + env）。  
配置应可被 `doctor` 回读校验。

## 失败模式

| 失败 | 处理 |
|------|------|
| tshark 缺失 | doctor 明确报错，不静默空结果 |
| 坏 pcap | 返回可理解的错误，而不是半截 JSON |
| 超时 | 大文件限制 / 建议先过滤 |

## 非目标

- 替代 Wireshark GUI 的全部交互  
- 在未授权网络上主动嗅探  
- 让模型在无工具结果时「猜包」  

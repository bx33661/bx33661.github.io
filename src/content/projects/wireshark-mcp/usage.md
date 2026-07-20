---
title: "Usage"
description: "Wireshark-MCP 安装、诊断与在 MCP 客户端中的使用方式。"
navLabel: "Usage"
order: 30
draft: false
---

## 依赖

- Python 3.x（以 README 为准）
- 系统已安装 **tshark**（Wireshark CLI）
- 一个支持 MCP 的客户端（Claude Code / Cursor / VS Code 等）

仓库与最新命令：

- <https://github.com/bx33661/Wireshark-MCP>

## 安装（概念）

```bash
# 示例：以 README 中的包名 / 入口为准
pip install wireshark-mcp

# 写入客户端配置
wireshark-mcp install

# 环境诊断
wireshark-mcp doctor
```

`doctor` 应能回答：

- tshark 是否在 PATH
- 版本是否可用
- MCP 配置是否写到预期位置

## 在对话里怎么用

典型节奏：

1. 打开捕获文件  
2. 快速概览 / 协议统计  
3. 针对假设过滤（如某 host、某 method）  
4. 提取字段或跑安全审计类工具  
5. 让模型**基于工具输出**总结，而不是凭空描述  

示例 prompt（示意）：

```text
打开 /path/to/capture.pcapng，
先给协议分布和 top talkers，
再列出可疑的明文凭据或异常 DNS。
每一步都先调用工具，再解释。
```

## 排障

| 现象 | 先查 |
|------|------|
| 工具全失败 | `doctor`、tshark 路径 |
| 客户端看不到 server | MCP JSON 路径、重启客户端 |
| 大文件很慢 | 先过滤 / 缩小范围，再深度提取 |
| 结果像「编的」 | 确认该轮是否真的有 tools/call |

## 安全提醒

- 只分析**你有权持有**的捕获文件  
- 含凭据的 pcap 注意本地存放与分享范围  
- 不要把生产环境未授权扫描接到默认工具集  

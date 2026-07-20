---
title: "Problem"
description: "Wireshark-MCP 针对的流量分析与 AI 协作痛点。"
navLabel: "Problem"
order: 10
draft: false
---

## 场景

CTF、应急、协议学习、自动化流水线里，pcap 是一等公民。问题不在「有没有 Wireshark」，而在：

### 1. 步骤碎

打开文件 → 选过滤器 → 跟流 → 导出对象 → 对照字段——每一步都在 GUI/CLI 之间切换，上下文容易丢。

### 2. AI 会「编流量」

没有真实 tshark 输出时，模型仍可能写出看起来合理的 HTTP 头、TLS 版本或「发现了明文密码」。  
对研判来说，这种流畅比沉默更危险。

### 3. 客户端配置税

Claude / Cursor / VS Code 等各自配 MCP：路径、权限、依赖、tshark 是否在 PATH……排障成本经常高于写第一条分析 prompt。

### 4. 工具能力不对称

人在 Wireshark 里点几下能做的事，Agent 默认做不到；反过来，Agent 擅长批量总结，却缺「读包」的手。

## 目标

让 Agent **有手去调 tshark**，并且：

- 结果可复现（同一 pcap + 同一工具调用 → 同一结构化输出）
- 安装可诊断（`install` / `doctor`）
- 边界清晰（模型不发明数据包内容）

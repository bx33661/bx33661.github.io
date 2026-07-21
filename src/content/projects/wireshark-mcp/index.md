---
title: "Wireshark-MCP"
description: "给 AI 一双读包的手：FastMCP 封装 tshark，约 97 个 wireshark_* 工具，本地打开 pcap 做可复现流量研判。"
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

**Wireshark-MCP**（PyPI：`wireshark-mcp@2.0.0`，Python ≥3.10）是一个 **FastMCP** 服务器：把 Wireshark CLI 套件（以 **tshark** 为核心）收成 Agent 可调用的工具面。

我写它的动机很具体：

> 给 AI 一双读包的手，而不是一张会编流量的嘴。

模型负责编排、提问和下一步假设；**解码与事实只来自 tshark**。没有工具输出，就不该出现「发现了明文密码 / TLS 1.3 / 可疑 C2」这种流畅句子。

你丢进一个 `.pcap`，在对话里说「先看协议分布和 top talkers，再查可疑 DNS」——Agent 调的是真工具，回写的是真字段。GUI 还在，需要像素级点选时请继续用 Wireshark；MCP 覆盖的是**可编排、可复现、可进 Agent 循环**的那一段。

## 适合谁 / 不适合谁

**适合**

- 在 Claude / Cursor / VS Code / Codex 等 MCP 客户端里分析 `.pcap` / `.pcapng`
- CTF、应急、协议排障、本地威胁狩猎——需要**可复现**的过滤与字段
- 希望 `install` / `doctor` 把「客户端配置税」压成清单

**不适合**

- 想要云端抓包 SaaS、远程传感器舰队
- 期望替代 Wireshark GUI 的全部交互
- 要模型在**没有** tshark 结果时「猜包」或直接判定恶意软件家族

## 你能直接用到的能力

| 能力 | 实际落点 |
|------|----------|
| 入口三件套 | `wireshark_open_file` → 协议感知推荐；`wireshark_quick_analysis`；`wireshark_security_audit` |
| 工具规模 | **约 97** 个 `wireshark_*`（core ~46 + contextual ~51）。README 里旧的「40+」是低估 |
| 注册模型 | contextual **启动时全部注册**；`open_file` 按协议做 **recommendation**，不是懒加载挂载 |
| v2 调查层 | investigation session、YAML playbooks、hypotheses / findings、report / IOC / rules、`wireshark_nl_query` |
| 客户端 | `wireshark-mcp install` 自动配置 **20+** 客户端（代码矩阵约 22 个名字） |
| Skill | 捆绑 `wireshark-traffic-analysis`：证据置信度标签 + 分场景工作流 |
| 安全边界 | `WIRESHARK_MCP_ALLOWED_DIRS`、二进制 allowlist；凭据工具敏感；`check_threats` 可能拉 URLhaus |

## 最小上手（细节在 Usage）

```sh
pip install wireshark-mcp
wireshark-mcp install
wireshark-mcp doctor   # 重启客户端后再在对话里 open_file
```

## 版本

当前文档对齐 **2.0.0**。安装后先 `wireshark-mcp doctor`，再重启 MCP 客户端。CLI 子命令还包括 `config` / `clients` / `update` / `uninstall` / `serve`。

## 文档导航

| 页 | 内容 |
|----|------|
| [Problem](/projects/wireshark-mcp/problem/) | 为什么 AI「会说流量」却读不了包 |
| [Approach](/projects/wireshark-mcp/approach/) | 工具面、推荐模型与 v2 调查层 |
| [Usage](/projects/wireshark-mcp/usage/) | 安装、doctor、主路径与速查 |
| [Architecture](/projects/wireshark-mcp/architecture/) | 进程边界、注册与安全沙箱 |
| [Highlights](/projects/wireshark-mcp/highlights/) | 要点、栈与链接 |

## Stack

Python 3.10+ · FastMCP · tshark / Wireshark CLI · pip

## Links

- 仓库：<https://github.com/bx33661/Wireshark-MCP>
- PyPI：<https://pypi.org/project/wireshark-mcp/>

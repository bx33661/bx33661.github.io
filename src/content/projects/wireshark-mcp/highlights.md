---
title: "Highlights"
description: "Wireshark-MCP 2.0 要点：约 97 工具、tshark 权威、install/doctor、调查层与安全边界。"
navLabel: "Highlights"
order: 50
draft: false
---

## 要点

- **2.0.0 / FastMCP / Python ≥3.10**，PyPI 包名 `wireshark-mcp`
- **约 97** 个 `wireshark_*` 工具（core ~46 + contextual ~51）；README「40+」为过时低估
- 入口真名：`wireshark_open_file`、`wireshark_quick_analysis`、`wireshark_security_audit`
- contextual **启动全量注册**；`open_file` 只做协议向 **推荐**
- v2：investigation、YAML playbooks、hypotheses/findings、report/IOC/`nl_query`
- `wireshark-mcp install` / `doctor` / `clients` / `config` / `update` / `uninstall` / `serve`
- 自动配置 **20+** MCP 客户端（代码约 22）
- 安全：`WIRESHARK_MCP_ALLOWED_DIRS`、二进制 allowlist；凭据工具敏感；`check_threats` 可能打 URLhaus
- 捆绑 Skill：`wireshark-traffic-analysis`（证据置信度标签）

## Stack

| 层 | 技术 |
|----|------|
| 运行时 | Python 3.10+、FastMCP |
| 解码 | tshark + 可选 Wireshark CLI 套件 |
| 分发 | PyPI `wireshark-mcp`、console script |
| 客户端 | Claude / Cursor / VS Code / Codex 等 20+ |
| 扩展 | 包内 playbooks、用户 `~/.wireshark-mcp/playbooks`、Agent Skill |

## 明确不是

- 云抓包 SaaS / 自定义协议栈  
- Wireshark GUI 完整替代  
- 无工具链的「AI 定恶意」

## Links

- 仓库：<https://github.com/bx33661/Wireshark-MCP>
- PyPI：<https://pypi.org/project/wireshark-mcp/>
- 本站：[Overview](/projects/wireshark-mcp/) · [Usage](/projects/wireshark-mcp/usage/) · [Architecture](/projects/wireshark-mcp/architecture/)

## 一句话

> 给 AI 一双读包的手，而不是一张会编流量的嘴——模型编排，tshark 出事实。

---
title: "Approach"
description: "tshark 为解码权威、约 97 工具面、open_file 推荐模型与 v2 investigation 层的设计取舍。"
navLabel: "Approach"
order: 20
draft: false
---

## 核心分工

```text
MCP Client (Claude / Cursor / Codex / …)
        │  tools/call
        ▼
  wireshark-mcp (FastMCP, Python)
        │  校验路径 / 组装参数 / 规范化 envelope
        ▼
  tshark · capinfos · editcap · dumpcap · …（allowlist）
        │
        ▼
  { success, data | error } → 模型只解释工具结果
```

一句话：

> 模型负责编排与解释；tshark 负责解码与事实。

我不做「自定义协议栈」，也不做云端抓包平台。Wireshark 生态已经是解码权威；MCP 该做的是**把权威接进对话**，并管住幻觉与误执行。

## 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 解码权威 | 系统 tshark，不是自研解析器 | 协议覆盖与正确性跟上游走 |
| 工具粒度 | 小而可组合的 `wireshark_*`，外加少数工作流入口 | Agent 好编排；人好看调用链 |
| 入口 | `open_file` / `quick_analysis` / `security_audit` | 降低「97 个工具从哪下嘴」的成本 |
| contextual | **启动全部注册** + 按协议 **推荐** | 稳定 tool surface；避免懒加载导致客户端缓存漂移 |
| 响应 | 统一 envelope + 结果缓存 | 机器可解析；重复查询省 token |
| v2 | investigation / playbooks / hypotheses / findings / report | 把多步研判从聊天气泡里捞出来 |
| 接入 | `wireshark-mcp install` 写 20+ 客户端 | 配置税从手工 JSON 变成命令 |

## 工具面怎么长

v2.0.0 代码里大约有 **97** 个 `wireshark_*` 名字，大致是：

- **Core（~46）**：抓包与文件、统计、基础提取、decode/edit/suite、可视化、以及 `wireshark_quick_analysis` / `wireshark_security_audit` 等  
- **Contextual（~51）**：协议深入、安全/威胁、ICS/IoT、forensics、anomaly、investigation、playbook、reporter、nl_query、geoip、yara 等  

旧 README 的「40+」是过时低估；本站以代码计数为准，对外说 **约 97 / 90+**。

### 真实入口（请记住名字）

1. **`wireshark_open_file`** — 打开 pcap，汇总协议，返回 **recommended tools**（不是动态注册）  
2. **`wireshark_quick_analysis`** — 快速全局画像  
3. **`wireshark_security_audit`** — 安全向多阶段编排（威胁、凭据、扫描/隧道/DoS 等）  
4. **`wireshark_get_capabilities`** — 当前机器上 tshark/套件探测结果  

之后才是 `wireshark_get_packet_list`、`wireshark_follow_stream`、`wireshark_extract_dns_queries`、`wireshark_check_threats` 这类细工具。

### contextual ≠ 懒加载

早期文档容易写成「检测到协议才注册工具」。**代码不是这样。**

```text
server 启动
  ├─ register core tools
  ├─ ToolRegistry.build catalog
  ├─ register_all_contextual_tools()   ← 全部挂上
  └─ register wireshark_open_file
         └─ 读协议层次 → PROTOCOL_TOOL_MAP → 推荐子集
```

推荐是导航，不是权限门；资源说明里也写了：`open_file` recommended, not required。

## v2 调查层

单次 `tshark` 调用解决不了应急叙事。v2 加了一层会话化能力：

| 概念 | 工具 / 载体 |
|------|-------------|
| 开调查 | `wireshark_investigate`、`wireshark_session_status` |
| Playbook | 包内 YAML（如 `malware_c2`、`data_exfil`、`initial_access`、`lateral_movement`）+ `~/.wireshark-mcp/playbooks`；`wireshark_list_playbooks` / `wireshark_execute_playbook_step` |
| 假设 | `wireshark_add_hypothesis` / `wireshark_update_hypothesis` |
| 发现 | `wireshark_add_finding` |
| 产出 | `wireshark_generate_report`、`wireshark_extract_iocs`、`wireshark_suggest_rules` |
| 自然语言桥 | `wireshark_nl_query`（把问句落到过滤/工具建议，仍不替代 tshark） |

Skill **`wireshark-traffic-analysis`** 要求把推断标成 `confirmed` / `likely` / `possible` / `unresolved`——和「事实来自工具」同一纪律。

## 主路径（概念流）

```text
pip install → wireshark-mcp install → 重启客户端 → doctor
        │
        ▼
对话: open_file(pcap)
        │  recommended tools
        ▼
quick_analysis / security_audit / 细工具组合
        │
        ▼
(可选) investigate + playbook + hypotheses/findings
        │
        ▼
report / IOC / rules — 每条结论能指回工具输出
```

## 明确不做什么

- 不发明云 SaaS 抓包控制面  
- 不宣称「AI 自动检出恶意软件」而不附工具与证据  
- 不把 GUI 全部交互 MCP 化  
- 不在未授权网络上把扫描当默认能力（capture 需要权限，且是显式工具）

实现边界见 [Architecture](/projects/wireshark-mcp/architecture/)，上手命令见 [Usage](/projects/wireshark-mcp/usage/)。

---
title: "Architecture"
description: "Wireshark-MCP 进程边界、core/contextual 注册、envelope、调查会话与安全沙箱。"
navLabel: "Architecture"
order: 40
draft: false
---

## 进程边界

```text
┌──────────────────────┐     stdio / SSE / HTTP      ┌─────────────────────────┐
│ MCP Client           │ ◄──────────────────────────► │ wireshark-mcp           │
│ IDE / Claude / Codex │     tools · resources ·     │ FastMCP application     │
└──────────────────────┘     prompts                 └───────────┬─────────────┘
                                                                 │
                                                    校验 · 组装 · envelope · cache
                                                                 │
                                                                 ▼
                                                    ┌─────────────────────────┐
                                                    │ WiresharkSuiteClient    │
                                                    │ allowlist binaries      │
                                                    │ optional dir sandbox    │
                                                    └───────────┬─────────────┘
                                                                │ subprocess
                                                                ▼
                                                    tshark / capinfos / editcap / …
```

| 角色 | 职责 |
|------|------|
| Client | 对话、选工具、展示 |
| `wireshark_mcp.server` | CLI（install/doctor/serve…）、组装 FastMCP、注册工具 |
| `tools/*` | 每个 `wireshark_*` 的参数与编排 |
| `tshark/*` | 真正调二进制、路径校验、统计/提取实现 |
| `installer/*` | 客户端探测、写配置、doctor |

**解码权威在 tshark。** Server 不维护平行协议栈。

## 启动时注册了什么

`_build_server()` 顺序（简化）：

1. 读 `WIRESHARK_MCP_ALLOWED_DIRS` → `WiresharkSuiteClient`  
2. **Core**：capture / stats / extract / files / decode / visualize / agents / suite / edit / import / advanced  
3. **Contextual**：`ToolRegistry.register_and_catalog()` → `register_all_contextual_tools()`  
4. **`wireshark_open_file`**（依赖 registry 做推荐）  
5. resources + prompts  

因此：

- 客户端看到的 tool 列表在进程生命周期内是**稳定全量**（约 97 个 `wireshark_*`）  
- `open_file` 根据协议层次解析结果，查 `PROTOCOL_TOOL_MAP`，返回 **recommended** 子集  
- 旧说法「contextual 未全部注册 / 打开文件才挂载」——**以当前代码为准：已全部注册**

Core 与 contextual 的划分是工程分组（谁在 `register_*`，谁在 `make_contextual_*`），不是「能不能调用」的运行时权限模型。

## 响应 envelope 与缓存

工具经 `envelope` 规范化，成功/失败都偏向结构化：

```text
{ "success": true,  "data": ... }
{ "success": false, "error": { "message", "error_type", ... } }
```

重复的同类 tshark 查询可走结果缓存，减轻大模型上下文里的重复噪声。Docstring 也按 token 意识压过——工具多时，说明文字本身就是成本。

## v2 调查状态落在哪

Investigation 相关工具（`wireshark_investigate`、hypothesis/finding、reporter 等）在 server 进程内维护**会话态**：playbook 步进、假设真伪、findings 列表，再导出 markdown/JSON 报告与 IOC/规则建议。

Playbook 源：

```text
package: wireshark_mcp/data/playbooks/*.yaml
user:    ~/.wireshark-mcp/playbooks/*.yaml
```

这不是分布式案件库，也不是云端 ticket；进程重启后的持久化预期以当前版本实现为准——需要长期档案时，**导出 report/IOC 到你自己的案件目录**。

## 安全边界（实现向）

| 机制 | 行为 |
|------|------|
| 二进制 allowlist | 仅允许 Wireshark 套件名（tshark、capinfos、mergecap、editcap、dumpcap、text2pcap 及其 `.exe`） |
| 目录沙箱 | 可选 `WIRESHARK_MCP_ALLOWED_DIRS`（逗号分隔）；启用后校验输入/输出路径 |
| 凭据工具 | `wireshark_extract_credentials` 显式扫描明文口令类模式——输出即敏感数据 |
| 威胁匹配 | `wireshark_check_threats` 使用 URLhaus 类 feed（缓存/拉取），**有出站网络语义** |
| 抓包 | `wireshark_capture` / 接口列举依赖系统权限；默认叙事仍是离线文件 |
| 路径探测 | `WIRESHARK_MCP_TSHARK_PATH` 等覆盖 which |

失败应当**响亮**：缺 tshark、沙箱拒绝、坏 pcap——返回 error envelope，而不是空成功或半截「看起来像数据」的字符串。

## 客户端配置如何写入

```text
wireshark-mcp install
    → installer 探测 OS 上已知客户端路径（代码矩阵约 22 名）
    → 写入 command: python -u -m wireshark_mcp.server
    → doctor 可回读校验
```

特殊结构（VS Code `mcp.servers`、Codex TOML、OpenCode 等）在 writer/config_gen 里分支处理。不靠用户手抄 JSON，但保留 `config` 子命令做手工粘贴。

## 模块地图（读代码时）

| 路径 | 内容 |
|------|------|
| `server.py` | CLI + `_build_server` |
| `tools/registry.py` | contextual catalog、`open_file`、协议→推荐 |
| `tools/agents.py` | `quick_analysis` / `security_audit` |
| `tools/investigator.py` 等 | v2 会话与报告 |
| `tshark/client.py` | 套件客户端、allowlist、沙箱入口 |
| `installer/` | install/update/uninstall/doctor/clients |
| `skills/wireshark-traffic-analysis` | Agent Skill 工作流 |

## 非目标

- 替代 Wireshark GUI  
- 多租户云分析  
- 无工具结果时的「智能猜包」  
- 把 URLhaus 命中直接等同司法级定性  

命令手册见 [Usage](/projects/wireshark-mcp/usage/)。

---
title: "Usage"
description: "wireshark-mcp 2.0 安装、doctor、open_file/quick_analysis/security_audit 主路径、CLI 与排障手册。"
navLabel: "Usage"
order: 30
draft: false
---

## 环境前提

| 依赖 | 说明 |
|------|------|
| Python | **≥ 3.10** |
| tshark | [Wireshark](https://www.wireshark.org/) CLI，需在 `PATH`（或设 `WIRESHARK_MCP_TSHARK_PATH`） |
| MCP 客户端 | Claude Desktop / Claude Code / Cursor / VS Code / Codex 等其一 |
| 可选套件 | `capinfos`、`mergecap`、`editcap`、`dumpcap`、`text2pcap` — 存在则多一批文件/抓包/编辑能力 |
| OS | macOS / Linux / Windows |

包名：`wireshark-mcp`（PyPI）。控制台入口：`wireshark-mcp`（指向 `wireshark_mcp.server:main`）。

当前文档对齐 **2.0.0**。

## 安装

```sh
pip install wireshark-mcp

# 探测本机 MCP 客户端并写入配置（可重复执行）
wireshark-mcp install

# 只装部分客户端
wireshark-mcp install --client cursor --client codex
```

然后：

1. **完全重启** MCP 客户端（半热重载经常仍读旧配置）  
2. 确认客户端里出现 `wireshark-mcp` / Wireshark MCP server  
3. 跑诊断（下一节）

其它 CLI：

```sh
wireshark-mcp update          # 重写已安装客户端的配置
wireshark-mcp uninstall       # 从已检测客户端移除
wireshark-mcp config          # 打印手动配置片段
wireshark-mcp clients         # 列出已知客户端矩阵
wireshark-mcp serve           # 前台启动 MCP server（默认 stdio）
```

`serve` 在客户端已能拉起 server 时通常不必手跑；排障或 SSE 场景再用：

```sh
wireshark-mcp serve --transport stdio
wireshark-mcp serve --transport sse --host 127.0.0.1 --port 8080
```

开发安装：

```sh
git clone https://github.com/bx33661/Wireshark-MCP.git
cd Wireshark-MCP
pip install -e ".[dev]"
```

## 诊断（doctor）

```sh
wireshark-mcp doctor
wireshark-mcp doctor --format json
wireshark-mcp doctor --client cursor
```

`doctor` 应能回答：

- 当前 Python 可执行文件是谁  
- `tshark`（及可选套件）是否找到、路径是什么  
- 各 MCP 客户端配置是否在预期位置、是否已写入 server  

`tshark` 找不到时，先装 Wireshark CLI，或：

```sh
export WIRESHARK_MCP_TSHARK_PATH=/path/to/tshark
```

同类变量还有 `WIRESHARK_MCP_CAPINFOS_PATH`、`WIRESHARK_MCP_DUMPCAP_PATH` 等（见套件探测）。

可选路径沙箱（推荐分析机收紧）：

```sh
export WIRESHARK_MCP_ALLOWED_DIRS="/cases,/tmp/pcaps"
```

未设置时不启用目录白名单；设置后，读写 pcap 路径必须落在允许目录内。

## 30 分钟主路径

以下假设：`pip install` + `wireshark-mcp install` 完成，客户端已重启，`doctor` 看到 tshark OK。

### 1. 准备一个你有权分析的 pcap

```sh
# 示例路径，换成你的文件
ls -la /path/to/capture.pcapng
```

### 2. 在对话里打开文件（推荐第一步）

```text
使用 Wireshark MCP。
先调用 wireshark_open_file，文件：/path/to/capture.pcapng
根据返回的 recommended tools 继续，不要跳过工具直接描述包内容。
```

你应看到：文件/协议概要 + **Recommended Tools** 列表。  
注意：列表是推荐，不是「只有这些能用」——全套 contextual 在启动时已注册。

### 3. 全局画像

任选其一（也可让 Agent 按 Skill 自动选）：

```text
对同一文件运行 wireshark_quick_analysis，
再补 wireshark_stats_protocol_hierarchy 与 wireshark_stats_endpoints。
```

### 4. 安全向或假设驱动

安全巡检：

```text
运行 wireshark_security_audit。
对每一个告警级结论，引用对应子工具输出；
不要把「可能」升级成「已确认」。
```

或自己给假设：

```text
假设存在 DNS 隧道或异常长域名查询。
用 wireshark_extract_dns_queries、wireshark_detect_dns_tunnel、
必要时 wireshark_follow_stream 验证或证伪。
```

### 5. 下钻到包 / 流

```text
对可疑会话：
- wireshark_get_packet_list（加 display_filter）
- wireshark_get_packet_details（具体 frame）
- wireshark_follow_stream
- wireshark_extract_http_requests / wireshark_extract_tls_handshakes …
```

### 6.（可选）v2 调查会话与报告

```text
用 wireshark_list_playbooks 看内置剧本，
wireshark_investigate 开会话，
对关键假设 wireshark_add_hypothesis / wireshark_update_hypothesis，
确认的点 wireshark_add_finding，
最后 wireshark_generate_report 与 wireshark_extract_iocs。
```

内置 playbook 文件名包括：`malware_c2`、`data_exfil`、`initial_access`、`lateral_movement`（包数据目录；用户可往 `~/.wireshark-mcp/playbooks` 加 YAML）。

### 7. Skill

若客户端支持 Agent Skills，启用 **`wireshark-traffic-analysis`**：它会按 triage / security / incident-response / troubleshoot / ctf 选工作流，并要求置信度标签。

## 命令与工具速查

### CLI

| 命令 | 作用 |
|------|------|
| `wireshark-mcp install` | 写入检测到的 MCP 客户端配置 |
| `wireshark-mcp update` | 重写已安装配置 |
| `wireshark-mcp uninstall` | 移除配置 |
| `wireshark-mcp doctor` | 环境与客户端诊断 |
| `wireshark-mcp clients` | 列出支持的客户端名 |
| `wireshark-mcp config` | 打印手动片段（含 codex-toml 等 format） |
| `wireshark-mcp serve` | 启动 MCP server |

### 高频 MCP 工具

| 工具 | 用途 |
|------|------|
| `wireshark_open_file` | 打开 pcap + 协议感知推荐 |
| `wireshark_quick_analysis` | 快速全局分析 |
| `wireshark_security_audit` | 安全多阶段审计 |
| `wireshark_get_capabilities` | 本机套件能力 |
| `wireshark_get_file_info` | capinfos 元数据（若可用） |
| `wireshark_get_packet_list` / `_details` / `_bytes` | 列表 / 详情 / hex |
| `wireshark_follow_stream` | 跟流 |
| `wireshark_extract_fields` | 任意字段 TSV |
| `wireshark_extract_http_requests` | HTTP |
| `wireshark_extract_dns_queries` | DNS |
| `wireshark_extract_tls_handshakes` | TLS |
| `wireshark_extract_credentials` | 明文凭据（敏感） |
| `wireshark_check_threats` | 与 URLhaus 等威胁源匹配（可能访问网络） |
| `wireshark_detect_dns_tunnel` / `_port_scan` / `_dos_attack` | 行为向检测 |
| `wireshark_nl_query` | 自然语言 → 查询/工具建议 |
| `wireshark_investigate` 等 | v2 会话、假设、发现 |
| `wireshark_generate_report` / `wireshark_extract_iocs` | 报告与 IOC |
| `wireshark_capture` | 实时抓包（需权限；非默认分析路径） |

完整列表以运行中的 MCP tool 列表为准；规模大约 **90+ / 约 97**。

## 常见失败

| 现象 | 先查 |
|------|------|
| 客户端没有 Wireshark 工具 | 是否 `install`、是否**重启**、`wireshark-mcp clients` / `doctor` |
| 所有调用失败 / 找不到 tshark | `doctor`；PATH；`WIRESHARK_MCP_TSHARK_PATH` |
| Path sandbox violation | `WIRESHARK_MCP_ALLOWED_DIRS` 是否过窄；文件是否在允许目录 |
| 大文件极慢或超时 | 先 `display_filter` / `limit`；别一上来全量 bytes |
| 结论像「编的」 | 检查该轮是否真有 tools/call；要求贴工具原文 |
| `check_threats` 慢或失败 | 其会拉/用 URLhaus 缓存；网络策略与隐私是否允许 |
| `extract_credentials` 输出敏感 | 预期行为；注意日志、分享与截图范围 |
| capture 失败 | 接口权限、`dumpcap`/tshark 能力、平台抓包策略 |
| 想手动配客户端 | `wireshark-mcp config`，或仓库 docs-site 的 manual-configuration |

## 安全提醒（使用侧）

- 只分析**你有权持有**的捕获  
- 含凭据 / 内网拓扑的 pcap：本地存放与对话外传要克制  
- `wireshark_extract_credentials` 会主动找明文口令类模式  
- `wireshark_check_threats` 可能把从流量抽出的 URL/主机相关指标用于威胁源匹配  
- 二进制执行有 allowlist（tshark 等套件名）；不是任意 shell  
- 实时 `wireshark_capture` 需要系统抓包权限——默认故事仍是**离线 pcap**

## 下一步

- 模块与沙箱边界：[Architecture](/projects/wireshark-mcp/architecture/)  
- 设计取舍：[Approach](/projects/wireshark-mcp/approach/)  
- 上游仓库与 release：<https://github.com/bx33661/Wireshark-MCP>

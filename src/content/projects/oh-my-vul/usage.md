---
title: "Usage"
description: "oh-my-vul 安装、omv setup/start、Campaign 开题、audit/repro/review/report 主路径与命令速查。"
navLabel: "Usage"
order: 30
draft: false
---

## 环境前提

| 依赖 | 说明 |
|------|------|
| Node.js | **≥ 22** |
| Python 3 | Skills 辅助脚本；报告渲染器自带固定版 PyYAML 依赖 |
| Agent | [Codex](https://developers.openai.com/codex/) 或 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) |
| OS | Windows / Linux / macOS（Windows 上 Ink TUI 建议新版 Terminal 或 PowerShell） |

包名：`oh-my-vul`（npm）。二进制：`omv` 与 `oh-my-vul`。

## 安装

全局安装 CLI，并把 Skills 装进你的 Agent 平台：

```sh
npm install --global oh-my-vul@latest

# Codex
omv setup --platform codex

# 或 Claude Code（若省略 --platform，兼容默认仍是 claude-code）
omv setup --platform claude-code
```

`setup` 会打印安装目录并做健康检查。全部通过后：

1. **重启** Codex 或 Claude Code  
2. Codex 调用 `$omv`；Claude Code 调用 `/omv`  

用户级 Skills 路径大致是：Codex → `~/.agents/skills`；Claude Code → 其 project/user skills 布局（以 `setup` 输出为准）。

项目级安装示例：

```sh
omv setup --scope project --platform codex
```

干跑：

```sh
omv setup --scope user --platform codex --dry-run
```

## 诊断

```sh
omv doctor --platform codex
omv doctor --platform claude-code
omv doctor --strict
omv version
```

CLI 与内置 Skills **按同一发行版配套**。升级 npm 包后若 doctor 报漂移，按提示执行：

```sh
omv setup --scope user --platform codex --force
# 或 project scope
```

## 30 分钟主路径

以下假设你已经 `setup` 完成并重启过 Agent。

### 1. 进入目标仓库并开题

```sh
cd /path/to/research-target
omv start
```

`omv start` 会：确保 `.omv/` 写入 `.gitignore`、识别本地项目元数据、引导创建第一个 **Campaign**（研究哪些漏洞类型）。

非交互示例：

```sh
omv start --vuln xss,auth --no-interactive
```

> **不要用** 已删除的 `omv init` / `omv workspace init` / `omv first`。1.0 的入口就是 `omv start`（或高级：`omv campaign init`）。

### 2. 在 Agent 里接上工作区

```text
# Codex
$omv

# Claude Code
/omv
```

需要纪律提醒时先走 `/using-omv`（或 Codex 对应调用方式）。

交互式终端里直接运行：

```sh
omv
# 等价：omv tui
```

打开**只读**研究工作台（队列 / Campaign / Activity）。改状态请回到命令或 Skill。

### 3. 收敛攻击面并 seed（推荐）

```sh
omv campaign list
omv campaign show <campaign-id>

omv campaign surfaces propose <campaign-id>
omv campaign surfaces show <campaign-id>
omv campaign surfaces select <campaign-id> --cards archive-extractor,template-engine

omv campaign seed <campaign-id>
```

`seed` 只生成 **candidate** 模板，不会伪造 observed_result 或 confirmed。

### 4. 发现与审计

在 Agent 中（名称以平台前缀为准）：

```text
/omv-find
/omv-audit <finding-id>
```

CLI 侧常用：

```sh
omv findings list
omv findings show <id>
omv findings validate <id>
```

### 5. 本地复现（缺 observed_result 时必做）

```text
/omv-repro <finding-id>
```

或：

```sh
omv repro init <id>
```

你在本地跑 PoC / 测试命令后，把**真实输出**写回证据。不要让模型替你「看见」结果。

### 6. 查重与对抗审查

```text
/omv-dedup <finding-id>
/omv-critic <finding-id>
```

```sh
omv dedup <id>          # 按 CLI 帮助确认写回开关
```

### 7. 严格审查 → 报告 → 归档

```sh
omv review <id>
omv review <id> --strict
```

当 review 给出可报告信号，且 status/分数门禁满足时：

```text
/omv-report <finding-id>
```

```sh
omv report artifacts <id>
omv report provenance <id>
omv findings archive <id> --reason reported
# 需要更严检查时按 CLI 支持加 --strict
```

披露跟进：

```text
/omv-disclose <finding-id>
```

```sh
omv disclose timeline <id>
omv submissions --help
```

## 命令速查

### 日常核心

| 目标 | 命令 |
|------|------|
| 开题 / 初始化私有状态 | `omv start` |
| 只读 TUI | `omv` / `omv tui` |
| 文本仪表盘 | `omv dashboard` |
| 平台安装 Skills | `omv setup --platform codex\|claude-code` |
| 健康检查 | `omv doctor --platform …` |
| 审查一条 finding | `omv review <id> [--strict]` |

### Campaign / findings（高级）

| 目标 | 命令 |
|------|------|
| Campaign 生命周期 | `omv campaign init\|list\|show\|seed` |
| 攻击面 | `omv campaign surfaces propose\|show\|select` |
| Finding 操作 | `omv findings init\|list\|show\|validate\|promote\|archive\|restore` |
| 晋级状态 | `omv findings promote <id> --status candidate\|confirmed\|blocked` |

### 与 Skills 配套的确定性原语

| 目标 | 命令 |
|------|------|
| 复现目录 | `omv repro init <id>` |
| 报告产物 | `omv report artifacts\|provenance <id>` |
| SourceRef | `omv sources init\|show\|validate` |
| ThreatMap | `omv threat-map init\|validate` |
| Verification | `omv verification init\|show\|validate` |
| 被动 HTTP 请求代理 | `omv request preflight\|fetch` |
| Radar | `omv radar refresh\|brief` |
| 本地评测 | `omv eval [--json\|--junit]` |

完整列表：`omv help`、`omv help --all`。

## Agent Skill 调用名

| Skill | Claude Code | Codex（常见） |
|-------|-------------|---------------|
| 管理 | `/omv`、`/using-omv` | `$omv`、对应 using 技能 |
| 研究 | `/omv-find` | `$omv-find` |
| 审计 | `/omv-audit` | `$omv-audit` |
| 复现 | `/omv-repro` | `$omv-repro` |
| 情报 | `/omv-dedup`、`/omv-radar` | 同名 `$` |
| 报告 | `/omv-critic`、`/omv-report`、`/omv-disclose` | 同名 `$` |

## 已移除命令（文档里不要再写）

| 旧 | 现在 |
|----|------|
| `omv first` | `omv start` / `omv campaign init` |
| `omv workspace init` | `omv start` |
| `omv findings delete` | `omv findings archive --reason …` |
| `omv findings doctor/open/workflow` | `omv review` / `show` / `dashboard` |
| 实验性 `omv-mcp` | 已移除 |

## 常见失败

| 现象 | 排查 |
|------|------|
| Agent 里没有 `/omv` | 是否 `setup` 成功？是否重启 Agent？`doctor --platform` |
| `review` 一直 `needs-repro` | `observed_result` 仍是 unknown；走 `/omv-repro` 并写入真实观察 |
| 分数不达 75 | `omv findings show/validate` 看扣分项：blocker、dedup、CVSS、repro 附件 |
| 想标 confirmed 失败 | 缺 confirmed 硬字段（tested、source/sink/guard/reproducer/observed_result、cvss.vector 等） |
| 升级后 Skill 行为怪 | CLI/Skills 版本漂移 → `doctor` + `setup --force` |
| 把 `.omv/` 提交到 git | `start` 会写 ignore；仍建议确认；finding 可能含敏感信息 |

## 安全使用提醒

- 发现阶段：公开元数据与公开源码  
- 复现：本地或**明确授权**环境  
- 不要把工具指向未授权的第三方生产系统  
- 自动报告仍需人工核对证据后再提交 CNA / 厂商  

## 下一步

- 状态机与目录：[Architecture](/projects/oh-my-vul/architecture/)  
- 设计叙事：[oh-my-vul 1.0 设计与实践](/blog/oh-my-vul-1-0/)  
- 上游：[GitHub bx33661/oh-my-vul](https://github.com/bx33661/oh-my-vul) · 仓库内 `docs/examples/demo-finding-flow.md`

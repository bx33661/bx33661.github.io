---
title: "Usage"
description: "PureAutoCodeQL 安装、doctor、case 分析主路径、import、本地 API 与常见失败排查。"
navLabel: "Usage"
order: 30
draft: false
---

## 环境前提

| 依赖 | 说明 |
|------|------|
| Python | **≥ 3.13** |
| [uv](https://github.com/astral-sh/uv) | 依赖与虚拟环境 |
| [CodeQL CLI](https://github.com/github/codeql-cli-binaries) | 必须在 `PATH` 中 |
| Node.js 18+ / npm | 构建 MCP ripgrep 工具 |
| LLM API Key | 写入 `config/keys.toml` |
| 可选 Docker | C/C++ 建库兜底 |
| 可选 JDK | Java LSP / 部分 Java 场景；`JAVA_HOME` 或 keys 里 `java_home` |

包名：`pure-auto-codeql`（0.1.0 Alpha）。仓库：<https://github.com/Fruit-Guardians/PureAutoCodeql>。

## 安装

```bash
git clone https://github.com/Fruit-Guardians/PureAutoCodeql.git
cd PureAutoCodeql

uv sync

# macOS / Linux：构建 MCP ripgrep
chmod +x build_mcp.sh
./build_mcp.sh

# Windows 可用
# build_mcp.bat

cp config/keys.example.toml config/keys.toml
# 编辑 keys.toml，填入至少一个 provider 的 API Key
```

内置 provider 包括 `deepseek`、`siliconflow`、`zhipu`、`kimi`、`gemini`；也支持任意 OpenAI 兼容自定义服务商（见 `config/keys.example.toml` 与 `config/README.md`）。

## 诊断

先确认环境，再跑 case：

```bash
uv run python Analyze.py --doctor
# 等价
uv run pure-auto-codeql doctor

uv run python Analyze.py --list-providers
uv run python Analyze.py --list-models
uv run python Analyze.py --list
```

`--doctor` 会检查 Python、uv、CodeQL CLI、Node.js、npm、MCP 构建产物、`keys.toml`、`JAVA_HOME` 与可用 LLM Provider。新机器或 CI 失败时优先跑它。

校验某个已导入 case：

```bash
uv run python Analyze.py --validate CVE-2021-21985
```

## 30 分钟主路径

以下假设 `doctor` 已基本通过，且本机有可用 LLM Key。

### 1. 准备一个 case 工作区

**方式 A：用仓库已有 / 模板 case**

```bash
# 从模板复制
cp -R projects/case-template projects/CVE-DEMO-0001

# 放入源码
# projects/CVE-DEMO-0001/source_code/...

# 放入至少一个 CVE JSON（及可选 diff）
# projects/CVE-DEMO-0001/inputs/CVE-*.json
```

标准布局：

```text
projects/<case_id>/
├── source_code/
├── db/
├── inputs/
├── intel/
└── queries/          # 可选
```

**方式 B：从外部目录导入**

```bash
uv run python Analyze.py --import-project "/path/to/CVE-2025-54381" \
  --import-language java \
  --import-overwrite
```

C/C++ 需要构建命令时：

```bash
uv run python Analyze.py --import-project "/path/to/CVE-XXXX" \
  --import-language cpp \
  --import-build-command "make -j4"
```

外部目录推荐结构：

```text
CVE-XXXX-XXXX/
├── CVE-XXXX-XXXX.json
├── patch/
│   └── *.patch 或 *.diff
└── src/ 或 source_code/
```

Java 导入侧会走 **`--build-mode=none`**（不追完整编译）。C/C++ 则依赖你提供的 build command，并可能走本地两步走 / Docker 回退——失败时先看 `projects/<case>/db/` 下日志。

### 2. 跑完整分析

旧入口与新子命令等价：

```bash
uv run python Analyze.py --case CVE-2021-21985 --provider deepseek

# 或
uv run pure-auto-codeql analyze --case CVE-2021-21985 --provider deepseek
```

安静模式（少打印思考过程）：

```bash
uv run python Analyze.py --case CVE-2021-21985 --no-stream
```

若 `--case` 直接给**目录路径**，会尝试自动导入到 `projects/`、同步补丁并建库：

```bash
uv run python Analyze.py --case "/path/to/CVE-2025-54381" \
  --provider deepseek \
  --refresh-intel
```

`--refresh-intel` 强制重拉 GHSA/NVD 缓存（`intel/`）。凭据可用 `GITHUB_TOKEN` / `NVD_API_KEY` 或对应 CLI 标志。

### 3. 读产物（先看这三处）

默认输出：

```text
output/<case>/<YYYYMMDD-HHMMSS>/
├── summary.md
├── sarif/
│   └── codeql-run.sarif
├── codeql/
│   └── all-paths-raw.json
└── path-selection/
    ├── report.md
    ├── selection.json
    └── dataflow.json
```

建议阅读顺序：

1. `summary.md` — 全流程纪要（CVE / source / sink / 查询与执行摘要）  
2. `path-selection/report.md` — 为什么选这些路径  
3. `path-selection/dataflow.json` — **精选后的路径**，二次集成优先用它  
4. 需要对照噪音时再打开 `codeql/all-paths-raw.json` 与 `sarif/codeql-run.sarif`

```bash
# 快速瞄一眼精选路径
cat output/*/*/path-selection/dataflow.json | head
```

**不要**到虚构的 `reports/` 或顶层 `results/*.sarif` 里找主产物——当前权威树就是 `output/<case>/<timestamp>/`。

### 4.（可选）只做 Markdown → 查询 / Source 报告

已有漏洞描述和 DB 时：

```bash
uv run python Analyze.py --md-file vulnerability.md \
  --database-path /path/to/codeql-db \
  --language java \
  --provider deepseek
```

先基于描述和源码生成 Source 分析：

```bash
uv run python Analyze.py --md-file vulnerability.md \
  --src-path /path/to/source \
  --language python \
  --output source_report.md
```

## 命令速查

| 意图 | 命令 |
|------|------|
| 环境检查 | `uv run python Analyze.py --doctor` |
| 列 case | `uv run python Analyze.py --list` |
| 校验 case | `uv run python Analyze.py --validate <case>` |
| 列 provider / 模型 | `--list-providers` / `--list-models` |
| 分析 case | `uv run python Analyze.py --case <id> --provider <name>` |
| 同上（新 CLI） | `uv run pure-auto-codeql analyze --case <id>` |
| 仅导入 | `--import-project <path> --import-language java\|python\|cpp` |
| 刷新情报 | 分析时加 `--refresh-intel` |
| 安静跑 | `--no-stream` |
| 起 API | `uv run pure-auto-codeql serve --host 127.0.0.1 --port 8000` |
| 起 API（uvicorn） | `uv run uvicorn api.server:app --host 127.0.0.1 --port 8000` |

CLI 参数优先级：**命令行 > 环境变量 > `config/keys.toml`**。

## 本地 API（可选）

默认安全姿态偏紧，适合本机编排，不适合裸奔公网：

```bash
uv run pure-auto-codeql serve --host 127.0.0.1 --port 8000
# 或
uv run uvicorn api.server:app --host 127.0.0.1 --port 8000
# 或
./scripts/start_api_server.sh
```

默认策略：

- 只监听 **`127.0.0.1`**  
- 项目导入默认限制在 `API_IMPORT_SOURCES_DIR`（仓库内 `imports/`）  
- 请求体里的 C/C++ 构建命令**默认禁用**  
- 设置 `API_AUTH_TOKEN` 后，接口需要 Bearer Token  

```bash
export API_AUTH_TOKEN="change-me"
uv run uvicorn api.server:app --host 127.0.0.1 --port 8000

curl -H "Authorization: Bearer change-me" http://127.0.0.1:8000/api/projects
```

若你明确要放开（清楚风险后再开）：

```bash
export API_ALLOW_EXTERNAL_IMPORT_PATHS=true
export API_ALLOW_API_BUILD_COMMANDS=true
```

SSE 事件与路由细节见上游 `api/README.md`、`api/SSE_REFERENCE.md`。长任务适合用 SSE 订进度，而不是傻等一个同步 HTTP。

## Compose 增强开关（默认 off）

主路径不要求打开它们。需要实验时再显式启用（具体 flag 以当前 CLI `--help` 为准），例如：

- `enable_error_tidy`  
- `enable_source_sink_fallback`  
- `enable_sink_source_verification`  
- `enable_breakpoint_recovery`  

把「仓库里存在的实验能力」当成「默认全开」会误导预期。

## 常见失败

| 现象 | 先查什么 |
|------|----------|
| `doctor` 报 CodeQL 缺失 | `which codeql`、PATH、CLI 版本 |
| MCP / ripgrep 相关失败 | 是否执行过 `./build_mcp.sh`，Node/npm 是否可用 |
| Provider 不可用 | `keys.toml` 是否复制并填写；`--list-providers` |
| 导入后无源码 | 外部目录是否有 `src/` 或 `source_code/` |
| Java DB 失败 | 源根是否正确；`--build-mode=none` 日志 |
| C/C++ DB 失败 | build command 是否在本机可手动跑通；两步走 / Docker 日志（`db/codeql.log`、`build.log`） |
| 查询编译失败 | 生成的 QL、语言 pack、`CodeQLComposeTool` 语法检查输出 |
| 空 SARIF / 无路径 | DB 是否对应补丁版本；sink/source 假设是否过宽或过窄 |
| 只有 summary、精选为空 | 查询是否未命中；看 `codeql/all-paths-raw.json` 是否本来就空 |
| API 连不上 / 无事件 | 是否绑在 `127.0.0.1`；SSE 客户端；`API_AUTH_TOKEN` |
| 导入被拒 | 是否超出 `imports/`；未开 `API_ALLOW_EXTERNAL_IMPORT_PATHS` |

## 实践建议

1. **先用已知 CVE 小仓库打通全链路**，再上大型 monorepo。  
2. C/C++ 把 build 写成可重复脚本；不要指望「随便 make 一下」。  
3. 把 LLM 输出当草稿：以 CodeQL 命中与人工审计为准。  
4. 保留整份 `output/<case>/<timestamp>/`，二次审计比只留聊天记录便宜得多。  
5. 语言边界诚实：当前只有 **python / java / cpp**。

## 下一步

- 模块边界与产物树：[Architecture](/projects/pure-auto-codeql/architecture/)  
- 设计取舍：[Approach](/projects/pure-auto-codeql/approach/)  
- 上游仓库与更细 flag：<https://github.com/Fruit-Guardians/PureAutoCodeql>

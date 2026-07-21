---
title: "Architecture"
description: "PureAutoCodeQL 的 case 工作区、默认流水线边界、产物树与 CLI/API 形态。"
navLabel: "Architecture"
order: 40
draft: false
---

## 总览

系统可以看成四层：

```text
┌─────────────────────────────────────────────────────────┐
│  入口：Analyze.py 兼容层 / pure-auto-codeql CLI / API   │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  core.AnalysisPipeline（五步）+ finally consolidate     │
└───────────────────────────┬─────────────────────────────┘
                            ▼
┌──────────────┬────────────────────┬─────────────────────┐
│ agents       │ tools              │ services            │
│ CVE/Sink/…   │ CodeQLComposeTool  │ path_selection, LLM │
└──────────────┴────────────────────┴─────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│  磁盘：projects/<case>/… 与 output/<case>/<ts>/…        │
└─────────────────────────────────────────────────────────┘
```

权威状态在**磁盘上的 case 与 run 目录**，不在某个长期内存会话里。跑完留下 `output/`，下次从文件接着审。

## Case 工作区（输入侧权威）

```text
projects/<case_id>/
├── source_code/     # 源码树（导入时也可来自 src/）
├── db/              # CodeQL database（常按语言分子目录）
├── inputs/          # CVE JSON、diff、任意补充上下文文件
├── intel/           # GHSA/NVD 等情报缓存
└── queries/         # 可选：case 级 QL 覆盖
```

`utils/case.py` 把上述路径解析成 `CasePaths`。分析步骤通过 `AnalysisContext` 拿到 `case_id`、`language`、`case_paths`、上一步 `AgentResult`，以及可选的 event callback（给 API/SSE 用）。

| 目录 | 谁写 | 谁读 |
|------|------|------|
| `source_code/` | 导入器 / 研究员 | sink/source/path agents、CodeQL source-root |
| `db/` | 导入与 `codeql database create` | `CodeQLComposeTool` 执行查询 |
| `inputs/` | 人 / 导入器 | CVE 分析与额外上下文 |
| `intel/` | GHSA/NVD fetcher | CVE 分析；`--refresh-intel` 可重拉 |
| `queries/` | 人（可选） | 查询生成侧覆盖 |

## 默认流水线（进程内）

`AnalysisPipeline.create_default_pipeline()` 固定顺序：

1. `CVEAnalysisStep` → `cve_analysis`  
2. `SinkAnalysisStep` → `sink_analysis`  
3. `SourceAnalysisStep` → `source_analysis`  
4. `PathAnalysisStep` → `path_analysis`（pre-QL flow steps）  
5. `CodeQLGenerationStep` → `codeql_generation`  

任一步 `success=False` 会打断后续步骤，但 `finally` 仍会尝试 `_consolidate_output_files`，尽量把已有中间结果写进本次 run 目录。

### 两层 path 在架构上的位置

```text
source_analysis
      │  source_to_sink_paths
      ▼
path_analysis          ──►  flow_steps（结构化，供生成 QL）
      │
      ▼
codeql_generation      ──►  QL + 执行 + SARIF / raw paths
      │
      ▼ (finally)
path-selection service ──►  report.md / selection.json / dataflow.json
```

- **Pre-QL**：`PathAnalysisAgent.identify_flow_steps`，输入来自 source 分析 JSON。  
- **Post-SARIF**：`PathSelectionService`（在 consolidate 里调用），输入来自查询执行结果。

混成「一个 path 阶段」会同时写错顺序和产物含义。

## 查询执行边界：`CodeQLComposeTool`

`tools/codeql_compose.py` 是查询生成与执行的组合工具：临时 query pack、LSP 语法检查、真正 `codeql` 执行、失败修复循环等。若干能力以实例字段默认关闭：

- `enable_error_tidy = False`  
- `enable_source_sink_fallback = False`  
- `enable_breakpoint_recovery = False`  
- （CLI 层还有 `enable_sink_source_verification` 等，同样默认 off）

架构含义：主路径是「能生成并跑」；增强恢复/回退是显式打开的实验面，不是隐藏的 always-on。

## 输出树（run 侧权威）

consolidate 使用 `config.output_base_dir`（默认语义上的 `output/`），目录为：

```text
output/
└── <case_tag>/
    └── <YYYYMMDD-HHMMSS>/
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

| 文件 | 角色 |
|------|------|
| `summary.md` | 给人读的全流程报告 |
| `sarif/codeql-run.sarif` | CodeQL 原始 SARIF，对接其它工具 |
| `codeql/all-paths-raw.json` | 未筛选路径，调试用 |
| `path-selection/dataflow.json` | 精选路径（二次集成首选） |
| `path-selection/selection.json` | 精选元数据、打分与验证细节 |
| `path-selection/report.md` | 人类可读的选择说明 |

没有把主产物放在 `reports/` 或松散的 `results/*.sarif`——若旧笔记这么写，以当前 consolidate 为准。

## 运行形态与配置

| 形态 | 入口 | 特点 |
|------|------|------|
| 兼容 CLI | `uv run python Analyze.py …` | 历史脚本与文档最常见 |
| 打包 CLI | `uv run pure-auto-codeql …` | `pyproject` → `pure_auto_codeql.cli.app:cli` |
| HTTP API | `serve` / `uvicorn api.server:app` | 任务、项目、SSE；默认 localhost + 导入 lockdown |

CLI/API 共享工作流方向（`pure_auto_codeql.application` 等）。包命名空间迁向 `pure_auto_codeql.*`，同时保留 `Analyze.py`、`from config import …` 兼容面。

| 关注点 | 落点 |
|--------|------|
| API Keys / provider | `config/keys.toml`（模板 `keys.example.toml`） |
| LLM 角色 | `LLMRole.CHAT` / `LLMRole.THINK` |
| 导入与语言 | `--import-language`、`--import-build-command`；仅 python/java/cpp |
| Java / C++ DB | Java 默认 `--build-mode=none`；C++ 两步走 + 可选 Docker |
| API 安全 | `API_AUTH_TOKEN`、`API_IMPORT_SOURCES_DIR`、`API_ALLOW_*` |

## 非目标（架构层）

- 分布式多租户 SaaS；保证高价值命中  
- 无代码证据的「持久 checkpoint 人机暂停」产品层  
- 把默认 off 的 compose flag 画进关键路径  

## 相关页

- [Usage](/projects/pure-auto-codeql/usage/) · [Approach](/projects/pure-auto-codeql/approach/)  
- 上游：<https://github.com/Fruit-Guardians/PureAutoCodeql>

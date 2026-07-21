---
title: "Architecture"
description: "oh-my-vul 的组件边界、.omv 布局、Evidence/Review/Archive 三套状态机与契约清单。"
navLabel: "Architecture"
order: 40
draft: false
---

## 组件边界

```text
Codex ($skill) / Claude Code (/skill)
        │  10 Skills + 可选 Claude agents
        ▼
  .omv/   私有研究状态（应 gitignore）
        │  Evidence.v1 + sidecars
        ▼
  TypeScript CLI  (src/cli/*)
        │  validate · review · campaign · archive · request · TUI
        ▼
  contracts/ + shared/   (schema、pattern-packs、surface-catalog)
```

| 层 | 职责 | 硬边界 |
|----|------|--------|
| Skills / Agent | 理解代码、写假设与叙述 | 不能单靠文笔跳过 CLI 门禁 |
| CLI | 校验、晋级、归档、provenance、只读 TUI | 不替你做最终 exploit 判断 |
| `.omv/` | 研究记忆与产物 | 默认本地；不含「自动同步云端」产品叙事 |
| contracts | 字段与晋级规则 | 1.0 起 closed/extensible 分类；升级不单为改 schema 而重写你的私有状态 |

Node 公共 API 只从包根导出（如 `listFindings`、`reviewFinding`）；不要依赖深路径 `oh-my-vul/dist/cli/*`。

## `.omv/` 布局

项目根解析顺序概念上是：`OMV_PROJECT_ROOT` / `OMV_ROOT` / `--root` → 含 `.omv` 的目录 → cwd。

| 路径 | 内容 |
|------|------|
| `.omv/campaigns/<id>.yaml` | Campaign.v1 |
| `.omv/campaigns/<id>.md` | 确定性 runbook |
| `.omv/campaigns/<id>.surfaces.yaml` | AttackSurfaceList.v1 |
| `.omv/findings/<id>.yaml` | 活跃 Evidence.v1 |
| `.omv/archive/findings/` + `archive/metadata/` | 归档 finding + 原因 |
| `.omv/threatmaps/<id>.yaml` | ThreatMap.v1 |
| `.omv/verifications/<id>.yaml` | Verification.v1 |
| `.omv/sources/<id>.yaml` | SourceRef.v1（本地身份/哈希，**不是**远端真实性证明） |
| `.omv/repro/<id>/` | 复现附件（commands、observed、截图等） |
| `.omv/reports/<id>/` + `provenance.json` | 草稿 + ReportProvenance.v1 |
| `.omv/submissions/<id>.yaml` | Submission.v1 提交簿记 |
| `.omv/notes/` | 笔记本（不是 Evidence） |
| `.omv/radar/` | watchlist + events |
| `.omv/cache/http/` | request broker 缓存 |
| `.omv/activity.jsonl` | 生命周期活动流（TUI 读尾部） |
| `.omv/index.json` | 可重建索引 |

## 三套「状态」——不要画成一条箭头

### A. Evidence.v1 `status`（仅三值）

```text
candidate  ⇄  confirmed
     │
     └──► blocked
```

- 变更走 `omv findings promote <id> --status …`（会重校验）  
- **`confirmed` 机器字段**包括：`versions.tested`，`evidence.source|sink|guard|reproducer|observed_result`，`cvss.vector` 等  
- `exploitability: proven` 时，`observed_result` 不能仍是空话 unknown  

### B. `omv review` verdict（动作建议）

| Verdict | 典型含义 |
|---------|----------|
| `ready` | 达到报告导向门槛，可考虑 `/omv-report` |
| `needs-repro` | 主要卡在缺少真实 `observed_result` |
| `needs-audit` | 证据链其它缺口 |
| `needs-verification` | strict：Verification 缺失/失败/过期 |
| `blocked` | 与 blocked/disproven 等终态一致，宜归档或停 |

### C. Archive reason（文件位置，不是 status）

```sh
omv findings archive <id> --reason reported
# 其它 reason 例：blocked、not-reproducible、…
```

归档后 finding 离开活跃目录；可 `restore`。  
`reported` 等 reason 可能带额外产物/提交记录检查（以当前 CLI 为准）。

把 B/C 画进 A 的状态机，是旧展示文档最常见的错误。

## 双分数（机器层）

```text
evidence_score     = 关键字段完整度加权
submission_score   = evidence_score − 扣罚
report-ready       ≈ confirmed ∧ validation.ok ∧ submission_score ≥ 75
                     ∧（存在的 sidecar 规则满足；strict 更严）
```

扣罚直觉：缺 observed、未解 blocker、dedup 不全、blocked/disproven、repro 附件缺失、unverified_fields、低置信度等。  
`status: blocked` 时 submission 可被直接压到不可提交。

## 关键契约

| 契约 | 角色 |
|------|------|
| Evidence.v1 | finding 主对象 |
| Campaign.v1 | 范围、目标、预算深度 |
| AttackSurfaceList.v1 | 攻击面卡片 |
| CandidateList.v1 | find 阶段排序表 |
| ThreatMap.v1 | source→transforms→sink→guard 笔记 |
| Verification.v1 | 独立审查；可绑定 finding 哈希防过期 |
| SourceRef.v1 | 本地源码定位与哈希 |
| ReportProvenance.v1 | 报告输入指纹 |
| Submission.v1 | 提交后簿记 |

契约分 **closed / extensible**：扩展字段有规则；包升级不应只为 schema 改写你的私有 `.omv` 历史。细节以仓库 `contracts/` 为准。

## 请求代理（被动研究）

`omv request preflight|fetch` 走本地 broker：缓存、公开元数据导向、体积与目标限制（防把研究 CLI 变成随意 SSRF 客户端）。  
这是基础设施，不是「自动打目标」开关。

## TUI 行为边界

- 浏览 finding / campaign / activity  
- 展示 next action 文案  
- **不**在 UI 里执行 promote/report/archive  

键位以当前版本 `?` 帮助为准（Tab 视图、j/k 移动、`/` 搜索等）。

## 与博客长文的分工

| 站内 Architecture | [设计长文](/blog/oh-my-vul-1-0/) |
|-------------------|----------------------------------|
| 可导航的结构事实 | 动机、迭代史、个人方法论 |
| 跟 Usage 互补 | 跟叙事互补 |

实现以仓库代码与 `contracts/` 为准；本文描述 1.0.0 心智模型。

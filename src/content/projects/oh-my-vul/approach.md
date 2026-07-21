---
title: "Approach"
description: "Campaign 开题、Evidence.v1、Skills 与 CLI 门禁如何把漏洞研究收成可校验流程。"
navLabel: "Approach"
order: 20
draft: false
---

## 总览

oh-my-vul 拆成两层，职责故意不对称：

| 层 | 负责 | 不负责 |
|----|------|--------|
| **Skills / Agent** | 读代码、提假设、写叙述与 PoC 草稿 | 擅自把 candidate 变成「已确认可提交」 |
| **CLI + Contracts + `.omv/`** | 字段合法吗、状态能不能晋级、报告是否过期 | 替代你做 exploitability 判断 |

一句话：

**AI 扩大假设空间；程序把假设压回证据；你保留最终判断权。**

## 主路径（与仓库一致）

```text
omv start
   │  Campaign.v1 + 可选攻击面卡片
   ▼
surfaces propose / select / seed
   │  seed 只生成 candidate 模板，不造假证据
   ▼
/omv-find 或 /omv-audit
   │  填充 Evidence.v1；可选 ThreatMap / Verification
   ▼
/omv-repro          ← 人在本地跑；Skill 只记录 observed_result
   ▼
/omv-dedup · /omv-critic
   ▼
omv review [--strict]
   │  verdict: ready | needs-* | blocked
   ▼
/omv-report  → 草稿 + ReportProvenance
   ▼
omv findings archive --reason reported | …
```

Codex 侧 Skill 前缀是 `$omv-…`，Claude Code 是 `/omv-…`。管理向入口是 `$omv` / `/omv`（以及 bootstrap：`/using-omv`）。

## 设计决策

### 1. 先开题，再堆假说

1.0 把「上来就 find」收成 **Campaign**：

- 目标包 / 版本意识 / 研究目标（VulDB、CVE、internal…）
- 攻击面卡片（archive-extractor、template-engine、ssrf-filter…）propose → select
- `seed` 按选中卡片生成 **candidate-only** 的 Evidence 壳

卡片是假设桶，不是漏洞。  
没有选中的面，就不该假装已经审计完毕。

### 2. Finding 是对象，不是段落

磁盘上的主对象是 **Evidence.v1**（`.omv/findings/<id>.yaml`）。  
真实字段形态（节选）长这样——注意不是早期展示文案里的假 key：

```yaml
schema_version: "1"
status: candidate          # 仅 candidate | confirmed | blocked
package:
  ecosystem: npm
  registry_name: "example-pkg"
versions:
  tested: "1.2.3"
evidence:
  source: "src/a.ts:12"
  sink: "src/b.ts:88"
  guard: "missing authz on route"
  reproducer: "node poc.js"
  observed_result: unknown
```

规则写进契约：

- 未验证就写 **`unknown`**，不要靠记忆补全  
- `confirmed` 有字段级硬要求（含 `versions.tested`、source/sink/guard/reproducer/observed_result、CVSS vector 等）  
- `blocked` 表示路径明确断了，不是道德标签  

### 3. 两套分数，一个报告门槛

| 分数 | 含义 |
|------|------|
| `evidence_score` | 关键证据字段填得有多完整（0–100） |
| `submission_score` | 在 evidence 上扣罚：缺 observed、未解 blocker、dedup 不全、置信度低… |

**建议进入 `/omv-report` 的机器条件**（`isReportReady`）大致是：

- `status === "confirmed"`
- validation.ok  
- **`submission_score >= 75`**
- 若存在 ThreatMap / 在 strict 下要求 Verification，则 sidecar 也要过  

所以你会看到：evidence 看起来「挺满」，submission 仍可能很低——这是故意的。

### 4. Review verdict ≠ Evidence status

`omv review` 输出的是另一套动作建议，例如：

`ready` · `needs-repro` · `needs-audit` · `needs-verification` · `blocked`

不要把它画成 Evidence 的状态迁移。  
Evidence 永远只有三态；archive 甚至不是 status（文件挪到 `.omv/archive/findings/`）。

### 5. Repro Skill 不替你执行 PoC

`/omv-repro` 的纪律是：

- 指导你在本地/授权环境跑  
- 把**你观察到的结果**写入 `observed_result` 与 `.omv/repro/`  
- 不把「模型想象中的输出」写成已观察事实  

`reproducer` 字段通常在 audit 阶段成形；`observed_result` 必须来自真实运行。

### 6. TUI 只读

终端里直接跑 `omv` 打开 Ink 工作台：排队、过滤、看下一跳动作。  
**变更状态、归档、出报告**仍走 CLI / Skill——避免「浏览界面误触晋级」。

## Skills 地图（10）

| Skill | 作用 |
|-------|------|
| `using-omv` | 研究纪律 / HARD-GATE 引导 |
| `omv` | Campaign 与工作区项目管理（多委托 CLI） |
| `omv-find` | 排序值得审计的包 / candidate |
| `omv-audit` | 证明或否定 source→sink→guard |
| `omv-repro` | 本地复现记录 |
| `omv-dedup` | NVD/GHSA/生态库查重（确认后才写回） |
| `omv-critic` | 提交前对抗式拒稿风险 |
| `omv-report` | 多格式报告草稿 + provenance |
| `omv-disclose` | 披露邮件与时间线 |
| `omv-radar` | 本地 watchlist 情报 |

可选 Claude agents（vuln-scanner、dataflow-tracer、verifier…）是增强，不是第二套真相源；CLI 校验仍是硬门。

## 和「只写 Prompt」的差别

| 只靠对话 | oh-my-vul |
|----------|-----------|
| 结论在 transcript | 结论在 `.omv/` + 契约 |
| 晋级靠口气强硬 | 晋级靠 validate / review |
| 换模型从零讲故事 | 换模型接着读同一 finding |
| 报告重写常改写事实 | provenance 绑定输入哈希 |

下一页 [Usage](/projects/oh-my-vul/usage/) 按可跟做顺序写命令。

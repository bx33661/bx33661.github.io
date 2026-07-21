# Projects Docs Rewrite Design

**Date:** 2026-07-21  
**Status:** Draft for user review  
**Scope:** Rewrite showcase docs under `src/content/projects/{oh-my-vul,wireshark-mcp,pure-auto-codeql}/`  
**Route:** A+ — keep 6-page IA; truth-aligned rewrite; Usage near handbook depth; author voice

---

## 1. Goals and success criteria

Turn the three project doc libraries from thin pitch pages into **Chinese-primary technical docs that only someone who read the repos could write**, aimed at **potential users** who should be able to follow along on-site.

Success means:

1. **Accurate** — commands, status machines, tool names, artifact paths match the local repos; known falsehoods removed (`omv init`, invented `reports/` trees, stale “40+ tools”).
2. **Deep** — every page has at least one detail that requires reading source/contracts (dual scores, contextual registration model, `CodeQLComposeTool` default flags, etc.).
3. **In voice** — judgment sentences over feature laundry lists; first person where you own the project; no empty adjectives; no “see README for everything” as the body of a section.
4. **Followable** — Usage is near-handbook: copy-paste commands, primary path, doctor/troubleshooting; version-sensitive footnotes may link GitHub, but the page must stand alone for the happy path.

### Non-goals

- Renaming Problem / Approach / … nav labels or adding new routes (unless Usage later explodes and we open a follow-up).
- Pasting full upstream READMEs into the site.
- Redesigning CRT chrome, routes, or the projects index UI (frontmatter `description` may tighten for cards).
- Claiming unshipped or default-off features as day-one capabilities.

---

## 2. Constraints

| Constraint | Detail |
|------------|--------|
| IA frozen | Each project keeps `index.md` + `problem` / `approach` / `usage` / `architecture` / `highlights` |
| Frontmatter contract | Existing collection fields stay; rewrite `description` (aim 40–180 chars of real prose); keep `workId` / `order` / `slug` unless wrong |
| No invention | No claim without README/source/contract evidence; uncertainty → one-line “以仓库当前版本为准” + link, not guesses |
| Role honesty | PureAutoCodeQL = Fruit-Guardians; you = active contributor (CLI/API/packaging), not sole author/maintainer |
| Maturity honesty | oh-my-vul **1.0.0**; Wireshark-MCP **2.0.0**; PureAutoCodeQL **0.1.0 Alpha** |
| Language | Chinese body; keep CLI/API/type names in English |
| Files touched (implementation) | Primarily `src/content/projects/**/*.md`; smoke/content checks only if needed |
| Blog relationship | `/blog/oh-my-vul-1-0/` remains long-form narrative; project pages are navigable product+handbook and cross-link, not a paste of the blog |

### Source-of-truth repos (local)

| Project | Path | Remote |
|---------|------|--------|
| oh-my-vul | `/Users/zhangboxiang/Progarm/bx33661/ohmyvul` | `bx33661/oh-my-vul` |
| Wireshark-MCP | `/Users/zhangboxiang/Progarm/bx33661/Wireshark-MCP` | `bx33661/Wireshark-MCP` |
| PureAutoCodeQL | `/Users/zhangboxiang/Progarm/bx33661/PureAutoCodeql` | `Fruit-Guardians/PureAutoCodeql` |

Do **not** treat `ohmyvul/SPEC.md` as current (historical banner). Prefer README, `registry.yaml`, `contracts/`, `src/cli/`, skills.

For PureAuto, prefer `core/pipeline.py`, `docs/output_files_guide.md`, README over stale lines in `projects/README.md`.

For Wireshark, prefer **code** over docs-site architecture notes that claim contextual tools are not all registered at startup (code registers all, then recommends a subset).

---

## 3. Shared voice and page contracts

### Voice

- Mix **你** (how to use) and **我** (why it exists / tradeoffs). PureAuto: prefer **项目/我们** + occasional **我参与的部分**.
- Lead each section with a sentence that stands alone.
- Use **real names**: `omv start`, `wireshark_security_audit`, `cve_analysis`.
- Ban hollow fillers (“强大/灵活/完善”) and ban “具体以 README 为准” as the main content of a paragraph.
- Write **limits and defaults-off** features explicitly — credibility > completeness theater.
- Code blocks must be copy-pasteable; comments only for critical prerequisites.

### Target length (including frontmatter)

| Page | Lines | Role |
|------|------:|------|
| index | 80–120 | Positioning, audience, 3–5 capabilities with real names, nav table, links |
| problem | 70–110 | Pain only; scenarios and failure modes |
| approach | 100–160 | Design decisions + one accurate flow diagram |
| usage | **180–320** | Handbook: prereq → install → doctor → main path → cheat sheet → troubleshoot |
| architecture | 100–160 | Boundaries, where state lives, lifecycle/artifact tree |
| highlights | 40–70 | Bullets, stack table, links, one-liner |

Rough total: ~950 lines today → **~2000–2800** after rewrite (growth mostly Usage / Approach / Architecture).

### What each page owns

**index** — One-line definition, version/maturity, who it’s for / not for, capability bullets with real names, doc nav, repo link. No full install.

**problem** — Pain without the product. No architecture dump, no install.

**approach** — How the problem was decomposed: decision table + main-path diagram matching code.

**usage** — Fixed skeleton:

1. Prerequisites  
2. Install (real commands)  
3. Doctor / verify  
4. ~30 minute primary path  
5. Command/tool cheat sheet (tables)  
6. Common failures  
7. Next: Architecture + upstream repo  

**architecture** — Process/module boundaries, authoritative state location, lifecycle or artifact tree. Do not re-paste the full command cookbook.

**highlights** — 5–8 verifiable bullets, stack, links, polished one-liner. No narrative load-bearing.

### Cross-links

- Sibling pages within the project.
- oh-my-vul ↔ `/blog/oh-my-vul-1-0/`.
- External: GitHub repo (PureAuto also org). Do not present superseded SPEC as current truth.

---

## 4. Per-project truth sheets

### 4.1 oh-my-vul

**Must be correct**

| Topic | Truth |
|-------|--------|
| Install | `npm i -g oh-my-vul@latest` → `omv setup --platform codex\|claude-code` → restart agent → `cd <target> && omv start` (**not** `omv init`) |
| Identity | TypeScript CLI `omv` + 10 Skills + versioned contracts under private `.omv/`; local-first; no live third-party exploitation product |
| Evidence.status | Only `candidate \| confirmed \| blocked` |
| Review verdicts | `ready \| needs-repro \| needs-audit \| needs-verification \| blocked` — **separate machine** |
| Archive | Not a status; `omv findings archive --reason …` (e.g. `reported`) |
| Scores | `evidence_score` vs `submission_score`; report-ready needs confirmed + validation.ok + **submission ≥ 75** (+ sidecar rules in strict mode) |
| Opening move | Campaign → `surfaces propose/select` → `seed` (candidate templates only; no fake proof) |
| Primary path | start → find/audit → repro (**user runs**; skill records `observed_result`) → dedup/critic → `omv review --strict` → report → archive |
| Evidence fields | Real contract shape: `package.registry_name`, `versions.tested`, `evidence.source/sink/guard/reproducer/observed_result`, … — not simplified fake YAML keys from old showcase |
| TUI | Read-only Ink UI; mutations via CLI/Skills |
| Platforms | Codex + Claude Code; document setup default and paths at high level |
| Skills (10) | `using-omv`, `omv`, `omv-find`, `omv-audit`, `omv-repro`, `omv-dedup`, `omv-critic`, `omv-report`, `omv-disclose`, `omv-radar` |

**Must not claim**

- `omv init`, `workspace init`, permanent `findings delete`, shipping `omv-mcp`
- Evidence lifecycle drawn as `needs-audit → ready → reported`
- “Auto-find and confirm CVEs” / live attack platform

**Voice anchors**

- 让 Agent 负责理解代码，让程序负责约束状态，让研究员保留最后的判断权。
- 流畅 ≠ 证据完整。

**Current showcase bugs to kill**

- `usage.md`: `omv init`
- Fake Evidence schema in approach
- architecture conflating review verdicts with Evidence status
- Missing campaign/surfaces, dual scores, TUI read-only, report threshold 75

---

### 4.2 Wireshark-MCP

**Must be correct**

| Topic | Truth |
|-------|--------|
| What | Production FastMCP server wrapping Wireshark CLI suite; **tshark is decode authority** |
| Version | **2.0.0** (PyPI `wireshark-mcp`), Python ≥3.10 |
| Tool scale | ~**97** `wireshark_*` tools (core ~46 + contextual ~51). Prefer “90+” or “约 97”；explain README “40+” / docs-site “51” as stale |
| Entrypoints | `wireshark_open_file`, `wireshark_quick_analysis`, `wireshark_security_audit`, `wireshark_get_capabilities` |
| Registration | Contextual tools **all registered at startup**; `open_file` maps protocols → **recommendations** (not lazy register) |
| Install | `pip install wireshark-mcp` → `wireshark-mcp install` → restart client → `wireshark-mcp doctor` (+ `config`, `clients`, `update`) |
| Clients | Auto-config matrix ~**22** names in code; say 20+ |
| v2 layer | Investigation session, playbooks (YAML under package data), hypotheses/findings, report/IOC/rules, NL query, anomaly detectors |
| Safety | Optional `WIRESHARK_MCP_ALLOWED_DIRS`; binary allowlist; credential extraction sensitivity; `check_threats` may fetch URLhaus; capture needs privileges |
| Skill | Bundled `wireshark-traffic-analysis` + evidence confidence labels |
| Envelope | Structured `{success, data\|error}` responses; result cache; token-conscious docstrings |

**Must not claim**

- Custom protocol stack, cloud capture SaaS, GUI parity
- “AI detects malware” without tool+evidence framing
- Architecture copied from outdated docs-site “not all contextual tools registered”
- Categories-only tool discussion with zero real names

**Voice anchors**

- 给 AI 一双读包的手，而不是一张会编流量的嘴。
- 模型负责编排与解释；tshark 负责解码与事实。

**Current showcase bugs to kill**

- Vague “40+” without code count
- No concrete tool names or v2 investigation surface
- Install left as “概念”
- Thin safety and client-matrix coverage

---

### 4.3 PureAutoCodeQL

**Must be correct**

| Topic | Truth |
|-------|--------|
| Ownership | **Fruit-Guardians** org project; you = **active contributor** (git bpple/Bpple/bx3 · bx33661), multi-author |
| Maturity | **0.1.0**, PyPI/classifier **Alpha** — research assistance, not CVE factory |
| Case layout | `projects/<case_id>/{source_code,db,inputs,intel}` (+ optional `queries/`) |
| Pipeline order | `cve_analysis → sink_analysis → source_analysis → path_analysis → codeql_generation`, then **post-step** path-selection / consolidate |
| Two “path” layers | Pre-QL flow-step mining (`path_analysis`) vs post-SARIF **path-selection** (`path-selection/dataflow.json`, etc.) |
| Compose | `CodeQLComposeTool` sub-agents; many `enable_*` flags **default False** |
| Languages | **python / java / cpp** only; Java `--build-mode=none`; C/C++ needs build command / two-step / Docker fallback |
| Artifacts | `output/<case>/<timestamp>/{summary.md,sarif/…,codeql/…,path-selection/{report.md,selection.json,dataflow.json}}` |
| Entry | `uv sync`, `./build_mcp.sh`, `config/keys.toml`, `Analyze.py` **or** `pure-auto-codeql`, `doctor`, `serve` |
| API | FastAPI + SSE; default bind **127.0.0.1**; import/build lockdown defaults |
| LLM roles | `CHAT` vs `THINK` |

**Must not claim**

- End-to-end autonomous CVE production or guaranteed high-value hits
- First-class “human-in-the-loop pause” / durable pipeline checkpoint-resume without code evidence
- “I maintain the whole project” / sole author
- Languages beyond python/java/cpp
- Invented trees (`reports/`, `results/*.sarif` as primary)
- Default-off compose capabilities as always-on

**Voice anchors**

- 面向 CVE 复盘的多智能体 CodeQL 研究流水线：情报 → Sink/Source → 查询生成修复 → SARIF 路径精选，产物可落盘。

**Safe role sentence**

> Fruit-Guardians 组织项目；我是活跃贡献者，参与过 CLI/API 边界、包命名空间、导入与配置等工程化维护。

**Current showcase bugs to kill**

- Wrong/merged pipeline stage story
- Invented output layout
- Hollow usage (“以 README 为准”)
- Missing Alpha + case workspace + compose defaults

---

## 5. Usage primary paths (implementation must re-verify against README at write time)

1. **oh-my-vul:** setup → start → surfaces/seed (or find) → audit → repro if needed → review --strict → report → archive  
2. **Wireshark-MCP:** pip + install + doctor → in-client `open_file` → `quick_analysis` / `security_audit` → follow-up extract/stream tools → optional investigate/playbook  
3. **PureAutoCodeQL:** uv sync + keys + MCP build + doctor → import or existing case → `analyze --case …` → read `output/…/summary.md` + `path-selection/`

---

## 6. Implementation approach (post-approval)

Not executed in this spec phase:

1. Freeze this spec after user review.  
2. Write an implementation plan (writing-plans skill): per-file checklist + verification (`content:check`, build/smoke if needed).  
3. Rewrite one project fully (recommended order: **oh-my-vul → Wireshark-MCP → PureAutoCodeQL**) so voice/template settle before the other two.  
4. At write time, re-open local repo files for any command that might have drifted; do not rely only on this spec’s memory.  
5. Run `npm run content:check` and spot-check rendered `/projects/...` pages.  
6. Commit docs separately from unrelated site work.

### Quality bar per file before marking done

- [ ] No banned commands/features from truth sheets  
- [ ] At least one “source-grounded” detail beyond old showcase  
- [ ] Usage blocks run conceptually end-to-end for happy path  
- [ ] description frontmatter useful for cards/SEO  
- [ ] Limits/maturity stated where relevant  
- [ ] Cross-links valid  

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Dual maintenance vs upstream README | Site = stable mental model + verified happy path; deep flags stay in repo; versions named on Overview |
| Tool count messaging (Wireshark) | State code-derived ~97; note marketing lag once |
| Over-claiming PureAuto | Alpha badge + contributor wording + non-goals section on index/highlights |
| Spec/memory drift | Re-read repo at implementation; prefer code over secondary docs |
| Length fatigue | Keep highlights short; push detail into Usage/Architecture only |

---

## 8. Approval record

- User pain: too shallow, inaccurate/stale, wrong voice (structure OK).  
- Audience: potential users.  
- Usage depth: near full handbook on-site.  
- Route chosen: **A+**.  
- Design sections 1–3 approved in conversation (2026-07-21).  

**Next after user accepts this written spec:** invoke writing-plans and implement file-by-file.

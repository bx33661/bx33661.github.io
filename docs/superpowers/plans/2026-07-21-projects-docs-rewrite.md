# Projects Docs Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all 18 project showcase markdown files so they are accurate to the local repos, deep enough for potential users, and written in the author's voice (A+ route).

**Architecture:** Keep the existing 6-page IA per project (`index`, `problem`, `approach`, `usage`, `architecture`, `highlights`). Replace body content file-by-file using truth sheets in `docs/superpowers/specs/2026-07-21-projects-docs-rewrite-design.md`. Re-verify commands against local repos at write time. No route/UI changes.

**Tech Stack:** Astro content collections (`src/content/projects/**/*.md`), frontmatter per `src/content.config.ts`, verify with `npm run content:check`.

**Spec:** `docs/superpowers/specs/2026-07-21-projects-docs-rewrite-design.md`

**Source repos:**
- oh-my-vul → `/Users/zhangboxiang/Progarm/bx33661/ohmyvul`
- Wireshark-MCP → `/Users/zhangboxiang/Progarm/bx33661/Wireshark-MCP`
- PureAutoCodeQL → `/Users/zhangboxiang/Progarm/bx33661/PureAutoCodeql`

---

## File map

| Path | Action |
|------|--------|
| `src/content/projects/oh-my-vul/{index,problem,approach,usage,architecture,highlights}.md` | Full rewrite |
| `src/content/projects/wireshark-mcp/{index,problem,approach,usage,architecture,highlights}.md` | Full rewrite |
| `src/content/projects/pure-auto-codeql/{index,problem,approach,usage,architecture,highlights}.md` | Full rewrite |

Frontmatter: keep `workId`, `order`, `repo`, `relatedPosts`, `status`, `featured`, `navLabel`, `category`, dates unless wrong. Rewrite `description` and `title` only when needed.

---

### Task 1: Rewrite oh-my-vul (6 pages)

**Files:**
- Modify: `src/content/projects/oh-my-vul/index.md`
- Modify: `src/content/projects/oh-my-vul/problem.md`
- Modify: `src/content/projects/oh-my-vul/approach.md`
- Modify: `src/content/projects/oh-my-vul/usage.md`
- Modify: `src/content/projects/oh-my-vul/architecture.md`
- Modify: `src/content/projects/oh-my-vul/highlights.md`
- Read while writing: `/Users/zhangboxiang/Progarm/bx33661/ohmyvul/README.zh-CN.md`, `contracts/evidence.v1.yaml`, `src/cli/review.ts` / findings status enums as needed

- [ ] **Step 1: Re-read Chinese README install + workflow sections**

Run: `rg -n "omv start|omv setup|npm install|omv review|archive" /Users/zhangboxiang/Progarm/bx33661/ohmyvul/README.zh-CN.md | head -40`

Confirm: setup uses `omv setup --platform codex|claude-code`, workspace uses `omv start`, no `omv init`.

- [ ] **Step 2: Write `index.md`**

Requirements from spec §3–4.1:
- Keep frontmatter keys; tighten description
- Version 1.0.0; positioning quote; 流畅≠证据完整
- Audience / non-audience
- Capabilities with real names (Evidence.v1, Campaign, 10 skills, dual scores, TUI read-only)
- Nav table + blog link + GitHub
- ~80–120 lines

- [ ] **Step 3: Write `problem.md`**

Pain only: NL handoff, hard fields lost, model fills unknown, no replay memory, hypothesis volume vs proof cost. No install. ~70–110 lines.

- [ ] **Step 4: Write `approach.md`**

Agent vs CLI split; Campaign→surfaces→seed; Evidence object; diagram matching real flow; real field names (not fake schema); mention dual scores briefly. ~100–160 lines.

- [ ] **Step 5: Write `usage.md` (handbook)**

Skeleton: prereq (Node 22+, Python 3, Codex/Claude) → `npm i -g` → `omv setup` → `omv start` → surfaces/seed or find → audit → repro → review --strict → report → archive. Cheat sheet table of core commands. Doctor/drift. Failures. **Never `omv init`.** ~180–320 lines.

- [ ] **Step 6: Write `architecture.md`**

`.omv/` layout table; three machines (Evidence status / review verdict / archive reason); contracts list; TUI read-only; components diagram. ~100–160 lines.

- [ ] **Step 7: Write `highlights.md`**

5–8 bullets, stack, links, one-liner. ~40–70 lines.

- [ ] **Step 8: Verify oh-my-vul content**

Run: `npm run content:check 2>&1 | rg "oh-my-vul|Errors|Warnings" | head -40`  
Expected: no errors for oh-my-vul paths; no draft false-positives.

- [ ] **Step 9: Commit oh-my-vul**

```bash
git add src/content/projects/oh-my-vul/
git commit -m "$(cat <<'EOF'
docs(projects): rewrite oh-my-vul from repo truth

Fix false commands (omv start not init), separate evidence/review/archive
machines, dual scores, campaign opening path, and handbook-depth usage.
EOF
)"
```

---

### Task 2: Rewrite Wireshark-MCP (6 pages)

**Files:**
- Modify: `src/content/projects/wireshark-mcp/*.md`
- Read: `/Users/zhangboxiang/Progarm/bx33661/Wireshark-MCP/README_zh.md` or `README.md`, `pyproject.toml` version, `src/wireshark_mcp/server.py` CLI, tool counts if needed

- [ ] **Step 1: Confirm version + install commands**

Run:
```bash
rg -n "^version|wireshark-mcp install|doctor" /Users/zhangboxiang/Progarm/bx33661/Wireshark-MCP/pyproject.toml /Users/zhangboxiang/Progarm/bx33661/Wireshark-MCP/README.md | head -30
```

- [ ] **Step 2–7: Write all six pages**

Truth sheet §4.2: v2.0.0, ~97 tools, real entry tools, install/doctor, open_file recommendation model, v2 investigation, safety (sandbox, URLhaus, credentials), skill. Voice: 读包的手 / 编流量的嘴.

- [ ] **Step 8: content:check filter wireshark**

- [ ] **Step 9: Commit**

```bash
git add src/content/projects/wireshark-mcp/
git commit -m "$(cat <<'EOF'
docs(projects): rewrite Wireshark-MCP from repo truth

Align tool scale and real entrypoints with v2.0.0, handbook install/doctor
path, investigation layer, and safety boundaries.
EOF
)"
```

---

### Task 3: Rewrite PureAutoCodeQL (6 pages)

**Files:**
- Modify: `src/content/projects/pure-auto-codeql/*.md`
- Read: `/Users/zhangboxiang/Progarm/bx33661/PureAutoCodeql/README.md`, `core/pipeline.py` step order, `docs/output_files_guide.md`

- [ ] **Step 1: Confirm pipeline order + output tree + CLI**

Run:
```bash
rg -n "create_default_pipeline|cve_analysis|sink_analysis|path_analysis|codeql_generation" /Users/zhangboxiang/Progarm/bx33661/PureAutoCodeql/core/pipeline.py | head -30
rg -n "output/|path-selection|summary.md" /Users/zhangboxiang/Progarm/bx33661/PureAutoCodeql/docs/output_files_guide.md | head -30
rg -n "uv sync|Analyze.py|pure-auto-codeql|doctor" /Users/zhangboxiang/Progarm/bx33661/PureAutoCodeql/README.md | head -30
```

- [ ] **Step 2–7: Write all six pages**

Truth sheet §4.3: Alpha 0.1.0, Fruit-Guardians + contributor wording, case layout, five steps + post path-selection, two path layers, compose defaults off, python/java/cpp only, real output tree, uv/CLI/API localhost. No sole-maintainer claims.

- [ ] **Step 8: content:check filter pure-auto**

- [ ] **Step 9: Commit**

```bash
git add src/content/projects/pure-auto-codeql/
git commit -m "$(cat <<'EOF'
docs(projects): rewrite PureAutoCodeQL from repo truth

Fix pipeline order and artifact paths, mark Alpha/org ownership honestly,
and replace hollow usage with real uv/CLI/API flows.
EOF
)"
```

---

### Task 4: Final verification

- [ ] **Step 1: Full content check**

Run: `npm run content:check`  
Expected: Errors 0. Description-length warnings OK if any remain on unrelated notes.

- [ ] **Step 2: Smoke source**

Run: `npm run smoke:source`  
Expected: OK.

- [ ] **Step 3: Optional build spot-check**

Run: `npm run build 2>&1 | tail -20` then confirm:
- `dist/projects/oh-my-vul/index.html` contains `omv start` and does **not** contain `omv init`
- `dist/projects/wireshark-mcp/index.html` contains `2.0.0` or `wireshark_open_file`
- `dist/projects/pure-auto-codeql/index.html` contains `Alpha` or `cve_analysis` and `Fruit-Guardians`

- [ ] **Step 4: Status clean / push only if user asks**

Do not push unless user requests.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| A+ IA kept | All tasks overwrite same 6 files |
| oh-my-vul truth sheet | Task 1 |
| Wireshark truth sheet | Task 2 |
| PureAuto truth sheet | Task 3 |
| Handbook Usage | Steps 5 in tasks 1–3 |
| content:check | Tasks 1–4 |
| Author voice / no invention | Embedded in each write step |
| Order oh-my-vul → Wireshark → PureAuto | Task order |

## Notes for implementers

- Prefer `Write` full file replacement over tiny patches for these rewrites.
- Chinese body; keep command names exact.
- If README and code disagree, **code wins** (especially Wireshark registration model, PureAuto output paths).
- Do not edit `SPEC.md`-only fantasy skills into oh-my-vul docs.

---
title: "Introducing Pinwhy: A Security Audit Walkthrough"
description: "A multi-agent static security audit walkthrough of Pinwhy, a local-first memory and visual workbench for AI agents, from Ultra coverage views to core design."
date: 2026-11-24
tags:
  - "Pinwhy"
  - "AI"
  - "Agent"
  - "Security Audit"
authors:
  - "bx"
draft: false
slug: "introducing-pinwhy-en"
lang: "en"
translationKey: "introducing-pinwhy"
---

> **GitHub Repository**: [github.com/Fruit-Guardians/pinwhy](https://github.com/Fruit-Guardians/pinwhy)
>
> **DeepSeek Harness Native Plugin**: [plugins/dsh-pinwhy](https://github.com/Fruit-Guardians/pinwhy/blob/main/plugins/dsh-pinwhy/README.md)
>
> **Website & Live Demo**: [pinwhy.bx33661.com](https://pinwhy.bx33661.com)

**[Pinwhy](https://github.com/Fruit-Guardians/pinwhy)** is a host-agnostic **external memory and real-time visual workbench for AI agents**. Its goal is straightforward: keep an AI agent's reasoning trail, supporting evidence, and task progress stored locally in the project—so switching sessions never drops context, humans can follow along anytime, and collaborators can step in directly.

Rather than starting with abstract concepts, let's look straight at real screenshots from a live run. We picked a fairly large codebase as a sample target for a read-only static security audit drill: 1 coordinator (`coordinator`), 8 concurrent worker agents (`worker-*`), and 1 independent reviewer (`skeptic`) walked through 98 source slices and 20 inspection probes across the repository, accumulating **141 reasoning nodes, 238 explicit edges, 5 checkpoints, and 10 agent cursors** on the local board.

Below, we walk through the actual workbench views first, and then unpack the motivation and engineering principles behind the design.

## I. Ultra Views: Tracking Code Coverage and Dependency Boundaries

When you assign an agent to audit a repository with thousands or tens of thousands of lines of code, two concerns immediately arise: whether it just skimmed a few obvious files, and whether bulky config files will flood its context window. The optional `pinwhy-ultra` layer manages physical source slices and probe coverage.

### 1. Constellation Ring: Module Coverage and Cross-Slice Dependencies

![Ultra Constellation Ring view](/blog/introducing-pinwhy/01-ultra-constellation.png)

In **Ultra Mode -> Constellation** of the workbench, the entire repository is arranged into a ring of directory sectors (`src/converters`, `src/pages`, `src/services`, `root`, and 14 sectors in total):

- **Gray sectors**: non-runtime assets archived with explicit reasons via `pinwhy-ultra exclude` (this run excluded 33 pure SVG icons, CSS stylesheets, and CI metadata)—documented exclusion rather than silent skipping.
- **Green slices**: inspected and confirmed clean, recorded in the coverage ledger without cluttering the main reasoning board.
- **Red slices and outer dots**: slices where concrete leads were found or main-board nodes are attached.
- **Inner chord lines**: explicit cross-module dependencies declared between slices and probes (`--depends-on`). Whenever an upstream slice remains `pending` or is reopened, dependent downstream items automatically fall back to `shallow(unverified-dependency)`, reminding the team to verify prerequisites.

In this drill, all 118 managed items (98 physical slices and 20 probes) converged to **100.0% (118/118)**.

### 2. Volume Treemap: Coverage Distribution by Line Count

![Ultra Volume Treemap view](/blog/introducing-pinwhy/02-ultra-treemap.png)

Switching to the **Treemap**, each module and slice has an area proportional to its actual line count (for instance, `src/converters` has 3,682 lines, `src/pages` has 1,850 lines, and `root` has 600 lines). You can see at a glance which modules hold the most code and whether any large file was only skimmed. In the right-hand drawer, you can spot-check cleared nodes anytime—preventing writers from brushing off a file with `"ok"` (overly short or unsubstantiated notes are automatically rejected by Ultra as shallow reads).

### 3. Gate Reconciliation: Separating Coverage Commitments from Open Boundaries

![Ultra Gate Reconciliation view](/blog/introducing-pinwhy/03-ultra-gates.png)

In the **Gate Reconciliation** panel, checks are explicitly split into two groups:

- **Top `C1–C3` (reading and evidence commitments that must clear)**:
  - `C1`: all managed source slices are scanned and match the on-disk file hashes;
  - `C2`: zero shallow-read rejections, unverified dependencies, code drift, or unanswered human follow-ups;
  - `C3`: zero unbacked verdicts marked `confirmed` or `refuted` without supporting evidence edges (`unbackedVerdicts = 0`).
- **Bottom S1–S2 (epistemic boundaries and open signals, preserved honestly)**:
  - Even when `C1–C3` are all `CLEAR`, `S2` still candidly lists open questions `q1–q5` as well as items `blocked` pending missing binaries in the current environment.

Pinwhy lets `commitmentComplete = true` coexist with `allClear = false`—serious technical investigations should never hide real limitations just to force an all-green badge.

---

## II. General Workbench: Multi-Agent Perspectives and Local Reasoning Graphs

Returning to the **General Workbench** on the main board shows how the entire investigation grows along a "goal -> question -> hypothesis -> evidence -> finding" graph.

### 1. Multi-Agent Perspectives and Independent Cursors

![General Workbench and Multi-Agent Perspective Switcher](/blog/introducing-pinwhy/04-general-agents.png)

During the concurrent audit, the 8 worker agents and 1 reviewer each wrote to the shared board under `--agent <name>`. Every node and edge carries clear attribution. Through the **Agent View** menu in the top-right corner, you can switch views to inspect where each participant is focused (`coordinator`, `worker-ui`, `worker-files`, `worker-conv-a`, `skeptic`, etc.):

- Switching perspectives is **strictly read-only** and never alters any agent's own cursor;
- In the screenshot, the green highlight marks the node `worker-ui` is currently focused on (missing security response headers `fd3`), linked on the left to supporting evidence `f2`, and on the right to the question `q4` it answers and the reverse-proxy boundary `n2` pending verification.

### 2. Logic View and Node Inspector

![Logic View 1-Hop Neighborhood and Inspector](/blog/introducing-pinwhy/05-general-logic-inspector.png)

Once the board grows to 141 nodes, laying every card out flat on a single screen quickly becomes hard to read. In **Logic View**, selecting any node (such as `fd6` for the cleanup timer) and clicking **Focus 1-hop Neighborhood** dims unrelated nodes and pulls the directly connected evidence chain into the center, while the right-hand **Inspector** displays the source location, mechanism, remediation advice, and status dimensions:

- **Severity**: Low
- **Status**: Confirmed
- **Confidence**: Statically verified (explicitly noting that dynamic execution verification was not performed)

---

## III. Security Audit View: Two-Wing Dialectical Dossiers and Adversarial Review

Switching to **Audit** mode in the top bar reads from the exact same local event store (without duplicating data or emitting events), reorganizing the interface into a dossier layout built for item-by-item review and cross-examination.

### 1. Issue Directory and Posture Matrix

![Security Audit Mode Posture Matrix](/blog/introducing-pinwhy/06-audit-matrix.png)

The left sidebar expands `goal` and `question` nodes into a collapsible **Issues ▸ Candidate Directory**; across the top, a single fact-summary bar ("Reproduced 0 · Statically Verified 49 · Pending 0 · Contested 6 · Corroborated 10 · Self-Verified 18 · Refuted / Superseded 15") doubles as clickable filters. In the screenshot, **Refuted / Superseded 15** is selected, immediately listing every disproven false positive and merged legacy record—**recording which paths were ruled out is just as valuable as recording confirmed bugs**.

### 2. Two-Wing Dossier: Independent Corroboration and Preconditions

![Two-Wing Dialectical Dossier: Corroboration and Preconditions](/blog/introducing-pinwhy/07-audit-dossier-corroborated.png)

Opening `fd7` (the container defaulting to `PUID=0`), the two-wing dossier splits the argument into two side-by-side columns:

- **Left Wing (Support & Derivation)**: lists both the original author `worker-infra`'s source evidence `f15` and the independent reviewer `skeptic`'s re-verification `f60` (flagged with a green **skeptic · Corroborated** badge), showing that the conclusion holds across independent sessions;
- **Right Wing (Counter-Evidence & Dependencies)**: breaks out the implicit precondition `n6` (`PUID` unset or `0`) via `depends-on`, separating "what the code does" from "what deployment state triggers it."

### 3. Two-Wing Dossier: Partial Refutation and Record Supersession

![Two-Wing Dialectical Dossier: Adversarial Correction and Partial Counter-Evidence](/blog/introducing-pinwhy/08-audit-dossier-contested.png)

Adversarial review does not always overturn an entire conclusion; often it **precisely narrows an overly broad or inaccurate sub-claim**. Look at the dossier for `fd6`:

- The initial note suggested that `AUTO_DELETE_EVERY_N_HOURS="Infinity"` would trap the timer in an infinite chunked spin loop;
- Independent reviewer `skeptic` traced `src/index.tsx:103` and found that startup synchronously calls `clearJobs()`, throwing a synchronous `RangeError` inside `new Date(Date.now() - Infinity).toISOString()` before execution ever reaches `scheduleDelayed`.
- Instead of crudely flipping `fd6` to "false positive," `skeptic` appended a targeted counter-evidence node `f52` to the right wing (automatically marking the card **Contested**) and consolidated an earlier record `fd13` that had bundled four issues together using `supersedes`. Both the investigative history and the exact boundary conditions remain intact.

### 4. Two-Wing Dossier: Preserving Refuted Hypotheses

![Two-Wing Dialectical Dossier: Refuted Hypothesis](/blog/introducing-pinwhy/09-audit-dossier-refuted.png)

For hypothesis `hy12` under `q3`—asking whether multiple CLI converters suffered from `-`-prefixed filename argument injection—`worker-conv-b` checked 11 media/image converters and their upstream call chains. Using evidence `f41`, it showed that callers always prepend `./data/uploads/...` and `sanitize-filename` strips `:` and `/`, making it impossible to pass a leading `-` or `coder:` from HTTP entry points, and therefore marked `hy12` **Refuted**. When a fresh session picks up later, it will not waste time re-investigating a closed lead.

---

## IV. Checkpoint Digests and 2.5D View

### 1. Checkpoints and Changes Since Handoff

![Live Digest and Checkpoint Delta](/blog/introducing-pinwhy/10-digest-checkpoints.png)

Before pausing a long task or compacting context, an agent records a `checkpoint` (such as `cp1`–`cp5`). Clicking **Digest** in the top bar lets you pick any historical checkpoint to inspect **Changes Since Handoff** (backed by `pinwhy context --since <checkpoint> --budget 4000` in the CLI): instead of re-reading all 141 nodes, you retrieve the key threads and incremental diff within a token budget. Out-of-budget non-neighbor items are explicitly counted as omitted, and any detail can be expanded on demand by ID with `pinwhy show`.

### 2. 2.5D Sandbox View

![2.5D Hardware Circuit Sandbox View](/blog/introducing-pinwhy/11-scene3d-sandbox.png)

Clicking **2.5D** in the general view toolbar projects the current focus neighborhood onto an interactive dark circuit board: chip height corresponds strictly to recorded severity, the glowing chip marks the active focus, and copper traces reflect only explicitly written logical edges—the UI never hallucinates causal links that were not recorded in the graph.

---

## V. Host-Native Integration: DeepSeek Harness Plugin

Beyond opening the standalone local web workbench in a browser, Pinwhy can also be embedded directly inside an agent host UI via thin adapter plugins. Take the officially maintained DeepSeek Harness native plugin [`dsh-pinwhy`](https://github.com/Fruit-Guardians/pinwhy/blob/main/plugins/dsh-pinwhy/README.md): it invokes a separately installed `pinwhy` CLI over a subprocess (without duplicating the core engine or Skill), exposes 11 structured tools to the host (attributed by `dsh:<session.id>`), and launches an ephemeral read-only server (`serve --read-only --ephemeral`) to render the 2D / 2.5D and Audit views right inside the host pane, complete with one-click quoting of selected nodes into the active chat draft (screenshots below show a DSH demo sample):

![DeepSeek Harness Sidebar Pinwhy Board Entry (Light Theme)](/blog/introducing-pinwhy/12-dsh-board-light.webp)

*Opening "Pinwhy Board" from the left global navigation lets you switch across sessions to inspect each project's reasoning graph (matching the host's light theme and read-only indicator).*

![DeepSeek Harness In-Session Pinwhy Board Tab (Dark Theme)](/blog/introducing-pinwhy/13-dsh-session-dark.webp)

*Inside a conversation, the board sits right alongside the `Chat` and `Trajectory` tabs above the composer so you can inspect the graph and keep chatting without switching windows.*

---

## VI. Why Agents Need an Independent Blackboard

Looking back at these views, they directly address three breakpoints that come up constantly when using agents for complex research, debugging, or auditing:

1. **Opaque execution**: tool calls scroll past in the terminal line by line, making it hard to tell mid-run which thread an agent is pursuing, what it already ruled out, or where a hypothesis is stuck—by the time you read a long final summary, it may already be off track.
2. **Linear chat breaks under compaction**: conventional conversation memory or vector search is fine for looking up snippets after the fact, but cannot express **logical tension** across reasoning steps—what is still a guess, what has code evidence, what only holds under certain preconditions, and what has been disproven.
3. **Cross-session and multi-agent handoffs lack hard boundaries**: relying solely on natural-language summaries makes it hard for the next collaborator or fresh session to tell whether something was actually reproduced at runtime, statically verified in source, unverified due to missing tooling, or never read at all.

Pinwhy separates "process judgment" and "physical coverage" out of ephemeral chat transcripts and stores them locally in the project as a structured graph and coverage ledger: agents record as they explore, humans watch, steer, or inject leads anytime, and any new window or host (Claude Code, Codex, Cursor, Gemini CLI, DeepSeek Harness, etc.) can resume from the exact same budgeted state.

---

## VII. Core Philosophy and Architecture

When designing Pinwhy, we followed one simple engineering rule of thumb: **whenever we had to choose between "looking smarter" and "interfering less," we chose interfering less every time.** Figure 1 illustrates the overall architecture and data flow:

![Figure 1 · Pinwhy Layered Architecture and Single-Source-of-Truth Event Flow](/blog/introducing-pinwhy/fig-01-architecture.png)

In practice, the implementation rests on four design principles:

### 1. One Append-Only Local Log as the Single Source of Truth

- **Event sourcing**: the project-local `.pinwhy/events.jsonl` is the sole authoritative data store (append-only). `state.json` is strictly a query-acceleration snapshot cache—even if deleted or corrupted, it can be rebuilt deterministically by replaying the event log.
- **Concurrency and integrity**: when multiple agents write concurrently, writes serialize cleanly through an atomic directory lock and `--request-id` idempotency deduplication; corrupted lines during replay are never silently dropped and are counted explicitly by `lint`.
- **Strict ledger separation**: the optional coverage layer `pinwhy-ultra` keeps physical slices, file hashes, and probes in a separate `.pinwhy/ultra/ledger.jsonl`, validating main-board node IDs only via `--refs` and never polluting the reasoning log with raw source dumps or noisy tool logs.

### 2. Three Isolated Layers and Three Orthogonal Dimensions

To ensure every edge and status displayed in the workbench holds up under review, Pinwhy enforces two levels of orthogonality in its data model (Figure 2):

![Figure 2 · Three-Layer State Isolation and Three-Dimensional Verdict Orthogonality](/blog/introducing-pinwhy/fig-02-model-orthogonality.png)

- **Three isolated state layers**: the **Logic layer** (nodes and explicit directed edges), **Cursor layer** (each agent's active focus and trail), and **Activity layer** (raw tool calls, disabled by default) stay strictly separated. Reading a file or moving a cursor never manufactures a causal edge on the graph.
- **Three orthogonal evaluation dimensions**: `severity`, `status`, and `confidence` are completely independent—omitted fields stay `null` instead of defaulting to `open` or `confirmed`, and node types act purely as semantic labels rather than a mandatory state machine.

### 3. Coordinated Without Being Prescriptive

- **Never decide for the agent**: `pinwhy lint` always exits with code `0`, reporting diagnostics without blocking execution; `pinwhy context` output explicitly declares `readOnly: true`, `prescriptive: false`, and `nextStepSelection: "agent-controlled"`.
- **Never hallucinate links**: creating a node neither adds edges nor moves cursors by default; unless the writer passes `--rel`, `--to`, or `--enter`, the system never guesses relationships from prose or ranks/scores candidates.
- **Equal human-agent writes**: notes or follow-up questions added by a collaborator in the web workbench enter the exact same event log under `author: human` through the same write lock, surfacing naturally when an agent resumes context without turning the board into a blocking approval gate.

### 4. Minimal Core, Stable Contract, Thin Adapters

- **Zero runtime dependencies**: the core CLI, local HTTP server, and frontend exports share a single pure-JS model with **zero third-party runtime dependencies**, running fully offline out of the box.
- **Host-agnostic**: whether it is a Claude Code Hook, a Codex / Cursor Skill, or the native DeepSeek Harness plugin, every integration is just a thin adapter speaking the public CLI and `--json` contract—never duplicating the engine or maintaining a second source of truth. Even if you uninstall a host plugin completely, the full board stays intact locally and can be picked up by any other tool.

---

## VIII. Non-Goals and Field Notes from This Run

Guided by these trade-offs, Pinwhy deliberately stays away from directions that look "clever" on paper but overreach in practice. Along the way, we also noted a few hands-on observations from this audit drill:

1. **Three explicit non-goals**:
   - Never become a generic memory dump for raw chat transcripts or opaque vector chunks;
   - Never introduce blocking approval flows, mandatory state machines, or automated step orchestration;
   - Never let the model auto-complete graph edges, rank priorities, or score findings.
2. **Three field observations from this real drill**:
   - `pinwhy search --type` currently matches a single type name (passing comma-separated types returns 0 matches); when pulling multiple types in bulk, `pinwhy ls --all --json` is more reliable;
   - When two Ultra items form a `--depends-on` cycle (`s31` and `p13` in this run), closing both still converges cleanly to `breadthComplete = true`, though an explicit CLI warning on dependency cycles would make it clearer;
   - Under heavy concurrent writes from 8 worker agents and 1 reviewer to the same `.pinwhy/events.jsonl` and `.pinwhy/ultra/ledger.jsonl`, file locking and batched transactions held up cleanly with `0` corrupted lines and `0` lost writes.

> **Responsible Disclosure**: All screenshots and examples in this post depict a read-only static analysis workflow against the open-source repository `C4illin/ConvertX`. In real-world audits, any unpatched security issue should be reported first through the target repository's `SECURITY.md` private channels rather than publishing exploit details or payloads.

---

## IX. Installation and Setup

Requires **Node.js >= 18** (supports macOS / Linux / Windows):

```bash
# 1. 全局安装（内置 CLI、Web 工作台与完整 Agent Skill）
npm install -g pinwhy

# 2. 初始化并打开工作台（Claude Code 可用一条 setup；其余宿主用 init + skill install）
pinwhy init --title "我的项目调研"
pinwhy skill install
pinwhy serve --open
```

In any tool that supports Agent Skills, you can also just send this prompt to your agent:

> Please read the setup instructions at `https://github.com/Fruit-Guardians/pinwhy`, install or reuse Pinwhy for the current project, configure the full Skill for the current host, and open the workbench. Keep any existing records and share the URL when ready.

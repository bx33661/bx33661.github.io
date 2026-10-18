---
title: "oh-my-vul 1.0: An Evidence-First Vulnerability Research Workbench"
description: "oh-my-vul's evolution into an evidence-first research workbench: design choices for Evidence, CLI, TUI, and Codex and Claude Code support."
date: 2026-07-11T00:00:00.000Z
tags:
  - "oh-my-vul"
  - "AI"
  - "Vulnerability Research"
  - "Codex"
  - "Claude Code"
authors:
  - "bx"
draft: false
slug: "oh-my-vul-1-0-en"
lang: "en"
translationKey: "oh-my-vul-1-0"
---

Recently I officially released [oh-my-vul](https://github.com/bx33661/oh-my-vul) as version 1.0, which is also the project's first relatively stable release.

I have been using Coding Agents such as Claude Code and Codex for code auditing and vulnerability research. Models are now very capable of finding dangerous functions, reading call chains, and writing PoCs. But in practice, the biggest problem is often not “failing to find the sink”; it is that the research process is easy to fragment: the tested version is in one conversation, the data flow is in another context, reproduction results are in terminal history, and when generating the final report, the model fills unconfirmed gaps with a very fluent conclusion.

Fluency is not the same as complete evidence. The presence of `eval`, `innerHTML`, file reads, command execution, or a URL without an allowlist in the code only means the area merits further investigation. To call it a vulnerability, we still need to answer several questions: Is the input controlled by an attacker? Can the data reach the dangerous operation? What transformations occur along the way? Is the guard effective? Which versions are affected? What was actually observed after running it locally?

oh-my-vul was mainly created to solve this problem. Its purpose is simple: **let the Agent understand the code, let the program constrain the state, and let the researcher retain the final say.**

## What the project looked like at first

At first, the project had only two Skills: one looked for open-source projects worth auditing, and the other organized confirmed issues into VulDB, CVE, GHSA, OSV, or Markdown reports.

```text
vuln-finder -> vuldb-report
```

This division of labor is more reasonable than “generate a CVE immediately after scanning,” because the discovery phase should search broadly, while the reporting phase should narrow the conclusions. But the two Skills still depended on a natural-language handoff. Finder could provide a seemingly complete analysis, while Reporter had difficulty distinguishing which fields came from source code and which were speculation.

For example, a finding involves at least the following:

| Evidence        | Question to answer |
| --------------- | ------------------ |
| Tested version  | Which version was actually checked? |
| Source          | Which input can an attacker control? |
| Sink            | Which dangerous operation does the data ultimately reach? |
| Guard           | Is there validation, encoding, authentication, or a sandbox in between? |
| Reproducer      | How can it be triggered again locally? |
| Observed result | What was seen in an actual run? |
| Dedup           | Does a CVE, GHSA, or ecosystem advisory already exist? |

If any one item is omitted during a conversational handoff, the later report may be based on an over-edited summary. The more like a formal report the model sounds, the harder it can be to notice what is missing.

## Evidence.v1

Later, I added Evidence.v1, turning a finding from a piece of natural language into a research object with explicit fields and a lifecycle.

A simplified Evidence looks roughly like this:

```yaml
schema: Evidence.v1
id: demo-package-path-traversal
status: candidate

package:
  ecosystem: npm
  name: demo-package
  tested_version: 1.2.3

evidence:
  source: request.params.filename
  sink: fs.readFile(...)
  guard: unknown
  reproducer: unknown
  observed_result: unknown

verdict:
  exploitability: plausible
  confidence: medium

blockers:
  - guard bypass has not been demonstrated
  - local reproduction is incomplete
```

I place particular importance on `unknown`. In an ordinary report, it looks “unfinished”; in a research workflow, it is very important because unknown can prevent the model from propagating speculation further.

For example, if a reproducer has been written but the researcher has not actually run it, `observed_result` should remain unknown. Or if the source can indeed reach the sink, but default path normalization has cut off the attack, the finding should enter `blocked` rather than being promoted to confirmed merely because “a dangerous function has been found.”

`blocked` does not mean the research failed, either. It accurately records where the path stopped. The next time the project is opened, there is no need to retrace the same route around that sink.

## Division of labor between Skills and CLI

oh-my-vul can now be viewed as two parts.

One part consists of Skills and optional Agents, which handle source understanding, data-flow tracing, guard analysis, reproduction design, deduplication, and report writing. These tasks are difficult to complete using only fixed rules and are better suited to models.

The other part consists of the TypeScript CLI, Contracts, validators, and `.omv/` local state. They handle matters that can be clearly judged as right or wrong, such as whether fields are valid, whether a state transition is permitted, whether a report is stale, and whether installed Skills have drifted in version.

```text
Codex / Claude Code
        │
        │  Skills: find · audit · repro · dedup · critic · report
        ▼
  .omv/findings/<id>.yaml        <- Evidence.v1
        │
        ├── ThreatMap.v1         <- 数据流与 guard
        ├── Verification.v1      <- 独立审查结果
        ├── SourceRef.v1         <- 源码身份与哈希
        └── repro/ + reports/    <- 复现记录与报告
        │
        ▼
 TypeScript CLI: validate · review · provenance · archive
```

The model may suggest that “this normalization step may be bypassable,” but it cannot promote a finding from candidate to confirmed based on tone alone. `omv review <id> --strict` continues to check Evidence, ThreatMap, Verification, and reproduction materials, then returns `ready`, `needs-repro`, `needs-audit`, `needs-verification`, or `blocked`.

After a report is generated, provenance is also recorded. If Evidence, the report, ThreatMap, Verification, or reproduction materials change, the old report should be considered stale. In this way, although VulDB, GHSA, OSV, and Markdown have different formats, they still refer to the same underlying facts; changing templates will not silently change affected versions or attack prerequisites.

## The complete finding workflow

The current workflow for a finding is roughly as follows:

```text
Campaign / Attack Surface
          ↓
Candidate Evidence.v1
          ↓
Audit -> Repro -> Dedup / Critic
          ↓
      Strict Review
          ↓
Report -> Provenance -> Archive
```

In practice, this is not a one-way pipeline.

If strict review finds the version boundary unclear, return to audit; if local reproduction shows the guard is effective, it can become blocked; if deduplication finds an existing advisory, submission should stop. The most important aspect of this workflow is that research can advance, roll back, or terminate with a record, rather than trying to turn every candidate into a vulnerability report.

I also separated “evidence completeness” from “submission readiness” into two scores. An Evidence file can have many fields filled in but still lack actual reproduction or proof of why the default guard can be bypassed. If only one completion percentage is shown, it is easy to mistake “lots of materials” for “ready to submit.” So now, in addition to evidence score and submission score, the lifecycle state, blockers, and strict-review verdict are retained together.

## What AI can do for vulnerability discovery

My current understanding of AI-assisted vulnerability discovery can be summed up in one sentence: **AI is good at expanding the hypothesis space; the research workflow is responsible for compressing hypotheses into evidence.**

In a traditional audit, a researcher first needs to learn the project structure, then look for entry points in routes, parsers, templates, file operations, network requests, and privilege boundaries. Models really do have an advantage at this stage: they can quickly read many files, connect names, call relationships, and dangerous operations scattered across modules, and propose several different attack paths at once. What once took half a day to inspect a module may now quickly produce more than a dozen candidates worth checking.

That is also where the problem lies. Generating a candidate is cheap, but the cost of proving a vulnerability has not fallen at the same rate. It is easy for a model to find `child_process`, `os.system`, or `fs.readFile`; proving that the attacker controls the input, that the data passes through every transformation to reach the sink, that the default guard can be bypassed, and that the affected version boundary is accurate—and then completing local reproduction—remains substantial work.

```text
源码与公开信息
      │
      ▼
AI 扩大候选假设
      │  sink、入口、异常逻辑、跨文件调用
      ▼
Evidence 漏斗
      │  source -> transforms -> sink -> guard
      │  version -> repro -> observed result -> dedup
      ▼
Confirmed / Blocked / Duplicate
```

So the gains from AI mainly occur in the upper half of the funnel. It helps researchers find directions faster, understand unfamiliar code faster, and lowers the barrier to auditing across languages and frameworks. The lower half of the funnel still depends on rigorous validation. Without Evidence and state gates, increasing the number of candidates only increases false positives too, producing more reports that “look like vulnerabilities.”

### Context needs to be externalized

There is also a practical issue with models: context is not a reliable long-term research database. Conversation compression, model switching, Agent delegation, and session interruption can all cause details to be lost, especially less conspicuous information such as version numbers, file locations, failed hypotheses, and guards.

I handle this by dividing context into two types. Current code understanding and reasoning remain in the conversation; confirmed facts are written into `.omv/`. That way, when switching models to continue research, there is no need to trust the previous conversation's summary; it is enough to reread Evidence, ThreatMap, reproduction records, and blockers. Models can change, but research state must not drift with them.

### Adversarial review is more effective than repeating confirmation

Having the same Agent “check again” in the same context usually works less well than one might expect. It has already accepted its previous assumptions, so a second check easily continues along the same logic and proves itself right.

A better approach is to separate discovery and rebuttal. The Audit Agent proposes the data flow, while a Critic or a fresh context specifically looks for an uncontrollable source, an effective guard, a version mismatch, missing exploitation prerequisites, and duplicate advisories. The value of multiple Agents is not just reading more files in parallel, but also creating isolation between viewpoints.

Agents should not be added without limit, though. In actual use of Agent Teams, I found that more members increase context and token consumption, while cross-module data flows become harder to assemble. It is generally better to limit a task to 2 to 4 clearly defined roles, such as entry point and data flow, language specialization, logic and authentication, and independent verification. Each role must have a clear directory scope and delivery format, with a unified Evidence object still serving as the final record.

## My practical best practices

The following are not hard requirements, but a fairly stable approach I found after using Claude Code, Codex, and Agent Teams for security audits several times.

### 1. Limit the scope first

Do not start by asking the model to “audit the entire project.” First fix the repository, tested version, ecosystem, and one or two vulnerability categories, then choose a concrete attack surface such as the routing layer, template layer, file boundary, or network request. The broader the scope, the more likely the model is to produce a large, shallow list of sinks.

Campaign exists to preserve this layer of constraints. Even after switching models, a new Agent knows what this research excludes, avoiding a fresh divergence every time.

### 2. Require the complete data flow

Providing only the location of a dangerous function does not count as a finding. At minimum, write out this chain:

```text
Source -> Transformations -> Sink -> Guard -> Impact
```

Source should explain how the attacker controls the input; Transformations should record parsing, concatenation, type conversion, and normalization; Sink should give the specific file and line number; Guard should check authentication, allowlists, encoding, sandboxing, and secure defaults. Many false positives do not come from identifying the sink, but from missing constraints on the data before it reaches the sink.

### 3. Separate discovery from proof

`omv-find` output only enters candidate; it does not directly create a confirmed finding. Finder's goal is to rank candidates and provide code entry points; Audit proves source -> sink -> guard; Repro records only actual runtime results.

This split adds a few steps, but prevents the model from finding a candidate and then casually filling in the PoC, CVSS, and report as well. When one conversation handles discovery, proof, and reporting at once, evidence is often where confusion begins.

### 4. Preserve original materials for local reproduction

Do not just write “successfully read the file” in the conversation after reproduction. Commands, environment, dependency versions, stdout, stderr, and screenshots should all be saved in `.omv/repro/<id>/`, with the path written back to Evidence.

```text
.omv/repro/<finding-id>/
  README.md
  commands.sh
  observed.txt
  docker-compose.yml
  screenshots/
```

`observed_result` should be filled out only from actual output, not inferred from the reproducer code. Failed reproduction should also be recorded, because failure may mean the version is unaffected, the default configuration is secure, or the original exploitation hypothesis is simply wrong.

### 5. Deduplicate early once there is a credible path

Deduplicating too early wastes time because a candidate with only a sink does not yet have stable vulnerability characteristics; doing it too late may lead to a lot of reproduction and reporting work on an existing CVE. My habit is to check NVD, GHSA, OSV, ecosystem advisories, repository issues, and release notes before reporting, once the source, sink, and guard have formed a credible path.

Do not search only by vulnerability category: combine package name, affected component, function name, error message, and fixing commit. If no advisory is found, record only “none found in current searches”; do not directly state “confirmed not a duplicate.”

### 6. Use a fresh context for independent verification

High-risk findings are best reviewed by an Agent that did not participate in the initial discovery, or in a new session, and it should be asked to focus on disproving the claim: Is the input really controllable? Is the call path reachable under the default configuration? Why is the guard ineffective? Does the PoC rely on unrealistic privileges? Are the CVSS prerequisites overstated?

If using Agent Teams, do not have all members scan freely at the same time. Two or three members can first take clearly defined modules, while a final Red Team Validator waits for candidate results and only performs adversarial validation. This is easier to converge than having four Agents all produce four “comprehensive reports.”

### 7. Set stopping conditions for research

Vulnerability research can easily drag on indefinitely because “there might still be a way.” Define stopping conditions for each finding in advance: an unprovable source, a default guard that cannot be bypassed, an unconfirmable version boundary, an attack that can only target a third-party live service, or an existing public advisory should each lead to blocked, duplicate, or archive.

Stopping is not giving up. It preserves dead ends that have already been verified, so later research can spend time on more valuable paths.

### A complete command chain

Taking Codex as an example, the workflow I now commonly use is:

```text
omv start --vuln ssrf,path-traversal --no-interactive

$omv-find
$omv-audit <finding-id>
$omv-repro <finding-id>
$omv-dedup <finding-id>
$omv-critic <finding-id>

omv review <finding-id> --strict
$omv-report <finding-id>
```

In Claude Code, replace `$omv-*` with `/omv-*`. If strict review returns `needs-repro`, `needs-audit`, or `needs-verification`, return to the corresponding stage rather than continuing to polish the report.

## TUI workbench

Another major change in 1.0 was rewriting the TUI using Ink 7 and React 19.

Running `omv` directly in a real terminal opens the interactive workbench; pipes, CI, `--json`, and `omv dashboard` retain deterministic plain-text output and do not start Ink.

Below is the actual Findings view. The left side shows the work queue by priority; the right side focuses on the current finding's status, readiness, verdict, blocker, and next Skill. When opening a project, this makes it possible to quickly determine which layer the research has reached without first browsing the entire Evidence file.

![oh-my-vul TUI Findings view: work queue on the left, Evidence summary, blockers, and next action on the right](/blog/oh-my-vul-1-0/01-oh-my-vul-tui-findings.png)

The workbench currently includes Overview, Findings, Campaign, and Activity; finding details are divided into Summary, Evidence, Threat, and History. Search, structured filtering, full-detail scrolling, narrow-terminal layouts, and the most recent 200 Activity items have all been accommodated.

I kept one design decision particularly strict: **the TUI only displays information; it does not directly run research commands.**

It can tell the researcher to run `omv review` next, or hand a finding to `$omv-repro` or `/omv-audit`, but it will not secretly run a shell in the background. Browsing evidence and changing evidence state are different operations; the latter should remain in CLI or Skill calls that can be recorded and reviewed.

## Codex and Claude Code support

The project originally targeted Claude Code mainly; 1.0 adds complete Codex setup, doctor, and uninstall support.

The installation directories for the two platforms are isolated:

| Platform    | User-level directory | Project-level directory |
| ----------- | -------------------- | ----------------------- |
| Codex       | `~/.agents/skills` | `.agents/skills` |
| Claude Code | `~/.claude/skills` | `.claude/skills` |

Optional subagents in Claude Code only go into `.claude/agents`. Codex uses Skills and its own native delegation mechanism, and does not mix in Claude's Agent files. The two platforms also have their own install manifests and can be installed at the same time.

For compatibility with existing users, Claude Code remains the default platform when `--platform` is omitted. Codex must be specified explicitly:

```bash
npm install --global oh-my-vul@latest
omv setup --platform codex
```

After `setup` completes, it automatically runs the health check for the corresponding platform and scope. Enter the project directory to be studied, then initialize the local workspace:

```bash
omv start
```

In Codex, use:

```text
$omv
```

In Claude Code, use:

```text
/omv
```

To view only the static status, run:

```bash
omv dashboard
omv review <finding-id> --strict
```

## Interfaces frozen in 1.0

This project's CLI is called by people, scripts, and Agents alike. Once an interface is public, the cost of casually renaming it later is very high. Before the 1.0 release, I did a dedicated round of interface cleanup, removed duplicate commands, hid the internal primitives for Skill management from the public help, and froze the following boundaries:

1. The core CLI and advanced automation commands in `omv help --all`;
2. JSON output with a required-fields checklist;
3. Versioned `.omv` Contracts;
4. The Node API at the package root entry point;
5. Version compatibility between the CLI and built-in Skills.

Contracts also distinguish between `closed` and `extensible`. Closed contracts such as Campaign, SourceRef, and ReportProvenance have a fixed field set within v1; extensible contracts such as Evidence and ThreatMap may add optional fields, but existing readers and writers must remain compatible.

Upgrading the package does not automatically rewrite users' `.omv/` data just to catch up with the schema. `omv doctor` checks whether the CLI, Skills, platform directories, and manifest have drifted, then provides repair commands with the correct scope and platform.

## Security boundaries

oh-my-vul only conducts passive research on public information and public source code. Reproduction is limited to local or explicitly authorized environments; attacking third-party live services is not a method for confirming a vulnerability.

This limitation is both a security requirement and an evidentiary requirement. Behavior that depends on real accounts, production data, or non-repeatable remote state is difficult to turn into vulnerability evidence that others can independently verify. If an issue cannot be confirmed in an authorized environment, it is better to keep it as unknown or a blocker than to let a model turn it into a definite conclusion.

The project currently covers npm, Python, Go, Rust, Java, Ruby, PHP, C#, Swift, Dart, Elixir, Perl, R, and Lua, and supports macOS, Linux, and Windows. Coverage of these ecosystems does not mean that an Agent can already make vulnerability determinations automatically.

`file:line` supplied by the model still needs to be checked; whether a guard can be bypassed must be assessed in the context of the specific call path; the observed result must come from an actual run; and the researcher should ultimately be responsible for CVSS and the affected scope. `ready` means that local materials passed the current gate; it does not mean that a CNA will necessarily accept the report.

## Finally

I did not build oh-my-vul to help Agents declare vulnerabilities faster. I would rather have the project still be able to explain, days later, after switching models, or even after handing a finding to another researcher: what was tested then, what was observed, and what remains unproven.

Language can help people understand vulnerabilities; evidence is what establishes them.

- GitHub: [bx33661/oh-my-vul](https://github.com/bx33661/oh-my-vul)
- npm: [oh-my-vul](https://www.npmjs.com/package/oh-my-vul)

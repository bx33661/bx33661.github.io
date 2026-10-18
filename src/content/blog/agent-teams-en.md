---
title: "Claude Code Agent Teams: Multi-Agent Code Security Auditing"
description: "Using Claude Code Agent Teams for security auditing: multi-agent collaboration, its boundaries, and an initial Go project audit."
date: 2026-03-11T00:00:00.000Z
tags:
  - "Claude Code"
  - "AI"
  - "Security Audit"
  - "Agent"
authors:
  - "bx"
draft: false
slug: "agent-teams-en"
lang: "en"
translationKey: "agent-teams"
---

# First Experience with Code Security Auditing Using Claude Code Agent Teams
## Summary
### Strengths
Based on recent experiences using LLMs to discover vulnerabilities, today's leading models are already very capable.

However, a single conversation or Tool Calling can struggle with some large-scale projects. If one model has to keep authentication logic, the database layer, and frontend routes in mind at the same time, it can easily “mix things up” during reasoning or miss details.

**The key to Agent Teams is context isolation**: the Agent responsible for cryptography has only the code and context related to `crypto` in its context, while the Agent responsible for entry points has only the Router context. This greatly improves the vulnerability-detection accuracy of each “specialist node.”

> One caveat: the team should not have too many Teammates. Too many members cause the workload to increase dramatically.
>

Agent Teams can also introduce adversarial review. We can design a “challenge mechanism” in which, after one Teammate finds an issue, another Teammate audits it.

> This matters, for example, when we use Claude to write a project. Asking it to audit its own project in the same conversation or with the same model may not uncover issues easily. In our usual practice, we start a new conversation or have Codex perform a code review.
>

### Limitations
1. First is the enormous token consumption: each Teammate maintains a separate conversation context while tasks run in parallel.
2. The ability to piece together complex cross-module data flows remains relatively weak.

With a simple MVC architecture, they can follow the trail. But with a microservices architecture, highly decoupled message queues, or extremely complex interface abstractions,

it is difficult for an intermediate Agent C to perfectly connect a Source found by Agent A with a Sink found by Agent B. This requires a global understanding of the code, while division of labor is precisely what fragments the global view.

****

The tool's limitations are shown here.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773198342833-b0a173a4-d4c9-4a82-9a54-6d2a9516c17f.png)

## Practical walkthrough
See the official documentation:

[Coordinate Claude Code session teams - Claude Code Docs](https://code.claude.com/docs/zh-CN/agent-teams)

> The experience is currently best on macOS. I strongly recommend **iTerm2** (it supports calling native APIs to split panes perfectly), or **Tmux** if it is already installed on your system.
>

For the prerequisite configuration, this feature requires running a command:

```bash
claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
```

Alternatively, manually add this to the `.claude` folder's `setting.json`:

```go
"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773149647488-a3cc77f8-940d-4575-83ae-b46553db9c4c.png)

Incidentally, to enable split panes, you need to turn on one of iTerm2's Python API settings.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773149908143-1259f97c-bd1b-45f8-8e79-8d4973a2330a.png)

Once the basic configuration is complete, you can launch it.

(Tell Claude to automatically open split panes whenever it is asked to summon a team.)

```bash
claude config set teammateMode auto
```

If you just want to test or get a feel for the team, you can enter this prompt:

```bash
Create an agent team with 4 teammates to perform a simple concurrent test.

Teammate A: Continuously print "Agent A is running..."
Teammate B: Continuously print "Agent B is scanning..."
Teammate C: Continuously print "Agent C is analyzing..."
Teammate D: Continuously print "Agent D is waiting..." Please make them output 10 times with 1-second delay. Just start immediately without asking for plan approval.
```

Here I show a Team auditing a Go project, as follows.

Prompt:

```plain
Create an agent team with 4 teammates to perform a comprehensive security audit of this Go codebase.

- Teammate 1 (Data Flow Auditor): Focus on identifying injection vulnerabilities (SQLi, Command Injection, Path Traversal, SSRF). Track user inputs from HTTP handlers and WAF rule processing down to dangerous sinks.
- Teammate 2 (Go-specific Security Auditor): Focus on Go-specific issues. Look for goroutine leaks, race conditions (e.g., concurrent map writes), improper use of the `unsafe` package, and resource exhaustion vulnerabilities (DoS).
- Teammate 3 (Logic & Crypto Auditor): Review the authentication, authorization, session management, and cryptographic implementations. Look for weak PRNGs, outdated ciphers, and logical bypasses.
- Teammate 4 (Red Team Validator): Do not perform the initial scans. Wait for findings from the other 3 teammates. Act as a devil's advocate: try to construct theoretical exploit scenarios for their findings to verify if they are true positives. Finally, compile a unified vulnerability report.

Please have each teammate present a brief plan of which directories/files they will investigate first. Require my plan approval before they begin deep scanning.

```

After the initial setup, you can see that it automatically initializes and creates the four Teammates we need.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152171647-470f1b18-dbfa-4c77-9e8f-ed58e3a52773.png)

The split panes let us see what each Teammate is doing.

Visually, the result is quite good.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773148772205-86956aff-b956-4a6d-b089-a1afb65a89f6.png)

After waiting nearly 10 minutes, the audit results were ready.

Overall report:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152452607-acb2e59e-caef-42a5-90df-55547cb153a1.png)

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152483081-c690e78a-834d-4c59-9e86-bf7d80bfa5e7.png)

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773148895908-d57f2319-989e-42cf-ae65-059cd9fb09be.png)

The results were excellent.

See the GIST for the interaction details:

[https://gist.github.com/bx33661/eb9783762269a5e3a76a0a37ff863120](https://gist.github.com/bx33661/eb9783762269a5e3a76a0a37ff863120)

The report was well written and relatively accurate.

+ **Data Flow Auditor** found serious **command injection** in `search.go` and `admin.go`, as well as **path traversal** in `imageUploader.go` and multiple XSS issues.
+ **Logic & Crypto Auditor** did not focus on SQL injection; instead, it precisely targeted business-logic flaws: **passwords stored without encryption**, **Base64-forged sessions**, and weak random-number-based sessions generated using `math/rand`.
+ **Go-Specific Auditor** checked for Goroutine and resource-exhaustion issues. Although this target did not use concurrency (“No Goroutine Leaks: Application doesn't use concurrency”), it diligently pointed out the potential **DoS (denial of service)** risk of loading all posts without limits.

### Team communication
Claude mentioned this point in the documentation.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773198097789-dc3aab94-417f-4907-b755-99b2fdc23ae4.png)

See here for a concrete example of Teammates communicating.

> At the underlying level, an Agent Team is essentially a **Team Lead–Specialist Model**. The main console where you enter the prompt is the Team Lead.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152996672-fa10b380-b970-4ce8-9fce-df592d93bbd5.png)

And finally:

```go
@logic-crypto-auditor❯ Acknowledged - Plan already sent, awaiting approval
@red-team-validator❯ ACK received
@logic-crypto-auditor❯ ACK received
```

Agent Teams' collision-prevention/timeout-confirmation mechanism (Acknowledge).

That is, after the controller issues an instruction or approves a plan, the Agent must reply with `ACK` (“received”) to confirm that it received the signal and is ready to begin. This keeps team state synchronized when many tasks run concurrently.

## Deeper exploration (with Skills)

Pure static auditing has its limits.

I'll write more in a few days...


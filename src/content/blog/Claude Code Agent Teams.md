---
title: "Claude Code Agent Teams 代码安全审计初体验"
description: "探讨 Claude Code 的 Agent Teams 功能在代码安全审计中的应用与实践，以 Go 语言项目为例体验多智能体协作的优越性与局限性。"
date: 2026-03-11
tags:
  - "Claude Code"
  - "AI"
  - "安全审计"
  - "Agent"
authors:
  - "bx"
draft: false
slug: "agent-teams"
---
<meta name="referrer" content="no-referrer">

# Claude Code Agent Teams 代码安全审计初体验
## 总结
### 优越性
在近期利用 LLM 挖掘的漏洞体验来看，现在主流模型的能力已经很强了，

但是对于一些具有规模性的项目一次性的对话或者 Tool Calling 都有些乏力，如果让一个模型同时记着鉴权逻辑、数据库层和前台路由，它很容易在推理时“串台”或者遗漏细节



**Agent Teams 的关键在于上下文隔离**：负责看密码学的 Agent 它的脑子里只有 `crypto` 相关的代码和上下文，负责看入口的 Agent 只有 Router 的上下文。这极大地提高了每个“专精节点”的漏洞发现精确度

> 但是有一点，Teammate 的设计也不能太多，过多的成员会导致压力暴增
>



同时 Agent Team 可以引入对抗性，我们设计一个“对抗机制”，能够在一个 Teammate 发现问题之后，交给另一个 Teammate 审计

> 这个主要体现在比如我们用 Claude 写一个项目，如果在相同对话或者模型去让他审计自己写的项目，可能不是很容易的发现问题，平常我们的实践就是新开对话，或者让 Codex 去做一遍 code review
>





### 局限性
1. 首先就是恐怖的 Toekn 消耗，每个 Teammate 单独维护一个对话 context，并行执行任务
2. 跨模块复杂数据流的“拼图”能力依然偏弱

如果是简单的 MVC 架构，它们能顺藤摸瓜。但如果遇到微服务架构、高度解耦的消息队列、或者极其复杂的接口抽象，

Agent A 发现的 Source 和 Agent B 发现的 Sink 很难被中间的 Agent C 完美拼接起来。因为这需要全局的代码理解度，而分工恰恰割裂了全局视野。

****

工具本身限制可以看这里

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773198342833-b0a173a4-d4c9-4a82-9a54-6d2a9516c17f.png)





## 具体实践
官方文档见

[协调 Claude Code 会话团队 - Claude Code Docs](https://code.claude.com/docs/zh-CN/agent-teams)

> 这个目前 MacOS 上体验是最好的，强推 **iTerm2**（支持调用原生 API 完美切分窗格），或者系统已安装 **Tmux**
>

前提配置，这个功能需要执行命令

```bash
claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
```

或者手动在 `.claude`文件夹下的`setting.json`,加入

```go
"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773149647488-a3cc77f8-940d-4575-83ae-b46553db9c4c.png)

随便说一句，要想实现分屏需要开始 iterm2 的一个 Python api 设置

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773149908143-1259f97c-bd1b-45f8-8e79-8d4973a2330a.png)

基本配置完成，就可以启动

（告诉 Claude，以后只要召唤团队，就自动开启分屏）

```bash
claude config set teammateMode auto
```

如果只是想测试或者感受一下 team，可以输入以下这个 prompt

```bash
Create an agent team with 4 teammates to perform a simple concurrent test.

Teammate A: Continuously print "Agent A is running..."
Teammate B: Continuously print "Agent B is scanning..."
Teammate C: Continuously print "Agent C is analyzing..."
Teammate D: Continuously print "Agent D is waiting..." Please make them output 10 times with 1-second delay. Just start immediately without asking for plan approval.
```



这里我举出一个挖掘一个 Go 项目的 Team，具体如下

Prompt:

```plain
Create an agent team with 4 teammates to perform a comprehensive security audit of this Go codebase.

- Teammate 1 (Data Flow Auditor): Focus on identifying injection vulnerabilities (SQLi, Command Injection, Path Traversal, SSRF). Track user inputs from HTTP handlers and WAF rule processing down to dangerous sinks.
- Teammate 2 (Go-specific Security Auditor): Focus on Go-specific issues. Look for goroutine leaks, race conditions (e.g., concurrent map writes), improper use of the `unsafe` package, and resource exhaustion vulnerabilities (DoS).
- Teammate 3 (Logic & Crypto Auditor): Review the authentication, authorization, session management, and cryptographic implementations. Look for weak PRNGs, outdated ciphers, and logical bypasses.
- Teammate 4 (Red Team Validator): Do not perform the initial scans. Wait for findings from the other 3 teammates. Act as a devil's advocate: try to construct theoretical exploit scenarios for their findings to verify if they are true positives. Finally, compile a unified vulnerability report.

Please have each teammate present a brief plan of which directories/files they will investigate first. Require my plan approval before they begin deep scanning.

```

等一下基本初始化，可以看到，会自动初始化创建我们需要的四个 Teammate

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152171647-470f1b18-dbfa-4c77-9e8f-ed58e3a52773.png)

通过分屏我们可以看出每个 teammate 都在干嘛

通过视觉的效果来看还是很不错的

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773148772205-86956aff-b956-4a6d-b089-a1afb65a89f6.png)

等待了将近 10 分钟，最后审计结果

总体报告：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152452607-acb2e59e-caef-42a5-90df-55547cb153a1.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152483081-c690e78a-834d-4c59-9e86-bf7d80bfa5e7.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773148895908-d57f2319-989e-42cf-ae65-059cd9fb09be.png)

效果特别好

具体交互细节可以见 GIST

[https://gist.github.com/bx33661/eb9783762269a5e3a76a0a37ff863120](https://gist.github.com/bx33661/eb9783762269a5e3a76a0a37ff863120)

报告写的很好，而且算是比较准确的

+ **Data Flow Auditor (数据流审计员)** 找到了 `search.go` 和 `admin.go` 里的严重**命令注入**，还揪出了 `imageUploader.go` 里的**目录遍历**和多处 XSS。
+ **Logic & Crypto Auditor (逻辑与密码审计员)** 没去管 SQL 注入，而是精准定点打击了业务逻辑缺陷：**未加密存储密码**、**Base64 伪造 Session** 以及使用 `math/rand` 生成弱随机数会话。
+ **Go-Specific Auditor (Go 语言专项)** 检查了 Goroutine 和资源耗尽问题，虽然这个靶场没用到并发（"No Goroutine Leaks: Application doesn't use concurrency"），但它尽职地指出了无限制加载所有帖子的潜在 **DoS (拒绝服务)** 风险。





### 团队交流
这一点 Claude 在文档提及过

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773198097789-dc3aab94-417f-4907-b755-99b2fdc23ae4.png)

具体效果可以看这里，Teammate 在交流

>  Agent Team 底层其实是 **主管-职员模式 (Team Lead - Specialist Model)**。你输入 prompt 的主控台就是 Team Lead。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1773152996672-fa10b380-b970-4ce8-9fce-df592d93bbd5.png)

还有在最后

```go
@logic-crypto-auditor❯ Acknowledged - Plan already sent, awaiting approval
@red-team-validator❯ ACK received
@logic-crypto-auditor❯ ACK received
```

Agent Teams 的防碰撞/防超时确认机制（Acknowledge）。

就是说当主控层下达了指令或批准了计划后，Agent 必须回复 `ACK`（收到），证明它已经接收到了信号并准备开始干活，这保障了多并发情况下的团队状态同步







## 深入尝试（结合Skills）

纯静态审计是有极限的。

过几天再写...






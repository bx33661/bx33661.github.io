---
title: "介绍 Pinwhy 项目：以一次审计为例"
description: "以一次多 Agent 静态安全审计演练为例，展示外置记忆与可视化工作台 Pinwhy 的 Ultra 覆盖视图、双翼辩证卷宗、DeepSeek Harness 插件，以及单事实源与三维正交设计原理。"
date: 2026-11-24
tags:
  - "Pinwhy"
  - "AI"
  - "Agent"
  - "安全审计"
authors:
  - "bx"
draft: false
slug: "introducing-pinwhy"
translationKey: "introducing-pinwhy"
---

> **GitHub 仓库**：[github.com/Fruit-Guardians/pinwhy](https://github.com/Fruit-Guardians/pinwhy)
>
> **DeepSeek Harness 原生插件**：[plugins/dsh-pinwhy](https://github.com/Fruit-Guardians/pinwhy/blob/main/plugins/dsh-pinwhy/README.md)
>
> **官方网站与在线演示**：[pinwhy.bx33661.com](https://pinwhy.bx33661.com)

**[Pinwhy](https://github.com/Fruit-Guardians/pinwhy)** 是一个与宿主无关的 **Agent 外置记忆与实时可视化工作台**。它的目标很朴素：把 AI Agent 在复杂调研或排障过程中的思考脉络、判断依据与推进进度留在项目本地——换会话不断线，人随时看得懂，也能直接介入协同。

本文不从概念讲起，先直接看一组真实运行的画面。我们选择了一个代码量比较大的项目作为样本，进行了一次只读静态安全审计演练：由 1 个主协调者（`coordinator`）、8 个并发工作 Agent（`worker-*`）与 1 名独立复核员（`skeptic`）共同走读全仓 98 个源码切片与 20 个待核探针，最终在本地黑板上沉淀了 **141 个推理节点、238 条显式关系、5 个检查点与 10 个 Agent 游标**。

下面先通过工作台截图看实际呈现在面前的效果，再展开这套设计背后的问题意识与实现原理。

## 一、Ultra 视图：记录代码覆盖与依赖边界

派 Agent 审一个数千到数万行的仓库，最难把握的是两件事：一是它有没有挑几个显眼文件草草收尾，二是大段配置文件会不会把上下文窗口塞满。可选底座 `pinwhy-ultra` 专门负责管理物理源码切片与探针覆盖。

### 1. 星轨弦盘：模块覆盖与跨切片依赖

![Ultra 星轨弦盘视图](/blog/introducing-pinwhy/01-ultra-constellation.png)

进入工作台的 **Ultra 模式 → 星轨弦盘**，整个仓库按目录扇区（`src/converters`、`src/pages`、`src/services`、`root` 等 14 个扇区）排成一圈：

- **灰色扇区**：通过 `pinwhy-ultra exclude` 写明理由归档的非运行态资产（本轮排除了 33 项纯 SVG 图标、CSS 样式与 CI 元数据），做到有据排除，而不是静默跳过。
- **绿色切片**：核查过且确认无异常，只记在覆盖台账里，不往主推理黑板灌水。
- **红色切片与外圈圆点**：命中具体线索或挂载了主黑板节点的切片。
- **圆心弦线**：切片与探针之间显式声明的跨模块依赖（`--depends-on`）。只要上游切片仍处于 `pending` 或被重新打开，依赖它的下游就会自动退回 `shallow(unverified-dependency)`，提醒团队把前置前提核对清楚。

本轮演练中，全部 118 个纳管项（98 个物理切片与 20 个探针）最终收敛到 **100.0%（118/118）**。

### 2. 体量树图：按代码行数查看覆盖分布

![Ultra 体量树图视图](/blog/introducing-pinwhy/02-ultra-treemap.png)

切换到 **体量树图**，每个模块与切片的面积直接对应真实代码行数（例如 `src/converters` 占 3,682 行、`src/pages` 占 1,850 行、`root` 占 600 行）。哪块代码体量最大、哪个大文件只看了表面，看面积比例就一目了然；在右侧抽屉里还能随时抽查“已清零节点”，防止写入者只留一句 `"ok"` 敷衍过去（过短或缺少依据的说明会被 Ultra 自动打回成浅读）。

### 3. 门禁对账：区分覆盖承诺与开放边界

![Ultra 门禁对账视图](/blog/introducing-pinwhy/03-ultra-gates.png)

在 **门禁对账** 面板里，状态被明确分成两组：

- **上方 C1–C3（阅读与凭据承诺，必须清零）**：
  - `C1`：所有纳管源码切片均已扫描，且与磁盘文件哈希一致；
  - `C2`：没有浅读打回、未核依赖、代码漂移或未回应的人类追问；
  - `C3`：不存在“没有证据边支撑就标成 `confirmed` 或 `refuted`”的孤证裁定（`unbackedVerdicts = 0`）。
- **下方 S1–S2（认知边界与开放信号，允许如实保留）**：
  - 哪怕 `C1–C3` 全部 `CLEAR`，`S2` 依然坦诚列出了 `q1–q5` 等开放问题，以及因当前环境缺少对应二进制而挂起（`blocked`）的待核验事项。

Pinwhy 允许 `commitmentComplete = true` 与 `allClear = false` 共存——严肃的技术调查不应为了凑“全部通过”而掩盖客观限制。

---

## 二、通用工作台：多 Agent 视角与局部推理图谱

回到主黑板的 **通用工作台**，可以看到整条探索脉络是如何围绕“目标 → 问题 → 猜测 → 证据 → 发现”生长出来的。

### 1. 多 Agent 视角与独立游标

![通用工作台与多 Agent 视角切换](/blog/introducing-pinwhy/04-general-agents.png)

在并发审计过程中，8 个工作 Agent 与 1 名复核员各自携带 `--agent <name>` 写入同一块黑板。每条节点与连线都有清晰署名，通过右上角的 **Agent 视角** 菜单，可以随时切换观察不同参与者的关注位置（`coordinator`、`worker-ui`、`worker-files`、`worker-conv-a`、`skeptic` 等）：

- 切换视角**仅作只读浏览**，不会改变任何 Agent 自己的游标；
- 图中绿色高亮框标出了 `worker-ui` 当前关注的节点（缺省安全响应头 `fd3`），左侧连着它的证据支撑 `f2`，右侧连着它所回答的议题 `q4` 与待确认反代边界 `n2`。

### 2. 逻辑视图与节点检查器

![逻辑视图一跳邻域与检查器](/blog/introducing-pinwhy/05-general-logic-inspector.png)

当黑板累积到 141 个节点时，把所有卡片平铺在同一屏里难免难以阅读。在 **逻辑视图** 中选中任一节点（例如针对清理定时器的 `fd6`）并点击 **聚焦一跳邻域**，画布会自动淡化无关节点、把直接关联的证据链条收拢到视野中心，右侧 **检查器** 则完整呈现该节点的源码位置、机制说明、修复建议与状态维度：

- **严重度**：低危
- **状态**：已确认
- **可信度**：静态确认（如实保留“未做动态执行验证”的边界）

---

## 三、安全审计视图：双翼辩证卷宗与对抗复核

切换到顶栏的 **审计** 模式，底层读的依然是同一份本地记录（不复制数据、不写入事件），但界面会重组为便于逐条复核与质证的卷宗布局。

### 1. 议题目录与态势矩阵

![安全审计模式态势矩阵](/blog/introducing-pinwhy/06-audit-matrix.png)

左侧栏将 `goal` 与 `question` 展开成可折叠的 **议题 ▸ 候选目录**；顶部一行事实统计条（“已复现 0 · 静态确认 49 · 待核实 0 · 交锋未决 6 · 异源印证 10 · 单源自证 18 · 已反驳 / 取代 15”）可直接作为筛选器点击使用。图中选中了 **已反驳 / 取代 15**，立刻列出所有被实证排除的误报假设与被合并取代的旧记录——**排除了哪些方向，和确认了什么问题同样值得留档**。

### 2. 双翼卷宗：异源印证与依赖条件

![双翼辩证卷宗：异源印证与前提条件](/blog/introducing-pinwhy/07-audit-dossier-corroborated.png)

点开 `fd7`（容器默认以 `PUID=0` 运行的问题），双翼卷宗将论证分成左右对照的两侧：

- **左翼（支持与推导）**：同时列出提出者 `worker-infra` 的源码证据 `f15`，以及独立复核员 `skeptic` 重核后补写的 `f60`（绿色徽标标出 **skeptic · 异源印证**），说明该判断已经跨越单一会话的自证局限；
- **右翼（反证与依赖条件）**：把隐含前提 `n6`（`PUID` 未设置或为 `0`）通过 `depends-on` 独立挂出，一眼分清“代码事实”和“部署触发前提”。

### 3. 双翼卷宗：局部反证与记录取代

![双翼辩证卷宗：对抗纠偏与局部反证](/blog/introducing-pinwhy/08-audit-dossier-contested.png)

对抗复核并不总是全盘推翻一条结论，很多时候是**定点修正其中过宽或不准确的某一条子判断**。看 `fd6` 的卷宗：

- 原记录曾提到 `AUTO_DELETE_EVERY_N_HOURS="Infinity"` 会让定时器进入无限分片空转循环；
- 独立复核员 `skeptic` 沿着 `src/index.tsx:103` 重核源码后发现，启动阶段会同步调用 `clearJobs()`，直接在 `new Date(Date.now() - Infinity).toISOString()` 抛出 `RangeError` 同步崩溃，根本到不了后续的 `scheduleDelayed`。
- `skeptic` 没有粗暴地把 `fd6` 改写成“误报”，而是补写了一条局部反证 `f52` 挂载到右翼反证栏（卡片状态自动显示为 **交锋未决**），同时将原本把 4 个问题混在一条的旧节点 `fd13` 用 `supersedes` 归并取代。历史探讨脉络得以保留，细节边界也被校正准确。

### 4. 双翼卷宗：保留被反驳的假说

![双翼辩证卷宗：假说已反驳](/blog/introducing-pinwhy/09-audit-dossier-refuted.png)

针对 `q3` 中“多个 CLI 转换器是否普遍存在 `-` 前缀文件名参数注入”的猜测 `hy12`，`worker-conv-b` 核对了 11 个多媒体/图像转换器及上游调用链，用证据 `f41` 说明调用方恒定拼接 `./data/uploads/...` 前缀且 `sanitize-filename` 会剥离 `:` 与 `/`，从 HTTP 入口无法将 `-` 或 `coder:` 送入参数首字符，因此将 `hy12` 标为 **已反驳**。后续换新会话接手时，就不会再重复排查这条已被排除的路径。

---

## 四、检查点摘要与 2.5D 视图

### 1. 检查点与交接后变化

![现场摘要与检查点增量变化](/blog/introducing-pinwhy/10-digest-checkpoints.png)

在长任务暂停或上下文即将压缩前，Agent 会打一个 `checkpoint`（如 `cp1`–`cp5`）。点击顶部的 **现场摘要**，可以任选历史检查点查看 **交接后变化**（对应 CLI 的 `pinwhy context --since <checkpoint> --budget 4000`）：不用重读全部 141 个节点，按预算取回关键脉络与交接后的增量差异；超出预算的非邻域项会明确统计省略数量，需要细节时再按 ID 用 `pinwhy show` 展开。

### 2. 2.5D 沙盘视图

![2.5D 硬件电路沙盘视图](/blog/introducing-pinwhy/11-scene3d-sandbox.png)

在通用视图工具栏点击 **2.5D**，当前焦点邻域会投影成一块可拖拽旋转的深色电路板：芯片高度只对应已记录的风险级别，发光芯片代表当前焦点，铜线严格对应显式写入的逻辑边——图上没有写进来的因果，界面绝不自动脑补连线。

---

## 五、宿主原生集成：DeepSeek Harness 插件

除了在浏览器中打开独立本地工作台，Pinwhy 也可以通过薄适配插件直接嵌进 Agent 宿主界面。以官方维护的 DeepSeek Harness 原生插件 [`dsh-pinwhy`](https://github.com/Fruit-Guardians/pinwhy/blob/main/plugins/dsh-pinwhy/README.md) 为例：它通过子进程调用独立安装的 `pinwhy` CLI（不复制内核与 Skill），向宿主暴露 11 个结构化工具（按 `dsh:<session.id>` 隔离署名），并通过临时只读服务（`serve --read-only --ephemeral`）将 2D / 2.5D 与审计视图直接渲染进宿主面板，同时支持将选中节点一键引用到当前对话草稿（下图为 DSH 演示样本效果）：

![DeepSeek Harness 侧栏 Pinwhy Board 入口（浅色主题）](/blog/introducing-pinwhy/12-dsh-board-light.webp)

*从左侧全局导航进入「Pinwhy Board」，可按会话切换查看对应项目的推理图谱（随宿主同步浅色外观与只读标识）。*

![DeepSeek Harness 会话内嵌 Pinwhy 画板标签页（深色主题）](/blog/introducing-pinwhy/13-dsh-session-dark.webp)

*在具体对话中，画板直接作为与 `Chat` / `Trajectory` 并列的标签页嵌在输入框上方，不切换窗口即可一边看图谱一边继续对话。*

---

## 六、为什么需要一块独立的黑板

回头看上面这些视图，它们针对的其实是日常使用 Agent 做复杂调研、排障或审计时最常碰到的三个断点：

1. **执行期不透明**：终端里工具调用一行行快速滚动，人很难在运行过程中及时看清 Agent 正在主攻哪条线、排除了哪些方向、又卡在哪个假设上。往往等跑完再看长篇总结，方向早已跑偏。
2. **线性对话扛不住上下文压缩**：常规的对话记忆或向量检索擅长“事后查片段”，但表达不了推理之间的**逻辑张力**——哪条是待验证猜测、哪条已有代码实锤、哪条只对某一部分前提成立、哪条已经被实证推翻。
3. **跨会话与多人交接缺少硬边界**：单纯靠自然语言总结交接，后接手的人或新开会话很难区分“真运行复现过”“静态看代码确认过”“因为缺环境没法测”还是“压根没有读到那个目录”。

Pinwhy 的思路是把“过程判断”和“物理覆盖”从易失的聊天记录里拆出来，以结构化图谱和台账的形式落在项目本地：Agent 边探边记，人随时旁观、纠偏或补充线索；换窗口、换宿主（Claude Code、Codex、Cursor、Gemini CLI、DeepSeek Harness 等）时，新会话按预算读回同一份现场接着推进。

---

## 七、核心理念与实现原理

设计 Pinwhy 时，我们在工程取舍上守着一条简单的准绳：**凡是要在“看起来更智能”和“更少干预”之间作选择的地方，每次都选后者。** 整体架构和数据流如图 1 所示：

![Figure 1 · Pinwhy 分层架构与单事实源事件流](/blog/introducing-pinwhy/fig-01-architecture.png)

具体落到工程实现上，主要依靠四个设计原则：

### 1. 一份只追加的本地日志，作为唯一事实源

- **事件溯源**：项目本地的 `.pinwhy/events.jsonl` 是唯一权威数据源（append-only）。`state.json` 只是加速查询的快照缓存，哪怕删掉或损坏，也能从事件日志完整回放重建。
- **并发与完整性保护**：多个 Agent 并发写入时，经由原子目录锁与 `--request-id` 回执去重依次落盘；回放若遇到坏行绝不静默丢弃，而是在 `lint` 里如实计数报告。
- **双账严格隔离**：可选的覆盖底座 `pinwhy-ultra` 把物理切片、哈希和待测探针单独存放在 `.pinwhy/ultra/ledger.jsonl`，仅通过 `--refs` 校验主黑板节点 ID，绝不往主推理日志里灌入源码正文或无用流水账。

### 2. 三层独立与三维正交

为了让工作台里展示的每条关系和状态都经得起复核，Pinwhy 在数据模型层面做了两层正交约束（如图 2 所示）：

![Figure 2 · 状态三层隔离与结论三维正交语义](/blog/introducing-pinwhy/fig-02-model-orthogonality.png)

- **状态三层互不污染**：**逻辑层**（节点与显式有向边）、**游标层**（各 Agent 当前关注点与轨迹）与**活动层**（原始工具调用，默认关闭）严格分离。Agent 读过某个文件、或者移动了游标，不会自动在图上生出一条因果关系。
- **评估三维互不推断**：严重度（`severity`）、处理状态（`status`）、证据可信度（`confidence`）各自独立——未显式写入的字段保持 `null`，不被默许成 `open` 或 `confirmed`；节点类型也只是语义标签，不构成强制状态机。

### 3. 联动而不干预

- **不替 Agent 做决定**：`pinwhy lint` 永远以退出码 `0` 返回，只做体检、不阻断执行；`pinwhy context` 的输出显式声明 `readOnly: true`、`prescriptive: false` 与 `nextStepSelection: "agent-controlled"`。
- **不自动脑补逻辑**：创建节点默认既不自动连边、也不自动移动游标；除非写入者明确指定 `--rel`、`--to` 或 `--enter`，系统不会从正文里猜测关系，也不会给候选打分排序。
- **人机平等写入**：协作者在网页工作台补充的观察或追问，同样带着 `author: human` 署名通过同一把写锁进入事件日志，让 Agent 在下次恢复上下文时自然看到，而不把黑板变成阻塞式的审批关口。

### 4. 内核极简、契约稳定、适配做薄

- **零运行时依赖**：核心 CLI、本地 HTTP 服务与前端导出共用同一套纯 JS 模型，**0 个第三方运行时依赖**，装上即可在本地离线运行。
- **宿主无关**：无论是 Claude Code 的 Hook、Codex / Cursor 的 Skill，还是 DeepSeek Harness 的原生插件，都只是调用公开 CLI 与 `--json` 契约的薄适配层，不复制内核，也不建立第二份权威状态。哪怕彻底卸载某个宿主插件，黑板记录依然完整留在项目本地，换任何工具都能继续读。

---

## 八、不做什么与本轮实测记录

基于上面的设计取舍，Pinwhy 刻意避开了一些看似“更聪明”但容易越界的方向，同时我们也在这次真实演练中顺带记录了几条工程体验：

1. **明确不做的三件事**：
   - 不做成存聊天流水或黑盒向量片段的通用记忆库；
   - 不做阻塞式审批流、强制状态机或自动步骤编排；
   - 不让模型自动补全边关系、排序优先级或给发现打分。
2. **本轮真实演练中的三条一线观察**：
   - `pinwhy search --type` 目前只匹配单个类型名（传入逗号分隔的多类型会返回 0 条），批量按多类型拉取时改用 `pinwhy ls --all --json` 更稳妥；
   - 当两个 Ultra 项互为 `--depends-on` 环依赖时（本轮 `s31` 与 `p13`），双方都关闭后仍能正常收敛 `breadthComplete = true`，不过若 CLI 能主动提示环依赖会更清晰；
   - 8 个并发工作 Agent 与 1 个复核员高频向同一份 `.pinwhy/events.jsonl` 与 `.pinwhy/ultra/ledger.jsonl` 并发追加写入，文件锁与批量事务表现稳定，全程 `0` 坏行、`0` 丢写。

> **负责任披露说明**：本文所有截图与示例仅展示公开开源项目 `C4illin/ConvertX` 的只读静态分析流程；在真实审计中如遇尚未修补的安全问题，应依照目标仓库的 `SECURITY.md` 优先通过私有安全通道报告，不在公开文章中附带利用细节或载荷。

---

## 九、安装与接入

环境要求为 **Node.js ≥ 18**（支持 macOS / Linux / Windows）：

```bash
# 1. 全局安装（内置 CLI、Web 工作台与完整 Agent Skill）
npm install -g pinwhy

# 2. 初始化并打开工作台（Claude Code 可用一条 setup；其余宿主用 init + skill install）
pinwhy init --title "我的项目调研"
pinwhy skill install
pinwhy serve --open
```

也可以在支持 Agent Skill 的工具里，直接把下面这句话发给你的 Agent：

> 请阅读 `https://github.com/Fruit-Guardians/pinwhy` 的接入说明，为当前项目安装或复用 Pinwhy，按当前宿主配置完整 Skill 并打开工作台。保留已有记录，完成后告诉我访问地址。

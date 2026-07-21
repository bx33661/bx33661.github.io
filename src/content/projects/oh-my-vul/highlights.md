---
title: "Highlights"
description: "oh-my-vul 1.0 要点、技术栈与仓库链接。"
navLabel: "Highlights"
order: 50
draft: false
---

## 要点

- **Evidence-first**：finding 是 Evidence.v1 对象，不是一段漂亮总结  
- **开题再审计**：Campaign + 攻击面 select/seed，避免假说洪水  
- **双分数门禁**：`evidence_score` / `submission_score`，出报告看 **≥ 75** 与 confirmed  
- **三套状态分开**：Evidence 三态 · review verdict · archive reason  
- **复现门禁**：`/omv-repro` 记录人的观察，不替你伪造输出  
- **只读 TUI + 可写 CLI**：浏览不误触晋级  
- **CLI ↔ Skills 同版本**：`doctor` 查漂移，`setup --force` 修复  
- **被动研究边界**：公开元数据 / 本地授权复现；unknown 合法  

## Stack

| 部分 | 技术 |
|------|------|
| CLI / Contracts | TypeScript，Node.js 22+，YAML |
| TUI | React 19 + Ink |
| Agent 侧 | Claude Code Skills，Codex Skills（+ 可选 agents） |
| 辅助 | Python 3（Skill 脚本与报告渲染） |
| 分发 | npm `oh-my-vul`，bin：`omv` |

## 一句话

> 让 Agent 负责理解代码，让程序负责约束状态，让研究员保留最后的判断权。

## Links

- GitHub：<https://github.com/bx33661/oh-my-vul>  
- npm：<https://www.npmjs.com/package/oh-my-vul>  
- 设计长文：[oh-my-vul 1.0 设计与实践](/blog/oh-my-vul-1-0/)  
- 文档导航：[Overview](/projects/oh-my-vul/)

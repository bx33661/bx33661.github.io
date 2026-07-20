---
title: "Problem"
description: "PureAutoCodeQL 要加速的 CVE / CodeQL 研究瓶颈。"
navLabel: "Problem"
order: 10
draft: false
---

## 瓶颈

### 1. 查询门槛高

CodeQL 表达力强，但「从补丁直觉 → 可编译查询 → 有信号的 SARIF」迭代很慢，尤其在不熟悉的代码库上。

### 2. 链路碎片化

一次 CVE 研究常常跨：

- GHSA / NVD 描述  
- 补丁 diff  
- 源码导入与 DB 构建（C/C++ 还要 build 命令）  
- 跑查询  
- 读 SARIF、挑路径、写纪要  

工具和目录各管一段，上下文靠人脑粘合。

### 3. 多语言重复劳动

Java / Python / C·C++ 的 DB 构建与查询习惯不同，但研究问题（source、sink、是否可控）同构。缺少共享流水线时，每个语言都像重开一局。

### 4. 只有聊天、没有产物

LLM 可以直接「讲」一条利用链；没有 SARIF / 路径 JSON / summary 时，二次审计和交接成本很高。

## 目标

把「情报 → 查询 → 路径」收成**可跑、可存、可复查**的管道；LLM 加速草稿，静态分析给出可核对的路径集合。

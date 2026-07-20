---
title: "Usage"
description: "PureAutoCodeQL CLI / API 使用概念与前置条件。"
navLabel: "Usage"
order: 30
draft: false
---

## 前置

- Python 环境（项目使用 uv 管理时按其文档）  
- CodeQL CLI  
- 可用的 LLM API Key（按所选 provider）  
- 目标源码或可构建工程  

仓库与命令以 README 为准：

- <https://github.com/Fruit-Guardians/PureAutoCodeql>

## 概念用法

```bash
# 安装 / 同步依赖（示例）
uv sync

# CLI 入口（名称以 README 为准）
pure-auto-codeql --help
# 或
python Analyze.py --help
```

常见步骤：

1. **导入项目** — 目录 / zip / patch  
2. **创建 CodeQL DB** — 解释型语言与编译型语言参数不同  
3. **绑定 CVE / 情报** — 触发 intel → sink 阶段  
4. **生成并跑查询** — 查看失败则自动/半自动 fix 再跑  
5. **路径筛选** — 从 SARIF 得到优先查看的路径  
6. **导出 summary** — Markdown + JSON  

## API 模式（若启用）

本地 FastAPI + SSE 用于：

- 提交任务  
- 订阅进度  
- 拉取产物路径  

适合在前端或其它编排器里挂长任务。

## 实践建议

- 先在小仓库 / 已知 CVE 上打通全链路  
- C/C++ 把 build 命令写成可重复脚本  
- 把 LLM 输出当草稿：以 CodeQL 命中与人工审计为准  
- 保留 SARIF，便于换工具查看  

## 排障

| 现象 | 方向 |
|------|------|
| DB 创建失败 | 构建命令、CodeQL 版本、磁盘 |
| 查询编译失败 | 看生成 QL 与语言 pack |
| 空 SARIF | 假设是否过宽/过窄，或 DB 是否对应版本 |
| API 无进度 | SSE 连接、任务队列、日志 |

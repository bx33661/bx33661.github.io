---
title: "Claude Code使用记录&随笔"
description: "Claude Code使用记录&随笔"
date: 2025-08-25
tags:
  - "Claude Code"
  - "AI"
  - "工具"
  - "记录"
authors:
  - "bx"
draft: false             
slug: "claude-code"          
---
<meta name="referrer" content="no-referrer">

# Claude Code使用记录&随笔
最近在使用这些工具顺便记个随笔，方便自己使用

这种 cli 类型的工具使用逻辑都一样，gemini cli，qwen cli，cursor cli 同样适用

## 基本使用介绍
### 启动与模式
+ **交互模式（REPL）**：

```bash
claude
```

+ **非交互模式**：

```bash
claude -p "你的问题"
```

+ **帮助**：`claude -h`

### 常见用途
+ **代码问答**：`How does foo.py work?`
+ **修改文件**：`Update bar.ts to ...`
+ **修复报错**：`cargo build` 报错贴给 Claude
+ **运行命令**：输入 `/help` 查看支持
+ **执行 Bash**：`!ls`、`!git status`

### 常用命令
+ `/add-dir` 添加新目录
+ `/agents` 管理子代理（角色配置）
+ `/bashes` 管理后台 Bash shell
+ `/clear` 清除历史对话
+ `/compact` 清除历史但保留摘要
+ `/context` 查看上下文占用
+ `/cost` 查看当前会话成本
+ `/doctor` 检查 Claude Code 安装/配置
+ `/exit` 退出 REPL
+ `/export` 导出对话
+ `/help` 查看帮助
+ `/hooks` 管理工具钩子
+ `/ide` IDE 集成状态
+ `/init` 初始化 CLAUDE.md 文档
+ `/login` / `/logout` 登录/登出
+ `/mcp` 管理 MCP 服务
+ `/memory` 编辑 Claude 记忆文件
+ `/model` 设置 AI 模型
+ `/output-style` 设置输出样式
+ `/pr-comments` 获取 PR 评论
+ `/review` 审查 Pull Request
+ `/security-review` 审查当前分支安全性
+ `/status` 查看状态（版本/账户/工具）
+ `/upgrade` 升级 Max
+ `/vim` 切换 Vim 模式





## 使用 Claude Code
### 命令集成：
可以在 Claude 界面直接运行 `git`、`pytest` 等命令，Claude 会帮你解释结果。

+ 在 Claude 的交互窗口里输入：

```plain
!git status
```

Claude 会在后台帮你跑这个命令，把结果显示出来，并自动解释哪些文件有改动、当前分支状态如何。

+ 再比如：

```plain
!pytest
```

它会运行测试，输出通过/失败的详情，Claude 会告诉你**哪些测试失败、报错原因、可能的修复方案**。





### CLAUDE.md
 在 **Claude Code** 里，`CLAUDE.md` 是一个**项目文档文件**，相当于「Claude 的使用说明 + 项目上下文索引」。  



![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755959180745-af6b8b8d-930b-43fc-b8e6-a4aa3cbaeefb.png)





### 使用截图
具体效果

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755608969336-6b7d07a1-50a2-4024-b39d-1aa255da0302.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755608996146-ca87cc47-c2bb-4972-8546-485bbee8c1bd.png)

Todos

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755609154012-248352b9-0dd5-4b19-a11f-a634b222578f.png)

使用技巧

1. **提问代码逻辑**：直接问 _某文件/函数如何工作_。
2. **报错分析**：把构建或运行报错贴进去，Claude 会给修复方案。
3. **文件修改**：用自然语言描述需要修改的点，Claude 会生成 diff，确认后应用。
4. **命令集成**：可以在 Claude 界面直接运行 `git`、`pytest` 等命令，Claude 会帮你解释结果。
5. **多文件协作**：Claude 能跨文件追踪上下文，适合重构或做安全审查。



## 接入其他模型
采用那种覆盖环境变量的方式去修改 claude code 的模型，但是常规你得使用支持这个协议的

```python
# 当前对话
$env:ANTHROPIC_BASE_URL = "..."
$env:ANTHROPIC_AUTH_TOKEN="..."


# 永久设置
setx ANTHROPIC_BASE_URL "..."
setx ANTHROPIC_AUTH_TOKEN="..."
```



要不然就是采用 GitHub 上面接口代理

### 接入 GLM4.5
GLM4.5 是支持ANTHROPIC 协议的

```python
$env:ANTHROPIC_BASE_URL = "https://open.bigmodel.cn/api/anthropic"
$env:ANTHROPIC_AUTH_TOKEN="..."

setx ANTHROPIC_BASE_URL "https://open.bigmodel.cn/api/anthropic"
setx ANTHROPIC_AUTH_TOKEN="..."
```



### 接入 deepseek 
>  deepseek 有支持对应协议的
>

```python
$env:ANTHROPIC_BASE_URL= "https://api.deepseek.com/anthropic"
$env:ANTHROPIC_AUTH_TOKEN="sk-..."

setx ANTHROPIC_BASE_URL "https://api.deepseek.com/anthropic"
setx ANTHROPIC_AUTH_TOKEN "sk-..."
```





## 额外配置
### 使用 agent
> 这里有点差异
>

具体怎么去理解这个 claude code 里面的 agent

这里使用这个比较全面的项目

[GitHub - wshobson/agents: A collection of production-ready subagents for Claude Code](https://github.com/wshobson/agents?tab=readme-ov-file)

```plain
cd ~/.claude
git clone https://github.com/wshobson/agents.git
```

在命令/agent，可以看到已经加载成功了

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755956252776-1196993e-e4ae-4ccb-b89a-40db70c74477.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756472827518-3f453814-6987-49e1-941b-41ae9211191d.png)

可以看一下上面具体这个项目内容，内容如下

```plain
---
name: ai-engineer
description: Build LLM applications, RAG systems, and prompt pipelines. Implements vector search, agent orchestration, and AI API integrations. Use PROACTIVELY for LLM features, chatbots, or AI-powered applications.
model: opus
---

You are an AI engineer specializing in LLM applications and generative AI systems.

## Focus Areas
- LLM integration (OpenAI, Anthropic, open source or local models)
- RAG systems with vector databases (Qdrant, Pinecone, Weaviate)
- Prompt engineering and optimization
- Agent frameworks (LangChain, LangGraph, CrewAI patterns)
- Embedding strategies and semantic search
- Token optimization and cost management

## Approach
1. Start with simple prompts, iterate based on outputs
2. Implement fallbacks for AI service failures
3. Monitor token usage and costs
4. Use structured outputs (JSON mode, function calling)
5. Test with edge cases and adversarial inputs

## Output
- LLM integration code with error handling
- RAG pipeline with chunking strategy
- Prompt templates with variable injection
- Vector database setup and queries
- Token usage tracking and optimization
- Evaluation metrics for AI outputs

Focus on reliability and cost efficiency. Include prompt versioning and A/B testing.
```

其实可以看出来

整理 agent 就是

Agent = 角色设定 + 固定提示词 + 绑定模型

+ 角色设定：决定它以什么身份回答（比如 Java 专家、安全审计员、运维工程师）。
+ 固定提示词：相当于在后台自动加了一段 system prompt，你不用每次重复。
+ 绑定模型：指定 haiku / sonnet / opus，不同速度和推理能力。



在命令/agent，可以看到已经加载成功了

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755956252776-1196993e-e4ae-4ccb-b89a-40db70c74477.png)





### 使用 MCP
基本命令

```bash
/mcp # 打开面板（含鉴权、状态）
/mcp tools notion # 列出工具
/mcp prompts notion
/mcp resources notion
```

调用方式

```bash
# A. 自然语言
“用 notion 的工具列出我最近修改的页面，并帮我总结变化。”

# B. 显式调用
/mcp call notion <toolName> {"param":"value"}
```



三种格式

#### 本地 stdio
```bash
# 语法
claude mcp add <name> <command> [args...]

# 例：Airtable（带 env & npx）
claude mcp add airtable --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server
```

> `--` 之后是实际服务器命令，避免 CLI 标志冲突。
>

**Windows 提示**（原生非 WSL）：需要 `cmd /c` 包装 npx：

```bash
claude mcp add my-server -- cmd /c npx -y @some/package
```

#### 远程 SSE
```bash
# 语法
claude mcp add --transport sse <name> <url>
# 例：Linear
claude mcp add --transport sse linear https://mcp.linear.app/sse
# 自定义 Header（如 API-Key）
claude mcp add --transport sse private https://api.company.com/mcp \
  --header "X-API-Key: your-key"
```

#### 远程 HTTP
```bash
# 语法
claude mcp add --transport http <name> <url>
# 例：Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp
# Bearer Token
claude mcp add --transport http secure https://api.example.com/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

---



#### json 格式导入 mcp
基本语法

```plain
claude mcp add-json <name> '<json>'
```

+ `<name>`：你在 Claude 里给这个 MCP 起的名字
+ `<json>`：MCP 配置 JSON（注意要正确转义）



 示例如下

```bash
claude mcp add-json weather-api '{
  "type": "stdio",
  "command": "/path/to/weather-cli",
  "args": ["--api-key","abc123"],
  "env": {
    "CACHE_DIR": "/tmp"
  }
}'

```




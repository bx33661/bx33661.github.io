---
title: "MCP学习--Model Context Protocol"
author: "bx"
description: "MCP（Model Context Protocol）是由 Anthropic 于 2024 年 11 月推出的开源协议，旨在为大型语言模型（LLM）与外部工具、数据源之间建立统一、安全、标准化的通信接口。"
pubDatetime: 2025-08-10
tags:
  - "Anthropic"
  - "llm"
  - "ai"
  - "model context protocol"
draft: false              # 设为 true 则为草稿
slug: "mcp1"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# MCP 学习&实践--Model Context Protocol
## MCP 概念
> 比较官方的概念：
>

**MCP（Model Context Protocol）** 是由 Anthropic 于 2024 年 11 月推出的开源协议，旨在为大型语言模型（LLM）与外部工具、数据源之间建立统一、安全、标准化的通信接口。

它解决了传统集成中 “M × N” 的复杂问题，转变成更容易管理的 “M + N” 结构：各 LLM 客户端只需实现一次 MCP 客户端，各工具或数据源只需实现一次 MCP 服务端，简化了开发与维护成本。

MCP 可应用于：

+ 文件系统访问、数据库查询、API 调用等工具性操作；
+ 安全授予权限，确保用户掌控访问授权；
+ 支持 JSON-RPC 2.0 协议、客户端-服务器架构和能力协商机制 



图片来自： 

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755242123068-5449adf6-d661-46ed-abb2-b809ad42f081.png)



理解和学习一下核心概念

> 内容来自官方文档[https://modelcontextprotocol.io/docs/](https://modelcontextprotocol.io/docs/learn/architecture)
>

MCP 架构中的关键参与者是：

+ **MCP Host**: The AI application that coordinates and manages one or multiple MCP clients  
MCP 主机：协调和管理一个或多个 MCP 客户端的 AI 应用程序
+ **MCP Client**: A component that maintains a connection to an MCP server and obtains context from an MCP server for the MCP host to use  
MCP 客户端：保持与 MCP 服务器连接并从 MCP 服务器获取上下文供 MCP 主机使用的组件
+ **MCP Server**: A program that provides context to MCP clients  
MCP 服务器：为 MCP 客户端提供上下文的程序


### 消息格式
MCP 本质是一个用 JSON-RPC 2.0 作为通信协议的客户端-服务端系统：

+ Host（客户端） → 发 JSON-RPC 请求，调用 MCP Server 提供的 Tool
+ MCP Server（服务端） → 收到 JSON-RPC 请求后执行方法，并返回 JSON-RPC 响应

例子：MCP 请求一个 Tool：

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "city": "Haikou" }
  },
  "id": 1
}
```

MCP Server 响应：

```json
{
  "jsonrpc": "2.0",
  "result": {
    "temperature": 30,
    "condition": "Sunny"
  },
  "id": 1
}
```



### 传输
一些文章

[https://zhuanlan.zhihu.com/p/1920408556986954650](https://zhuanlan.zhihu.com/p/1920408556986954650)

| 维度 | STDIO | HTTP+SSE (旧版) | Streamable HTTP (新版) |
| --- | --- | --- | --- |
| 传输通道 | 进程间 stdin/stdout，JSON-RPC，消息以换行分隔且不得含嵌入换行。 | 两端点：SSE 用于服务器→客户端推送，HTTP POST 用于客户端→服务器发送。 | 单一 HTTP 端点（支持 POST/GET）；服务器可选择把响应升级为 SSE 流进行多条消息/通知推送。 |
| 连接模型 | 客户端启动服务器为子进程并用标准流通信。 | 持续 SSE 长连接，辅以独立 POST 端点，需维持稳定长连。 | 无需强制长连，按需升级为 SSE；可支持无状态（stateless）部署。 |
| 方向性 | 双向（通过 stdin/stdout 交换 JSON-RPC 请求/响应/通知）。 | “下行”靠 SSE，“上行”靠 POST；服务端通过 SSE 向客户端推送事件。 | 双向；POST 可触发流式响应（SSE），GET 也可单独打开 SSE 流以接收通知/请求。 |
| 流式能力 | 不涉及网络流式传输；进程内低延迟。 | 通过 SSE 长连接实现服务器到客户端的连续事件流。 | 原生支持“可流式”HTTP：按需升级为 SSE，既能一次性返回，也能持续推送多消息。 |
| 部署/基础设施 | 适合本地集成，客户端直接管理子进程生命周期。 | 需要保持可靠的长连接和独立端点管理。 | 纯 HTTP 实现，兼容标准 HTTP 基础设施与中间件；更易部署与扩展。 |
| 会话与状态 | 由宿主进程掌控；天然同进程上下文。 | 典型为长会话但连接中断难恢复。 | 支持会话 ID 与无状态服务器；可在断线后恢复或重建流。 |
| 安全要点 | 仅限本机进程间通信，攻击面小。 | 需妥善管理 SSE 端点与跨域/连接稳定性。 | 必须校验 Origin、建议仅绑定 localhost、本地需注意 DNS 重绑定风险与鉴权。 |
| 规范地位 | 强烈建议客户端尽可能支持。 | 旧版标准传输之一（2024-11-05），现已被替代。 | 当前标准传输，与 STDIO 并列；取代了原 HTTP+SSE 模式。 |








## Mcp 使用
基本逻辑就是利用 MCP 客户端，配置 MCP 服务器，启用然后让 AI 调用

基于 TypeScript 的服务器可直接通过 `**npx**` 使用：

```bash
npx -y @modelcontextprotocol/server-memory
```

基于 Python 的服务器可使用 `**uvx**`（推荐）或 `**pip**`：

```bash
# 使用 uvx
uvx mcp-server-git

# 使用 pip
pip install mcp-server-git
python -m mcp_server_git
```

给出几个示例，简单演示一下

### 图标生成
采用魔塔社区的一个“可视化图标-MCP-Server”的一个项目演示一下如何使用 MCP

官方 Github 地址：

[GitHub - antvis/mcp-server-chart: 🤖 A visualization mcp contains 25+ visual charts using @antvis. Using for chart generation and data analysis.](https://github.com/antvis/mcp-server-chart?tab=readme-ov-file#-usage)

魔塔社区地址：

[MCP - 可视化图表-MCP-Server](https://www.modelscope.cn/mcp/servers/@antvis/mcp-server-chart)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755238752525-308ac090-5504-4c96-9bb9-24fda2aa7824.png)

导入 json，创建 mcp 服务器，这个使用的是 npx

```json
{
  "mcpServers": {
    "mcp-server-chart": {
      "command": "npx",
      "args": [
        "-y",
        "@antv/mcp-server-chart"
      ]
    }
  }
}
```

1. Q：“帮我生成一个2023年各季度销售额的柱状图，数据如下：Q1: 120万，Q2: 150万，Q3: 180万，Q4: 200万”

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755238859342-87d80054-25fd-451d-965c-4e5b5d6c32a7.png)

图表如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755238922095-88fc3b0d-b332-4fe9-85c7-5135d7409fe4.png)

2. Q：帮我做个员工技能评估雷达图，包括：编程90分，设计70分，沟通85分，管理60分，创新80分

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755239354717-21b02033-30b6-4e5d-bebe-4b7ad91b7522.png)

3. Q:创建一个项目流程图，显示：需求分析→设计→开发→测试→部署的流程

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755239468138-25adc065-ef4b-4f15-ae4a-834921654fec.png)

整理来说效果还是十分不错的





### 智谱搜索 MCP 
尝试 智谱搜索 MCP 

:::info
这里采用 Cherry Studio

:::

MCP.so 文档

[MCP Servers](https://mcp.so/server/zhipu-web-search/BigModel?tab=content)

官方文档

[智谱AI开放平台](https://open.bigmodel.cn/marketplace/detail/10a0b27eb178)

配置如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1751183485459-94259d52-1734-4a8d-a21b-3bb9bbd01e37.png)

```plain
{
  "mcpServers": {
    "zhipu-web-search-sse": {
      "url": "https://open.bigmodel.cn/api/mcp/web_search/sse?Authorization={42cbd82f2de941c796a0c17c606f40d3.2SjOf60Nb6ycQ0Ct}"
    }
  }
}
```

其实不调用的话，是无法得到相应准确数据的

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1751183540482-0569ec2c-db4a-4ee2-815f-87a655099f36.png)

MCP 调用后

调用效果还是不错的，结果是可以

> 总决赛抢七大战的关键转折发生在首节，步行者核心球员**哈利伯顿在无对抗情况下右小腿跟腱受伤**，表情痛苦地退出比赛。这一伤病直接影响了比赛走势，雷霆队在下半场逐渐确立优势。

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1751183354031-0195b344-1699-4080-8cd5-87a05eaa4052.png)



## Mcp 开发
### 认识 UV
> uv 是 Astral 推出的超快 Python 包与项目管理工具，用 Rust 写的，目标是替代 pip/virtualenv/pip-tools/pipx/poetry 的大部分日常场景。
>

官网地址

[uv](https://docs.astral.sh/uv/)

具体下载如下，Windows 安装环境

```sql
iwr -useb https://astral.sh/uv/install.ps1 | iex

# 检测是否下载成功
uv --version     
uv 0.8.11 (f892276ac 2025-08-14)
```

基本使用

```python
# 安装依赖（根据 pyproject.toml 和 uv.lock）
uv sync

# 运行程序
uv run python main.py

#添加/删除依赖（会自动更新 pyproject.toml 与 uv.lock）
uv add requests
uv remove requests

# 固定/复现环境，严格按锁文件安装：
uv sync --frozen

# Python 版本（你的仓库已有 .python-version，uv 会按此安装/使用）
# 安装对应解释器：
uv python install
# 查看已装版本：
uv python list
```





### 天气 MCP
> 这个是比较经典的，直接通过官方给的示例学习一下
>

主要逻辑

```sql
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cherry        │◄──►│   MCP Server    │◄──►│  外部API服务     │
│   (客户端)       │    │  (你的代码)      │    │ (天气API等)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

两个工具

1. **获取天气警报** (`get_alerts`) - 获取美国各州的天气警报信息
2. **获取天气预报** (`get_forecast`) - 获取指定坐标的详细天气预报



创建一个`weather.py`

```sql
from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("weather")

# Constants
NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"

async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    """Format an alert feature into a readable string."""
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # First get the forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location."

    # Get the forecast URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # Only show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)

if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')
```

导入 MCP 客户端（这里使用 Cherry）

[GitHub - CherryHQ/cherry-studio: 🍒 Cherry Studio is a desktop client that supports for multiple LLM providers.](https://github.com/CherryHQ/cherry-studio)

```json
{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": [
        "--directory",
        "g:\\shared\\mcp-learn\\my-mcp-server",
        "run",
        "weather.py"
      ]
    }
  }
}
```

具体效果如下

当我询问“获取加利福尼亚州的天气警报”

```sql
{
  "params": {
    "state": "CA"
  },
  "response": {
    "content": [
      {
        "type": "text",
        "text": "\nEvent: Wind Advisory\nArea: Santa Barbara County Southwestern Coast; Santa Ynez Mountains Western Range\nSeverity: Moderate\nDescription: * WHAT...North to northwest winds 20 to 30 mph with gusts up to 45\nmph.\n\n* WHERE...Santa Barbara County Southwestern Coast and Santa Ynez\nMountains Western Range.\n\n* WHEN...Until 5 AM PDT Friday.\n\n* IMPACTS...Gusty winds will blow around unsecured objects. Tree\nlimbs could be blown down and a few power outages may result.\nInstructions: Winds this strong can make driving difficult, especially for high\nprofile vehicles. Use extra caution.\n"
      }
    ],
    "structuredContent": {
      "result": "\nEvent: Wind Advisory\nArea: Santa Barbara County Southwestern Coast; Santa Ynez Mountains Western Range\nSeverity: Moderate\nDescription: * WHAT...North to northwest winds 20 to 30 mph with gusts up to 45\nmph.\n\n* WHERE...Santa Barbara County Southwestern Coast and Santa Ynez\nMountains Western Range.\n\n* WHEN...Until 5 AM PDT Friday.\n\n* IMPACTS...Gusty winds will blow around unsecured objects. Tree\nlimbs could be blown down and a few power outages may result.\nInstructions: Winds this strong can make driving difficult, especially for high\nprofile vehicles. Use extra caution.\n"
    },
    "isError": false
  }
}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755235884599-90fd6562-5b0b-470a-9cdf-e28a01cd334a.png)

最后分析，官网文章是这样总结的

当你提出问题时：

1. client 将你的问题发送给 Claude
2. Claude 分析可用的 tools 并决定使用哪些 tool
3. client 通过 MCP server 执行选择的 tool
4. 结果被发回给 Claude
5. Claude 制定自然语言响应
6. 响应显示给你





## 参考文章&知识库
[Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

[Introduction - Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro)

[MCP 简介 - MCP 中文文档](https://mcp-docs.cn/introduction)


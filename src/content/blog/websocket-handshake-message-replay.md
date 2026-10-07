---
title: "WebSocket：从握手到消息重放"
description: "从 HTTP/1.1 升级握手、消息与帧的区别讲起，通过本地回显实验观察文本、二进制、连接关闭，以及 Yakit/Burp 中的消息编辑与重放。"
date: 2026-10-07
tags:
  - "Web"
  - "WebSocket"
  - "Python"
  - "JavaScript"
authors:
  - "bx"
draft: false
slug: "websocket-handshake-message-replay"
---

聊天、实时通知和协同编辑都需要页面及时收到新消息。WebSocket 为客户端和服务端提供了一条双向通信通道。理解这条通道，再看握手报文、消息记录和回显实验，抓包中的各个部分就容易对应起来。

## WebSocket 的通信方式

查询库存或提交表单时，客户端发起 HTTP 请求，服务端返回结果。聊天消息却可能随时由另一端产生，浏览器很难提前知道它的到达时间。客户端可以不断询问是否有更新，但这也会产生不少没有新内容的请求。

轮询、SSE 和 WebSocket 都能让页面持续获取更新，消息的传递方式各有不同。短轮询由客户端定时询问；SSE 保持一个 HTTP 事件流，让服务端持续向页面发送事件；WebSocket 在连接建立后，允许双方在同一条连接上主动发送消息，也支持同时进行双向传输，这就是全双工（full-duplex）。

![短轮询、SSE 与 WebSocket 的通信模式](/blog/websocket-handshake-message-replay/01-communication-patterns.png)

*图 1　短轮询通过重复请求获取更新，SSE 提供服务端到客户端的事件流，WebSocket 支持双向消息。图中的箭头不表示每次都新建 TCP 连接。*

两端都需要频繁发送消息时，WebSocket 的交互更直接。页面主要接收服务端推送时，也可以考虑 SSE，例如 LLM 回答的流式输出；客户端的其他操作仍可使用普通 HTTP 请求。

Socket、WebSocket 和 Socket.IO 也容易混淆。Socket 通常指编程中的套接字接口，WebSocket 是通信协议；Socket.IO 在底层传输之上定义了事件、确认和重连等机制，原生 `new WebSocket()` 客户端与 Socket.IO 服务端并不直接兼容。[Socket.IO 官方说明](https://socket.io/docs/v4/#what-socketio-is-not)

## 从 HTTP 握手到 WebSocket 消息

### 升级请求与响应

本文讨论常见的 HTTP/1.1 升级流程。客户端先建立底层连接，使用 `wss://` 时还会进行 TLS 握手，然后发送 HTTP 请求，要求将连接升级为 WebSocket。浏览器通常会在协议握手完成后触发 `open` 事件，页面代码可以从这个事件开始发送消息。[RFC 6455 §4](https://www.rfc-editor.org/rfc/rfc6455.html#section-4)

抓包截图中的请求带有 `Upgrade: websocket`、`Connection: Upgrade` 和 `Sec-WebSocket-Key` 等字段：

![WebSocket 的 HTTP 升级请求](/blog/websocket-handshake-message-replay/02-http-upgrade-request.png)

*图 2　浏览器发出的 HTTP/1.1 升级请求。*

服务端返回 `101 Switching Protocols`，表示同意切换协议。客户端还需要校验升级相关响应头、`Sec-WebSocket-Accept`，以及协商的子协议或扩展等内容；只看到 101 状态码，还不足以确认整个握手有效。[RFC 6455 §4.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-4.1)

![WebSocket 的 HTTP 升级响应](/blog/websocket-handshake-message-replay/03-http-upgrade-response.png)

*图 3　服务端的升级响应，状态码为 101。*

下面是一组简化的握手报文。示例 Key 固定，便于核对计算；真实客户端每次握手会生成一个随机的 16 字节值，再进行 Base64 编码。

```http
GET /socket HTTP/1.1
Host: app.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: AQIDBAUGBwgJCgsMDQ4PEA==
Origin: https://app.example.com
```

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: C/0nmHhBztSRGR1CwL6Tf4ZjwpY=
```

`Sec-WebSocket-Accept` 的计算使用请求中 Key 的字符串，与协议规定的 GUID 拼接后计算 SHA-1，再进行 Base64 编码。这里拼接的是 Key 字符串本身，不是 Base64 解码后的字节：

```text
Base64(SHA-1(Sec-WebSocket-Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))
```

这个值用于核对握手响应，与登录身份或房间权限无关。`Host` 指向连接目标；浏览器客户端的 `Origin` 表示发起连接的页面来源，服务端可据此检查来源。非浏览器客户端可以自行设置这个头，身份校验仍需要登录凭据等机制。[MDN 服务端指南](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#client_handshake_request)

![协议升级、业务认证与关闭握手的关系](/blog/websocket-handshake-message-replay/04-handshake-sequence.svg)

*图 4　灰色表示协议升级，蓝色表示应用认证与授权，青绿色表示关闭握手。图中的首条消息认证仅为示例，应用也可以在升级阶段检查凭据。握手与关闭流程参见 [RFC §4](https://www.rfc-editor.org/rfc/rfc6455.html#section-4) 和 [§5.5.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.5.1)。*

### 消息、帧与 TCP 字节流

连接建立后，页面代码处理的是消息，网络传输还涉及 WebSocket 帧和 TCP 字节流。一条消息可以拆成多个帧；一次 TCP 读取可能只得到半帧，也可能得到多帧，读取边界不一定与帧或消息边界对齐。这些解析和重组工作通常由 WebSocket 库或浏览器完成，浏览器的 `message` 事件交付完整消息。

![消息分片、控制帧与 TCP 读取边界](/blog/websocket-handshake-message-replay/05-message-frame-stream.png)

*图 5　一条文本消息被分成两个数据帧，中间可以插入 Ping 控制帧。TCP 读块和图形宽度仅为示意。分片与控制帧规则参见 [RFC §5.4](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.4) 和 [§5.5](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.5)。*

握手后的消息在 Yakit 中会按方向显示。工具对内容的识别标签可以辅助阅读，实际业务格式还需要结合消息内容和应用约定判断。

![Yakit 中的双向 WebSocket 消息记录](/blog/websocket-handshake-message-replay/06-bidirectional-message-history.png)

*图 6　客户端和服务端在同一条连接上的消息往来。*

文本消息使用 UTF-8 编码，二进制消息传递字节。讨论文本长度时，要区分 JavaScript 字符串长度与编码后的字节数。例如，`"中"` 占一个 UTF-16 码元，编码为 UTF-8 时占三个字节。服务端的字节数上限（例如 4096 字节）与聊天内容的字符数限制并不是同一回事。

浏览器已经处理了拆帧、掩码和分片重组，页面代码主要负责发送和接收消息。下文用本地回显服务观察这个过程；HTTP/2、HTTP/3 对 WebSocket 的承载方式可以另行阅读规范。

## 本地回显实验

### 启动回显服务

实验使用 Python 3.11 或更新版本，并将 `websockets` 固定为 `15.0.1`。服务只监听 `127.0.0.1:8765`，文本和二进制消息都原样回显，不解析业务字段。[websockets 15.0.1 服务端 API](https://websockets.readthedocs.io/en/15.0.1/reference/asyncio/server.html)

将下面的代码保存为 `echo_server.py`：

```python
"""Local text / binary WebSocket echo server (websockets 15.0.1)."""

import asyncio

from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed


async def echo(websocket):
    try:
        async for message in websocket:
            await websocket.send(message)
    except ConnectionClosed:
        # A disconnected client must not stop the listening server.
        pass


async def main():
    async with serve(echo, "127.0.0.1", 8765):
        print("LISTENING ws://127.0.0.1:8765/", flush=True)
        await asyncio.get_running_loop().create_future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        # asyncio.run cancels main; the context manager closes connections first.
        print("STOPPED", flush=True)
```

下面的终端命令适用于 macOS/Linux，在保存 `echo_server.py` 的目录执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install "websockets==15.0.1"
python echo_server.py
```

终端打印 `LISTENING ws://127.0.0.1:8765/` 后，保持这个服务运行。另开一个终端，在同一目录提供本地 HTTP 页面：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

`8000` 用于加载网页，`8765` 用于 WebSocket 通信。`http.server` 本身没有实现 WebSocket 回显。

### 发送文本消息

浏览器打开 `http://127.0.0.1:8000/`，在开发者工具 Console 中运行以下客户端。它会发送一条文本，收到回显后主动关闭。代码放在立即执行函数中，便于重复粘贴运行。

```javascript
(() => {
  const demoWs = new WebSocket("ws://127.0.0.1:8765/");
  console.log(`CONNECTING state=${demoWs.readyState}`);

  demoWs.addEventListener("open", () => {
    console.log(`OPEN state=${demoWs.readyState}`);
    demoWs.send("hello WebSocket");
    console.log("SENT hello WebSocket");
  });
  demoWs.addEventListener("message", (event) => {
    console.log(`RECEIVED ${event.data}`);
    demoWs.close(1000, "done");
    console.log(`CLOSING state=${demoWs.readyState}`);
  });
  demoWs.addEventListener("error", () => {
    console.log(`ERROR state=${demoWs.readyState}`);
  });
  demoWs.addEventListener("close", (event) => {
    console.log(`CLOSE code=${event.code} reason=${event.reason} wasClean=${event.wasClean} state=${demoWs.readyState}`);
  });
})();
```

正常运行时，日志顺序如下：

```text
CONNECTING state=0
OPEN state=1
SENT hello WebSocket
RECEIVED hello WebSocket
CLOSING state=2
CLOSE code=1000 reason=done wasClean=true state=3
```

文本和二进制示例收到回显后会自动关闭连接。后面的停服对照与消息修改实验，会另建一条保持打开的连接。

`CONNECTING` 和 `CLOSING` 是代码读取到的状态，浏览器触发的事件是 `open`、`message`、`error`、`close`。`send()` 会将数据放入发送缓冲区，日志中的 `SENT` 只表示这次调用已执行；本例收到 `RECEIVED`，才观察到回显结果。[MDN send()](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send)

### 发送二进制消息

保持服务运行，在同一本地页面的 Console 中执行以下代码。`binaryType = "arraybuffer"` 控制接收二进制消息时的数据形式，方便查看字节内容。

```javascript
(() => {
  const binaryWs = new WebSocket("ws://127.0.0.1:8765/");
  binaryWs.binaryType = "arraybuffer";
  binaryWs.addEventListener("open", () => {
    binaryWs.send(new Uint8Array([0, 1, 127, 255]));
  });
  binaryWs.addEventListener("message", (event) => {
    console.log(Array.from(new Uint8Array(event.data))); // [0, 1, 127, 255]
    binaryWs.close(1000, "done");
  });
  binaryWs.addEventListener("error", () => {
    console.log(`BINARY_ERROR state=${binaryWs.readyState}`);
  });
  binaryWs.addEventListener("close", (event) => {
    console.log(`BINARY_CLOSE code=${event.code} reason=${event.reason} wasClean=${event.wasClean} state=${binaryWs.readyState}`);
  });
})();
```

收到的数组应为 `[0, 1, 127, 255]`，随后会记录 `BINARY_CLOSE code=1000`。代码也会记录 `error` 和 `close` 事件，便于观察连接失败与关闭情况；`error` 是否出现取决于浏览器和故障方式。

`binaryType` 的默认值是 `"blob"`。将它改为 `"arraybuffer"` 不会改变文本消息的表示，文本消息仍然是字符串。[MDN binaryType](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType)

## 连接状态与异常关闭

`new WebSocket()` 开始建立连接，`readyState` 用于判断当前状态。发送业务消息前应检查连接处于 `OPEN`；在 `CONNECTING` 时调用 `send()` 会抛出 `InvalidStateError`。[MDN readyState](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState)、[send() 异常](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send#exceptions)

| 值 | 状态 | 含义 |
| --- | --- | --- |
| 0 | CONNECTING | 正在建立连接 |
| 1 | OPEN | 连接已打开，可以发送消息 |
| 2 | CLOSING | 正在关闭连接 |
| 3 | CLOSED | 连接已关闭，或建立连接失败 |

调用 `close(1000, "done")` 会发起关闭；正常情况下，双方通过 Close 帧完成关闭握手。`close` 事件的 `code` 是关闭码，`reason` 是关闭原因字符串，`wasClean` 表示连接是否干净地关闭。它描述的是连接关闭过程，不表示业务消息一定已处理完毕。[MDN CloseEvent](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent)

为了手动关闭连接或连续发送消息，先确认回显服务正在运行，再在 Console 中建立一条不会自动关闭的连接。这里将它保存到 `window.ws`，后续可以直接使用 `ws` 操作：

```javascript
(() => {
  const liveWs = new WebSocket("ws://127.0.0.1:8765/");
  window.ws = liveWs;
  liveWs.addEventListener("open", () => {
    console.log(`OPEN state=${liveWs.readyState}`);
  });
  liveWs.addEventListener("message", (event) => {
    console.log(`RECEIVED ${event.data}`);
  });
  liveWs.addEventListener("error", () => {
    console.log(`ERROR state=${liveWs.readyState}`);
  });
  liveWs.addEventListener("close", (event) => {
    console.log(`CLOSE code=${event.code} reason=${event.reason} wasClean=${event.wasClean} state=${liveWs.readyState}`);
  });
})();
```

以下三种情况分别测试。上一条连接关闭后，确认服务正在运行，再重新执行上面的连接代码；等到 `OPEN` 后执行对应操作：

| 操作 | 本例观察到的关闭日志 |
| --- | --- |
| 在 Console 执行 `ws.close(1000, "done")` | `code=1000 reason=done wasClean=true` |
| 在回显服务终端按一次 Ctrl+C | `code=1001 reason= wasClean=true` |
| 强制结束该实验服务进程 | `code=1006 reason= wasClean=false` |

`1000` 表示正常关闭，`1001` 表示端点正在离开，例如服务停机。这个 Python 示例在 Ctrl+C 时会退出异步上下文，先有序关闭连接，所以它与强制结束进程的结果不同。[RFC §7.4.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1)

`1006` 是用于本地报告异常断开的保留值：连接结束时没有收到 Close 控制帧。它并非对端在 Close 帧中发来的状态码；浏览器调用 `close(1006)` 会抛出 `InvalidAccessError`。[RFC §7.1.5](https://www.rfc-editor.org/rfc/rfc6455.html#section-7.1.5)、[MDN close() 异常](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close#exceptions)

上述日志在 Python 3.14.8、`websockets 15.0.1` 和 Chromium 中核对过。其他浏览器、库或故障方式的具体表现可能不同。服务未启动时，本例观察到 `error`，随后触发 `close`；`error` 事件本身不提供完整的网络诊断信息。

### 连接失败时检查什么

实验中常见的问题通常可以先从文件路径、依赖和端口定位：

| 现象 | 检查项 |
| --- | --- |
| 提示找不到 `websockets` | 是否激活了虚拟环境，安装依赖和运行服务是否使用同一个 Python |
| 启动时提示端口已被占用 | 是否已经运行了回显服务，或有其他进程监听 8765 |
| 网页能打开，WebSocket 连接失败 | 8000 的 HTTP 服务与 8765 的回显服务是否都在运行 |
| 抓包工具没有出现消息 | 浏览器流量是否经过工具代理，本地环回地址是否被代理设置绕过 |

可以同时查看 Console 关闭日志、浏览器 Network 面板和服务端终端。这个实验没有自动重连；实际应用可以在断开后延迟重试，并逐步增加间隔。新连接可能还需要重新认证、订阅房间或补取断开期间的消息。

## 抓包与消息重放

握手报文用于建立连接，后续消息承载应用数据。下面的 Yakit WebSocket Fuzzer 截图与本地实验来自不同连接，内容也不同，可以按相同层次阅读：

![Yakit WebSocket Fuzzer 中的消息编辑与记录](/blog/websocket-handshake-message-replay/07-websocket-fuzzer.png)

*图 7　左侧是升级响应和消息发送区，右侧是按方向排列的消息记录。*

图中的“你好”由客户端发出，又由服务端回显，两边都显示 6B，因为两个汉字的 UTF-8 编码共占 6 个字节。可见列表的首条记录来自服务端；静态截图只展示这些消息，并不说明完整的业务请求关系。

“客户端请求”“服务器响应”标签主要用于标示方向，WebSocket 消息并不要求逐条配对。文本或二进制类型属于传输表示，JSON 里的 `type`、`message` 或房间编号等字段属于应用约定，解读时应分别看待。

### 在同一条连接上修改消息

确认回显服务正在运行，重新执行上一节的连接代码。等到 `OPEN` 后，在同一个 Console 中先发送一条 JSON 文本：

```javascript
ws.send('{"type":"echo","message":"hello"}');
```

收到回显后，再将 `message` 改为 `hello-2`，沿用这条连接发送：

```javascript
ws.send('{"type":"echo","message":"hello-2"}');
```

这次回显的内容为：

```json
{"type":"echo","message":"hello-2"}
```

实验结束后，执行 `ws.close(1000, "done")` 关闭连接。

这说明两条消息到达了回显服务并原样返回。服务没有解析 `type`，所以这个结果没有展示业务字段的处理或权限判断；测试业务系统时，需要结合它自己的协议解释结果。

在 Burp Suite 中，可以从 `Proxy → WebSockets history` 选中消息并 `Send to Repeater`，编辑内容、选择发送方向，再发送和查看后续消息。在 Repeater 的消息记录中，还可以用 `Edit and resend` 再次编辑、发送。[Burp Repeater 文档](https://portswigger.net/burp/documentation/desktop/tools/repeater/websocket-messages)

在 Yakit 中，可以从 MITM 捕获的 WebSocket 连接进入 Fuzz，连接后在 WebSocket Fuzzer 的发送区编辑消息，再观察右侧记录。具体入口以所用版本为准。[Yakit 官方示例](https://www.yaklang.com/blog/websocket-fuzzer-testing/)

单条消息的编辑、重发适合观察一个字段的影响；Fuzz 可以进一步组合多组输入。记录结果时，应保留原消息、修改后的消息、发送方向、连接状态和实际反馈。时间上相邻的两条消息也可能是主动推送，不宜直接认作请求与响应。

## 几个容易混淆的地方

### ws、wss 与掩码

`ws://` 不提供 TLS 传输保护；`wss://` 使用 TLS，提供传输中的机密性与完整性保护。本文从本机 HTTP 页面连接本机 `ws://` 服务，正式的 HTTPS 页面通常应配合 `wss://`，避免混合内容问题。[RFC §10.6](https://www.rfc-editor.org/rfc/rfc6455.html#section-10.6)、[MDN 客户端指南](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#security_considerations)

客户端发送的帧需要掩码，服务端发送的帧不加掩码；使用 TLS 也不会免去客户端的掩码要求。掩码 key 随帧传输，接收端按规则就能还原数据，因此掩码没有加密保密的效果。[RFC §5.1](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.1)、[§5.3](https://www.rfc-editor.org/rfc/rfc6455.html#section-5.3)

### Ping/Pong 与业务心跳

WebSocket 定义了用于保活等用途的 Ping/Pong 控制帧。浏览器原生 WebSocket API 没有直接暴露这些控制帧的发送接口；`send("ping")` 发送的是文本消息，应用是否回复 `pong` 取决于业务约定。[WebSockets 标准](https://websockets.spec.whatwg.org/#ping-and-pong-frames)

本文的 Python 服务保留了库默认的协议 Ping/Pong 保活设置，页面没有额外业务心跳。需要在页面中主动判断连接是否仍可用时，可以约定业务心跳和超时处理，并与协议控制帧区分开。[websockets 保活说明](https://websockets.readthedocs.io/en/15.0.1/topics/keepalive.html)

### 消息格式与业务权限

JSON 是应用常见的一种消息格式，WebSocket 本身支持文本与二进制消息。回显服务传递普通字符串、JSON 文本和字节数组，未要求消息必须是 JSON。

协议握手通过之后，用户身份、可订阅的房间和可执行的操作仍由应用判断。来源校验、登录凭据校验和消息级授权处理不同的问题；业务操作应根据当前会话检查权限。[RFC §10.5](https://www.rfc-editor.org/rfc/rfc6455.html#section-10.5)

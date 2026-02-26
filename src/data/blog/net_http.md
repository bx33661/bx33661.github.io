---
title: "Go net/http 源码学习：Server 与 Client 视角"
author: "bx"
description: "从 Server 与 Client 两个视角梳理 Go net/http 的请求处理链路、路由分发与响应写回机制，结合源码理解关键设计。"
pubDatetime: 2026-02-26
tags:
  - "Go"
  - "net/http"
  - "源码分析"
  - "Web"
draft: false
slug: "go-net-http-source-analysis"
---

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771943787882-76177644-8587-49b7-b36b-2e3d0cec2ae5.png)

最近在高强度的 GoGoGoGo，来看看 net/http 这个包

我们主要从“Server” 和 “Client”两个视角出发

阅读源码中，我们发现服务端的 Core 就是围绕着“Handler”和“Server”展开

## Server 分析

先写一个最简单的 Web Server

```go
package main

import (
	"fmt"
	"net/http"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	name := query.Get("name")
	if name == "" {
		name = "Guest"
	}

	// 写入响应状态码（这里显式写了出来）
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Hello, %s!", name)
}

func main() {
	http.HandleFunc("/hello", helloHandler)
	fmt.Println("Listening on port 8080")
	// 启动监听
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}

```

我们顺藤摸瓜，以这个`ListenAndServe`为切入点，进入 `net/http/server.go` 文件

```go
// ListenAndServe listens on the TCP network address addr and then calls
// [Serve] with handler to handle requests on incoming connections.
// Accepted connections are configured to enable TCP keep-alives.
//
// The handler is typically nil, in which case [DefaultServeMux] is used.
//
// ListenAndServe always returns a non-nil error.
func ListenAndServe(addr string, handler Handler) error {
	server := &Server{Addr: addr, Handler: handler}
	return server.ListenAndServe()
}
```

只是一个包装函数，实例化一个结构体，然后调用 `server.ListenAndServe`,我们继续跟进

代码如下

```go
// ListenAndServe listens on the TCP network address s.Addr and then
// calls [Serve] to handle requests on incoming connections.
// Accepted connections are configured to enable TCP keep-alives.
//
// If s.Addr is blank, ":http" is used.
//
// ListenAndServe always returns a non-nil error. After [Server.Shutdown] or [Server.Close],
// the returned error is [ErrServerClosed].
func (s *Server) ListenAndServe() error {
    if s.shuttingDown() {
        return ErrServerClosed
    }
    addr := s.Addr
    if addr == "" {
        addr = ":http"
    }
    ln, err := net.Listen("tcp", addr)
    if err != nil {
        return err
    }
    return s.Serve(ln)
}
```

1. 调用了底层的 `net.Listen("tcp", addr)` 来开启操作系统的 TCP 端口监听
2. 获得`Listener`后，把这个它交给`Serve`方法

这就是网络层向 HTTP 应用层过渡的起点

ok，我们继续跟进

对于`func (srv *Server) Serve(l net.Listener) error`方法而言

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771936236518-f141e69e-27a8-498f-8747-038ef4168225.png)

重点关注就是这个无限循环，根据逻辑（忽略错误处理）我们可以简化成

```go
// 简化
for {
    rw, err := l.Accept() // 阻塞等待客户端建立 TCP 连接
    // ... 忽略错误处理 ...

    c := srv.newConn(rw)  // 将原始 TCP 连接包装成 http.conn 结构体
    // ...

    go c.serve(connCtx)   // 划重点：为每一个连接开启一个独立的 Goroutine！
}
```

这个模型其实就揭示了一个秘诀（大家常说的）**“每个 TCP 连接一个 Goroutine”，这就是 Go Web 服务的并发模型**

继续跟进`c.serve`,这个函数特别长，包含很多的状态管理和超时控制，我们目前没办法完全理解

关注核心节点，这里聚焦两个

1. **读取请求：**`**w, err := c.readRequest(ctx)**` 这里是解析 HTTP 协议的地方。它会把网络流里的字节（比如 `GET / HTTP/1.1...`）解析成你代码里用的 `*http.Request` 结构体。

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771937219288-e3548fa1-bb02-43fd-8d7c-94dbb1d4655c.png)

2. **转交处理器：**`**serverHandler{c.server}.ServeHTTP(w, w.req)**` 这是最激动人心的一步。底层框架处理完了所有的网络 I/O 和协议解析，现在要把它交回给你写的业务代码了。

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771937379722-752d64c9-a78b-45ac-961d-5cff707bb86c.png)

调用 `ServeHTTP`，我们看一下这段代码写了什么，具体如下

```go
func (sh serverHandler) ServeHTTP(rw ResponseWriter, req *Request) {
	handler := sh.srv.Handler
	if handler == nil {
		handler = DefaultServeMux
	}
	if !sh.srv.DisableGeneralOptionsHandler && req.RequestURI == "*" && req.Method == "OPTIONS" {
		handler = globalOptionsHandler{}
	}

	handler.ServeHTTP(rw, req)
}
```

我们继续往下看，现在核心转到 `ServeMux` 多路复用器---> 路由器，解决我一直以来的一个困惑

_当一个包含特定 URL（比如 _`_/_`_ 或 _`_/hello_`_）的请求到来时，Go 是如何精准地找到那个 _`_helloHandler_`_ 函数的_

\_\_

就像上面那段代码所描述的如果传的`Handler` 是`nil`的话就默认用`DefaultServeMux`

```go
// ServeHTTP dispatches the request to the handler whose
// pattern most closely matches the request URL.
func (mux *ServeMux) ServeHTTP(w ResponseWriter, r *Request) {
	if r.RequestURI == "*" {
		if r.ProtoAtLeast(1, 1) {
			w.Header().Set("Connection", "close")
		}
		w.WriteHeader(StatusBadRequest)
		return
	}
	var h Handler
	if use121 {
		h, _ = mux.mux121.findHandler(r)
	} else {
		h, r.Pattern, r.pat, r.matches = mux.findHandler(r)
	}
	h.ServeHTTP(w, r)
}
```

首先是一个对于`*`的判断

> `RequestURI == "*"` 对应的是 HTTP 里一种特殊形式的请求目标（asterisk-form），典型场景是：
>
> **OPTIONS \***：客户端/代理想询问“这台服务器整体支持哪些方法/能力”，不是针对某个具体路径。
>
> 有些坏请求/探测请求也会发 `*`。

Go 的处理策略是：把它当成 **Bad Request (400)**，并且在 HTTP/1.1+ 时提示关闭连接

其次,有一个跟以前不一样的点，我查了一下这个 mux121 的意思，具体发布在 Go 官方博客

[Go 1.22 Release Notes - The Go Programming Language](https://go.dev/doc/go1.22#enhanced_routing_patterns)

```go
if use121 {
    // 如果通过 GODEBUG 或 go.mod 指定了老版本行为，走旧版兼容逻辑
		h, _ = mux.mux121.findHandler(r)
	} else {
    // 1.22+的全新路由匹配逻辑
		h, r.Pattern, r.pat, r.matches = mux.findHandler(r)
	}
```

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771939513209-bbc808f8-06df-4b26-90fc-355b51c677f4.png)

> 在 Go 1.22 中，官方对 `net/http` 的路由做了一次**史诗级的增强**（终于原生支持了 HTTP 方法匹配和路径通配符，比如 `GET /users/{id}`）

我们这里不过多的阐述更新或者什么版本差异，我们抽象一下具体逻辑，如下

```go
// 1. 寻找对应的处理器
h, _ := mux.Handler(r)
// 2. 执行你的业务逻辑
h.ServeHTTP(w, r)
```

可以看出来`ServeMux` 本身也实现了 `Handler` 接口！

为什么这样讲，我们补充阅读时候的两个概念

1. Handler 接口

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771938688136-3b29acfb-3589-4ea1-8ac9-9f04374a0316.png)

<font style="color:rgb(31, 35, 40);">凡是实现了 </font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">ServeHTTP</font>`<font style="color:rgb(31, 35, 40);"> 方法的结构体，都叫 </font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">Handler</font>`

2. ServeMux，多路复用器，本质就是一张路由表

```go
type ServeMux struct {
	mu     sync.RWMutex
	tree   routingNode
	index  routingIndex
	mux121 serveMux121 // used only when GODEBUG=httpmuxgo121=1
}
```

它就像一个分发中心，拿到包裹后，找出该给谁，然后让那个人去处理

所以比较妙的一点就是

```go
请求进来
    ↓
net/http 底层: serverHandler.ServeHTTP()
    ↓
如果你没传 Handler，就用 DefaultServeMux
    ↓
DefaultServeMux.ServeHTTP()   ← ServeMux 自己是 Handler
    ↓
查路由表，找到注册的 /hello handler
    ↓
我们的 helloHandler.ServeHTTP() ← 真正执行业务逻辑
```

nice，现在很清晰有感觉吗

我们顺水推舟，看一下查找过程，追进`findHandler(r)`

```go
// Handler returns the handler to use for the given request,
// consulting r.Method, r.Host, and r.URL.Path. It always returns
// a non-nil handler. If the path is not in its canonical form, the
// handler will be an internally-generated handler that redirects
// to the canonical path. If the host contains a port, it is ignored
// when matching handlers.
//
// The path and host are used unchanged for CONNECT requests.
//
// Handler also returns the registered pattern that matches the
// request or, in the case of internally-generated redirects,
// the path that will match after following the redirect.
//
// If there is no registered handler that applies to the request,
// Handler returns a “page not found” or “method not supported”
// handler and an empty pattern.
//
// Handler does not modify its argument. In particular, it does not
// populate named path wildcards, so r.PathValue will always return
// the empty string.
func (mux *ServeMux) Handler(r *Request) (h Handler, pattern string) {
	if use121 {
		return mux.mux121.findHandler(r)
	}
	h, p, _, _ := mux.findHandler(r)
	return h, p
}

// findHandler finds a handler for a request.
// If there is a matching handler, it returns it and the pattern that matched.
// Otherwise it returns a Redirect or NotFound handler with the path that would match
// after the redirect.
func (mux *ServeMux) findHandler(r *Request) (h Handler, patStr string, _ *pattern, matches []string) {
	var n *routingNode
	host := r.URL.Host
	escapedPath := r.URL.EscapedPath()
	path := escapedPath
	// CONNECT requests are not canonicalized.
	if r.Method == "CONNECT" {
		// If r.URL.Path is /tree and its handler is not registered,
		// the /tree -> /tree/ redirect applies to CONNECT requests
		// but the path canonicalization does not.
		_, _, u := mux.matchOrRedirect(host, r.Method, path, r.URL)
		if u != nil {
			return RedirectHandler(u.String(), StatusTemporaryRedirect), u.Path, nil, nil
		}
		// Redo the match, this time with r.Host instead of r.URL.Host.
		// Pass a nil URL to skip the trailing-slash redirect logic.
		n, matches, _ = mux.matchOrRedirect(r.Host, r.Method, path, nil)
	} else {
		// All other requests have any port stripped and path cleaned
		// before passing to mux.handler.
		host = stripHostPort(r.Host)
		path = cleanPath(path)

		// If the given path is /tree and its handler is not registered,
		// redirect for /tree/.
		var u *url.URL
		n, matches, u = mux.matchOrRedirect(host, r.Method, path, r.URL)
		if u != nil {
			return RedirectHandler(u.String(), StatusTemporaryRedirect), n.pattern.String(), nil, nil
		}
		if path != escapedPath {
			// Redirect to cleaned path.
			patStr := ""
			if n != nil {
				patStr = n.pattern.String()
			}
			u := &url.URL{Path: path, RawQuery: r.URL.RawQuery}
			return RedirectHandler(u.String(), StatusTemporaryRedirect), patStr, nil, nil
		}
	}
	if n == nil {
		// We didn't find a match with the request method. To distinguish between
		// Not Found and Method Not Allowed, see if there is another pattern that
		// matches except for the method.
		allowedMethods := mux.matchingMethods(host, path)
		if len(allowedMethods) > 0 {
			return HandlerFunc(func(w ResponseWriter, r *Request) {
				w.Header().Set("Allow", strings.Join(allowedMethods, ", "))
				Error(w, StatusText(StatusMethodNotAllowed), StatusMethodNotAllowed)
			}), "", nil, nil
		}
		return NotFoundHandler(), "", nil, nil
	}
	return n.handler, n.pattern.String(), n.pattern, matches
}
```

很多特殊处理，整体逻辑就是分发

```go
接收请求 -> 找出最匹配的 Handler (h) -> 让这个 Handler 执行自己 (h.ServeHTTP)。
```

不过多学习分析，但是我们可以看一些平时没有注意到的处理

还有一点可以看到如何处理，是`404`还是`405`

```go
if n == nil {
    allowedMethods := mux.matchingMethods(host, path)
    if len(allowedMethods) > 0 {
        return HandlerFunc(func(w, r) {
            w.Header().Set("Allow", strings.Join(allowedMethods, ", "))
            Error(w, "...", 405)
        }), "", nil, nil
    }
    return NotFoundHandler(), "", nil, nil
}
```

_先用“当前方法”匹配，失败了并不立刻 404。_

_它会再查一遍：如果换个 method（比如 GET/POST）能匹配到同一路径吗？”_

_能：说明路径存在，只是 method 不允许 → \_\_405 Method Not Allowed_

_不能：才是真 404 Not Found_

还有一个就是`307`，这里说实话我不太清楚 307 是什么条件，查了一下

> 307 必须保持原 HTTP 方法不变

典型场景：

- 你注册了 `/tree/`
- 客户端请求 `/tree`

ServeMux 自动重定向到：

```plain
/tree/
```

返回：

```plain
307 Temporary Redirect
Location: /tree/
```

这里代码实现是

```go
n, matches, u = mux.matchOrRedirect(host, r.Method, path, r.URL)
if u != nil {
    return RedirectHandler(u.String(), StatusTemporaryRedirect), n.pattern.String(), nil, nil
}
```

`_matchOrRedirect_`_ 的语义基本是：_

_如果能直接匹配：返回 _`_n != nil_`

_如果“差一点就能匹配”，比如缺了尾斜杠 _`_/tree_`_ 但注册的是 _`_/tree/_`_：_

_返回一个建议 URL：_`_u != nil_`

_由外层统一返回 307 Temporary Redirect_

\_\_

Goooood，现在我们就可以看整个生命周期的最后一环---响应是如何写回的

我们在最开始的例子中写了一个`HelloHandler`，使用了 `w http.ResponseWriter` 来输出数据

```go
    // 写入响应状态码（这里显式写了出来）
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Hello, %s!", name)
```

我们尝试去搜索`type ResponseWriter interface`

```go
type ResponseWriter interface {

	Header() Header
	Write([]byte) (int, error)
	WriteHeader(statusCode int)
}
```

三个方法

- `Header() Header`：获取并设置响应头。
- `Write([]byte) (int, error)`：写入响应体数据。
- `WriteHeader(statusCode int)`：写入 HTTP 状态码

`responese` 结构体

<!-- 这是一张图片，ocr 内容为： -->

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771942141803-cd867808-abf4-42ca-bfcd-18a2ab725476.png)

这里关注这个几个量

```go
type response struct {
    conn         *conn          // TCP 连接
    req          *Request       // 本次请求
    wroteHeader  bool           // 状态码写了没？
    w            *bufio.Writer  // 缓冲区
}
```

然后看一个比较有趣的题目“<font style="color:rgb(31, 35, 40);">为什么 </font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">Write</font>`<font style="color:rgb(31, 35, 40);"> 之后再 </font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">WriteHeader</font>`<font style="color:rgb(31, 35, 40);"> 会失效？</font>”

可以看一下这里给出的解释

```go
情况一：正常顺序（没问题）
┌─────────────────────────────────────┐
│ w.WriteHeader(404)                  │
│   → wroteHeader = false             │
│   → 写入状态码 404                   │
│   → wroteHeader = true             │
│                                     │
│ w.Write(data)                       │
│   → wroteHeader 已经true         │
│   → 直接写数据，不再写状态码            │
└─────────────────────────────────────┘

情况二：先 Write 再 WriteHeader（出问题）
┌─────────────────────────────────────┐
│ w.Write(data)                       │
│   → wroteHeader == false            │
│   → 自动调用 WriteHeader(200) !!     │
│   → wroteHeader = true              │
│   → 写数据                           │
│                                     │
│ w.WriteHeader(404)  ← 你想改状态码    │
│   → wroteHeader 已经是 true !!       │
│   → 直接 return，忽略这次调用          │
│   → 客户端收到的还是 200，不是 404     │
└─────────────────────────────────────┘
```

所以我们这里能理解两个点

1. <font style="color:rgb(31, 35, 40);">不传 WriteHeader 也没事，</font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">Write</font>`<font style="color:rgb(31, 35, 40);"> 时会自动补 </font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">200 OK</font>`
2. <font style="color:rgb(31, 35, 40);">Header 必须在 Write 之前设置</font>

<font style="color:rgb(31, 35, 40);"></font>

<font style="color:rgb(31, 35, 40);"></font>

## <font style="color:rgb(31, 35, 40);">应用</font>

### 标准化输出响应

生成环境中，最常见的就是返回 JOSN 数据

```go
func responseHandler(w http.ResponseWriter, r *http.Request)  {
	respData := map[string]string{
		"status": "success",
		"message": "hello world",
	}
	// 设置 Content-Type 头
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(respData)
}
```

### 中间件 Middleware

中间件的本质：接收一个 Handler，包装一些逻辑后，返回一个新的 Handler

感觉这个设计模式是什么重要的，框架的扩展机制全部建立在中间件之上

在`net/http`包中，中间价的标准签名是这样的

```go
func Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 1. 在这里写：请求到达业务代码【前】的逻辑

        // 2. 将请求传递给下一层（或最终的业务代码）
        next.ServeHTTP(w, r)

        // 3. 在这里写：业务代码执行完毕【后】的逻辑
    })
}
```

一个很经典的场景，耗时统计中间件

```go
func TimeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 前置逻辑：记录开始时间
		start := time.Now()

		// 放行：让业务代码去执行
		next.ServeHTTP(w, r)

		// 后置逻辑：计算耗时并打印
		duration := time.Since(start)
		log.Printf("请求 %s %s 耗时: %v\n", r.Method, r.URL.Path, duration)
	})
}
```

还有一个就是，必用的鉴权

```go
// AuthMiddleware
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")

        // token wrong，out
        if token != "secret-token" {
            http.Error(w, "Unauthorized: 请提供有效的 Token", http.StatusUnauthorized)
            return
        }

        // Token right，pass
        next.ServeHTTP(w, r)
    })
}
```

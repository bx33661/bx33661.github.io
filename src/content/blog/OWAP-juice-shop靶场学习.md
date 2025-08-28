---
title: "OWAP-juice-shop靶场学习"
description: "OWAP Juice Shop 是一个用于学习和测试 Web 应用程序安全的开源项目。"
date: 2025-08-11
tags:
  - "靶场"
  - "OWASP Juice Shop"
  - "安全研究"
  - "前端安全"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "juice-shop"          # 随机URL字符串
---

<meta name="referrer" content="no-referrer">
# OWAP-juice-shop靶场学习
## 介绍
OWASP Juice Shop 是一个用于学习和测试 Web 应用程序安全的开源项目。它提供了一个真实的 Web 应用环境，模拟了一个在线商店的场景，包含了多个安全漏洞和攻击面。

OWASP Juice Shop是一个故意设计成不安全的Web应用程序，用于安全培训、意识提升和安全工具测试。它包含了 OWASP Top 10 中的所有漏洞类别以及许多其他安全缺陷。

这是一个现代的单页应用程序（SPA），使用流行的技术栈构建：
- 前端：Angular
- 后端：Node.js + Express
- 数据库：SQLite

Juice Shop 包含超过 100 个编码挑战，涵盖：
- 注入攻击
- 身份验证绕过
- 授权缺陷
- XSS（跨站脚本）
- CSRF（跨站请求伪造）
- 敏感数据暴露
- XML 外部实体（XXE）
- 不安全的反序列化
- 使用已知漏洞的组件
- 不充分的日志记录和监控

## 环境搭建
介绍页面

[OWASP Juice Shop | OWASP Foundation](https://owasp.org/www-project-juice-shop/)

github 官方地址

[juice-shop](https://github.com/juice-shop/juice-shop#from-sources)

首先需要安装 Docker，然后运行：

### Docker部署

1. Run `docker pull bkimminich/juice-shop`
2. Run `docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop`
3. Browse to [http://localhost:3000](http://localhost:3000/) (on macOS and Windows browse to [http://192.168.99.100:3000](http://192.168.99.100:3000/) if you are using docker-machine instead of the native docker installation)

### Node.js部署

或者使用 Node.js 直接运行：

访问 http://localhost:3000 即可开始使用。

在应用程序中，点击右上角的 "Score Board" 可以查看所有挑战。挑战按难度分为：
- ⭐ 简单
- ⭐⭐ 中等
- ⭐⭐⭐ 困难
- ⭐⭐⭐⭐ 专家
- ⭐⭐⭐⭐⭐ 大师



![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755055555371-f200e4d5-be75-49c6-95b2-ea6c138012cf.png)



## 漏洞分类与学习

### 注入攻击

#### SQL注入

在登录页面尝试SQL注入：

#### NoSQL注入

针对MongoDB的注入攻击：

## 一星问题
### 第一关找积分板
这个前端代码找到路由就找到了

```bash
http://127.0.0.1:3000/#/score-board
```



### XSS
**DOM XSS**

> 使用`<iframe src="javascript:alert(`xss`)">`代码进行基于_DOM_的XSS攻击
>

找到可疑地方，尝试执行，在搜索框内可以

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755055625089-953f106f-854a-49ab-a8a4-d71b711c9f54.png)

执行 XSS 发现是存在的，没有过滤









可以分析一下，直接利用 XSS 嵌入网页

 iframe 嵌入，后面就是一些播放器的参数

```bash
<iframe
    width="100%"
    height="166"
    scrolling="no"
    frameborder="no"
    allow="autoplay"
    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/771984076&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true">
</iframe>
```

还是一样的入口，XSS 嵌入效果如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755056100396-a9c77f93-7f42-4099-b779-0d1de1e00e21.png)





### 查阅机密文件
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755056427452-db027247-4942-4eaa-acfb-661f2f76a432.png)

访问链接

```bash
http://127.0.0.1:3000/ftp/legal.md
```

发现可能存在文件暴露，尝试如下，发现可以阅读更多文件

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755056413505-361b0119-c350-44bf-9a30-64fab8677bb4.png)

****

****

### Missing Encoding
> 获得Bjoern的猫"乱斗模式"照片。
>

这个问题在照片墙那里

图片不显示的原因是在 url 里面#是锚点的意思

```bash
<img src="/assets/public/images/uploads/ᓚᘏᗢ-#zatschi-#whoneedsfourlegs-1572600969477.jpg">
```

这里改成`%23`就解决问题了

刷新一下，猫猫就出来了

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755057229276-076028be-d48d-492c-aa3d-654c6a8cfe60.png)





### **Privacy Policy**






### Outdated Allowlist
> 让我们将您重定向到我们不再推广的加密货币地址
>

主要是找加密货币的地址

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755057840988-60b665a9-c0f3-4264-b256-bd2a3c0e929a.png)

这是前端的一个方法集，用来弹出一个对话框（二维码）展示不同加密货币的收款地址。

里面有三个：

1. **Bitcoin**  
地址：`1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm`  
重定向 URL：`./redirect?to=https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm`
2. **Dash**  
地址：`Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW`  
重定向 URL：`./redirect?to=https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW`
3. **Ether（以太坊）**  
地址：`0x0f933ab9fCAAA782D0279C300D73750e1311EAE6`  
重定向 URL：`./redirect?to=https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6`

进入 redirect 链接就可以完成这个挑战

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755058227513-afa7d652-253c-47c2-9989-758d2aa63242.png)





### Web3 Sandbox
> 查找意外部署的代码沙盒，用于即时编写智能合约。
>

还是简单的信息收集问题

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755062268393-553e8911-bfa3-4a37-95de-ca0711c9858e.png)

```plain
http://127.0.0.1:3000/#/web3-sandbox
```

界面如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755062456032-d041ff0f-1854-47d1-ba3f-80c0591bd6a9.png)





### Exposed Metrics
> 找出后端服务使用[常见监测软件](https://github.com/prometheus/prometheus)获得
>

找到对应的端点

```plain
http://127.0.0.1:3000/metrics
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755062707214-b89ef996-8617-4193-8dee-83b2797cdf85.png)



###   
</font>Bully Chatbot
> Receive a coupon code from the support chatbot
>

并非真正的智能，只是对应回复，尝试给出关键词

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755063088484-0998376d-68a9-45bb-878b-046d422adf68.png)

```plain
Oooookay, if you promise to stop nagging me here's a 10% coupon code for you: k#*Agh7ZKp
```









###   
</font>Privacy Policy
> Read our privacy policy.
>

这个题太一星了，直接访问就行

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755063186473-31ab6cfe-4d54-4f32-8609-44911c3ba7a7.png)

进来就成功

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755063220889-af90753c-d101-446d-9d0d-b09f8e376de7.png)



## Others
### 常见币种地址
> 信息收集来自于网络
>

**1. 比特币（BTC）**

+ 常见前缀：
    - `1` 开头（P2PKH 地址）
    - `3` 开头（P2SH 地址）
    - `bc1` 开头（Bech32 格式）
+ 字符集：大小写字母（不含 0、O、I、l）+ 数字
+ 长度：一般 26～42 个字符
+ 示例：

```plain
1BoatSLRHtKNngkdXEeobR76b53LETtpyT
3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
```

---

**2. 以太坊（ETH） / ERC-20 代币**

+ 前缀：`0x`
+ 字符集：16 进制（0-9, a-f）
+ 长度：0x + 40 个十六进制字符（共 42 个字符）
+ 示例：

```plain
0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

---

**3. 莱特币（LTC）**

+ 前缀：
    - `L` 开头（旧版）
    - `M` 开头（P2SH）
    - `ltc1` 开头（Bech32）
+ 长度：34 个字符左右
+ 示例：

```plain
LZ8hyM2sa7RnZkz6jfb7dZ9DyJzjjQuo9J
```

**4. USDT / TRON / BNB **

+ **USDT-TRC20（基于波场 TRON）**：
    - `T` 开头
    - 长度 34 个字符
    - 示例：

```plain
TRh5WwW1V5pD7KQbWQ2ikC69j3P9wKc2yC
```

+ **BNB（BEP20）**：
    - 与以太坊地址相同，`0x` 开头


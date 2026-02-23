---
title: "Burp杂项"
author: "bx"
description: "Burp杂项，更好的使用工具"
pubDatetime: 2024-09-21
tags:
  - "ctf"
  - "2025轩辕杯"
  - "wp"
  - "web"
draft: false              # 设为 true 则为草稿
slug: "k8burp"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">



# Burp杂项
Brupsuite官网：[https://portswigger.net](https://portswigger.net/burp)

**BP补充学习**Brupsuite工作原理技巧抓包杂项过滤快捷修改请求方式全局搜索(search)模块介绍Target模块利用bp漏洞扫描collaborator模块Decoder模块Comparer模块Organizer模块问题解决Bp光标不对

### Brupsuite工作原理
初始模式：本机127.0.0.1上开启了一个浏览器，浏览器访问某个网页时，会从一个随机端口发送流量出去。使用Burpsuite之后：本机127.0.0.1上开启了一个浏览器，在127.0.0.1:8083端口作为浏览器的代理。所有从本机浏览器上面发出的流量包都会经过代理（127.0.0.1:8083），所有回向本机浏览器的流量包也会经过代理（127.0.0.1:8083）。Burpsuite Listener则和代理（127.0.0.1:8083）是一个串联模式，Burpsuite Listener可以拦截所有通过代理的网络流量，主要是拦截HTTP和HTTPS协议的流量。通过拦截，Burpsuite可以以中间人的身份对客户端的请求数据、服务端的返回数据做各种的修改。

_一般情况下我们是不能获取明文可读的HTTPS包的，但是通过Brup这个中间人我们可以去抓取brup这个包_

## 技巧
+ Bp中一些路径配置需要使用全英路径

### 抓包杂项过滤
1. 利用ProxyOmage或者火狐proxy过滤简单的添加了几个比较常见的

```plain
*.firefox.com
 *.firfox.com.cn
 *.firefoxchina.cn
 *.google.com
 *.mozilla.org
 *.bitwarden.com
 *.qq.com
 *.bing.com
 *.baidu.com
 *.github.com
 *.cnblogs.com
 *.csdn.net
 *.gitee.com
```

HTTPS的证书信息直接通过浏览器查看![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868922865-be87c035-151c-4ec4-8b04-1568d1833a8c.png)

### 快捷修改请求方式
GET和POST请求快速切换

![]()

### 全局搜索(search)
可以查找bp中所有东西

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868923721-9c3510b4-a5b5-432b-a886-0319b807cb2e.png)

## 模块介绍
### Target模块
+ Site map

这站点地图，开启漏扫之后可以，自动爬取站点地图

可以大致看到网站结构

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868923600-2d7b83e0-a653-421b-ac1e-abd01f81038f.png)

+ Issue definitions

这里面就是漏洞仓库，提供bp被动扫描

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868922623-c6814da7-8e2b-4501-a5b2-b794bc61ad40.png)

+ Scope

算一个过滤功能

上面是添加希望看到的

下面是希望移除的

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868925190-72d5fa59-80ae-48c6-aa54-5ffc9605a18d.png)

### 利用bp漏洞扫描
只是作为了解bp，展示一下这个功能，但是实际使用不多

bp扫描的能力不是很强

采用测试站：[http://testphp.vulnweb.com/](http://testphp.vulnweb.com/)

在dashboard界面内新建一个扫描目标

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868925867-cca6c741-6a15-40a1-b88e-f716f0d4f66f.png)

填写扫描目标

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868926010-8b111b86-2fe4-48bc-9f68-b70585a343d5.png)

选择扫描方式，爬虫深度

一共四种选项，每一个时间不同，深度不同

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868926505-eb5e4935-00e1-40ef-b6b2-e4ca32015871.png)

具体结果在仪表盘

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868929318-027026e0-98d7-45ce-a4cd-fe8c27880d1a.png)

然后呢在Target模块的sitemap下的Crawl...

原本没有东西，但是我们主动扫描之后会发现，给出存在问题以及具体情况和url

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868931544-6a845ad2-15e1-4004-aef5-304e363eeb73.png)

### collaborator模块
BP的外带模块

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868928419-fd98f1bd-9eac-4455-8e80-0f40cb7c4b50.png)

如果使用可以先进行一个`run health check`

去检查一下功能是否

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868929377-b99e672c-f13d-4018-a88f-f83220baeb8d.png)

查看是否正常

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868931369-21df4766-eecd-4ae4-a3cc-b36695582697.png)

 utr96icgoeo2w5da3lvzprhs8jea20qp.oastify.com

我们就可以获得一个DNSlog

我们尝试访问一下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868932770-105711b4-f3a7-480e-acc1-faddcf4e0b4d.png)

回到模块界面

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868933812-56588339-c6dd-4035-91de-be3dfd0e63de.png)

### Decoder模块
编解码模块，可以使用常用的编码和解码

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868940123-a3771306-fa02-484f-becb-6cb00dc1763f.png)

### Comparer模块
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868938347-069aaa4f-2ae5-458a-bd8d-05903667b31b.png)

+ Words对比

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868933715-b97c4962-4a1b-4a80-9849-00dedaf8d5a0.png)

+ Bytes对比

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868934464-8ea65376-95a4-44d3-8738-5f3c82bd7433.png)

### Organizer模块
主要记录，比如说发现了什么，最后才需要记录统计，防止忘记先发到这个模块做一个记录

在Notes中可以写一些东西什么的

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868993074-a3620f55-9c17-4ecd-8821-b7ca6851d1e4.png)

## 问题解决
#### Bp光标不对
需要修改一个合适默认的字体

![](https://gitee.com/bx33661/image/raw/master/path/image-20250108120432707.png)
 


---
title: "Burp Suite Usage Notes"
description: "Burp Suite proxy interception, request filtering and modification, Target, Scanner, Collaborator, Decoder, Comparer, and common configuration issues."
date: 2024-09-21T00:00:00.000Z
tags:
  - "CTF"
  - "2025 Xuanyuan Cup"
  - "write-up"
  - "Web"
authors:
  - "bx"
draft: false
slug: "k8burp-en"
category: "Tool Notes"
lang: "en"
translationKey: "k8burp"
---

# Burp Miscellaneous Notes
Official Brupsuite website: [https://portswigger.net](https://portswigger.net/burp)

**Supplementary BP study:** Burpsuite operation principles, packet-capture tips, miscellaneous filtering, quick request-method changes, global search (search), module introductions, using the Target module, BP vulnerability scanning, Collaborator, Decoder, Comparer, Organizer, troubleshooting, and fixing the BP cursor.

### How Brupsuite Works
Initial setup: a browser runs on the local machine at 127.0.0.1. When it visits a webpage, it sends traffic from a random port. With Burpsuite, the browser on the local machine uses 127.0.0.1:8083 as its proxy. All traffic sent from the local browser passes through the proxy (127.0.0.1:8083), as does all traffic returning to it. The Burpsuite Listener is chained with the proxy (127.0.0.1:8083), and can intercept all network traffic passing through the proxy, mainly HTTP and HTTPS. As a man-in-the-middle, Burpsuite can modify client requests and server responses in various ways.

_Normally, we cannot obtain readable plaintext HTTPS packets, but using Brup as a man-in-the-middle lets us capture the packets._

## Tips
+ Some path settings in BP require paths containing only English characters.

### Miscellaneous Packet-Capture Filters
1. Use ProxyOmage or Firefox proxy filtering; a few common ones have been added.

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

HTTPS certificate information can be viewed directly in the browser![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868922865-be87c035-151c-4ec4-8b04-1568d1833a8c.png)

### Quickly Change the Request Method
Quickly switch between GET and POST requests.

### Global Search (search)
Search across everything in BP.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868923721-9c3510b4-a5b5-432b-a886-0319b807cb2e.png)

## Module Introduction
### Target Module
+ Site map

This is the site map. After enabling vulnerability scanning, it automatically crawls the site map.

You can get a general view of the website structure.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868923600-2d7b83e0-a653-421b-ac1e-abd01f81038f.png)

+ Issue definitions

This is the vulnerability repository, which provides passive BP scanning.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868922623-c6814da7-8e2b-4501-a5b2-b794bc61ad40.png)

+ Scope

This acts as a filter.

The section above is for adding items you want to see.

The section below is for removing items.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868925190-72d5fa59-80ae-48c6-aa54-5ffc9605a18d.png)

### Using BP Vulnerability Scanning
This is just an introduction to BP and a demonstration of this feature; it is not used much in practice.

BP's scanning capabilities are not very strong.

Use a test site: [http://testphp.vulnweb.com/](http://testphp.vulnweb.com/)

Create a scan target from the Dashboard.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868925867-cca6c741-6a15-40a1-b88e-f716f0d4f66f.png)

Enter the scan target.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868926010-8b111b86-2fe4-48bc-9f68-b70585a343d5.png)

Choose the scan method and crawler depth.

There are four options, each with a different duration and depth.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868926505-eb5e4935-00e1-40ef-b6b2-e4ca32015871.png)

The results appear on the dashboard.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868929318-027026e0-98d7-45ce-a4cd-fe8c27880d1a.png)

Then go to Crawl... under Site map in the Target module.

There was nothing initially, but after an active scan, it shows the problems found, their details, and URLs.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868931544-6a845ad2-15e1-4004-aef5-304e363eeb73.png)

### Collaborator Module
BP's out-of-band interaction module.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868928419-fd98f1bd-9eac-4455-8e80-0f40cb7c4b50.png)

To use it, first run a `run health check`.

Check whether the function is working.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868929377-b99e672c-f13d-4018-a88f-f83220baeb8d.png)

Check whether it is working properly.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868931369-21df4766-eecd-4ae4-a3cc-b36695582697.png)

utr96icgoeo2w5da3lvzprhs8jea20qp.oastify.com

We can obtain a DNS log.

Let's try visiting it.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868932770-105711b4-f3a7-480e-acc1-faddcf4e0b4d.png)

Return to the module interface.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868933812-56588339-c6dd-4035-91de-be3dfd0e63de.png)

### Decoder Module
Encoding and decoding module that supports common encodings and decodings.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868940123-a3771306-fa02-484f-becb-6cb00dc1763f.png)

### Comparer Module
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868938347-069aaa4f-2ae5-458a-bd8d-05903667b31b.png)

+ Compare Words

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868933715-b97c4962-4a1b-4a80-9849-00dedaf8d5a0.png)

+ Compare Bytes

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868934464-8ea65376-95a4-44d3-8738-5f3c82bd7433.png)

### Organizer Module
Primarily for taking notes—for example, recording findings and statistics at the end so you don't forget. First send notes to this module for recording.

You can write things in Notes.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1739868993074-a3620f55-9c17-4ecd-8821-b7ca6851d1e4.png)

## Troubleshooting
#### BP Cursor Looks Wrong
Change the default font to a suitable one.

![](https://gitee.com/bx33661/image/raw/master/path/image-20250108120432707.png)

For the connection between mini-program traffic capture and code analysis, see [Automated Security Auditing of WeChat Mini Programs in Practice](/blog/wechat-miniapp-security-audit/), which records how package decoding, API organization, identity matrices, and case reports relate to each other.

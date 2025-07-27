---
title: "TCP/IP-Core Protocols"
description: "TCP/IP-Core Protocols"
date: 2024-06-15
tags:
  - "TCP"
  - "学习分析"
  - "TryHackMe"
  - "web"
authors:
  - "bx"
draft: false         
slug: "bxtcp"          
---
<meta name="referrer" content="no-referrer">



# TCP/IP-Core Protocols

---

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746592688270-f34ca89d-5a07-45b2-8b1d-9b117e80e3a4.png)



先放一张 OSI 简化图

```plain
应用层         ← HTTP、FTP、SMTP、POP3、IMAP、DNS...
传输层         ← TCP 或 UDP
网络层         ← IP 协议（IP地址等）
链路层         ← 物理传输（网卡、Wi-Fi、电缆等）
```

## DNS

DNS 工作在应用层，即 ISO OSI 模型的第 7 层。DNS 流量默认使用 UDP 端口 53，并使用 TCP 端口 53 作为默认回退。有许多类型的 DNS 记录







## WHOIS

`whois` 是一个网络命令行工具，用于查询**域名注册信息**或**IP地址的归属信息**。它通过访问公共的 WHOIS 数据库，返回有关域名或 IP 的注册人、注册机构、注册时间、过期时间、DNS服务器等信息  

```c
sudo apt install whois       # Debian/Ubuntu
sudo yum install whois       # RHEL/CentOS
```

基本查询语法

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746593622148-bb8d419e-105c-44b6-9e6d-0f9a52e9ca09.png)

```c
whois [选项] [域名或IP地址]

# 查询域名注册信息
whois example.com

# 查询IP归属
whois 8.8.8.8
```

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746593606370-98d1499a-f963-4ac2-bcdc-7e669e54114a.png)

还有就是

- WHOIS 查询非实时，但信息更新较快。
- 使用频繁可能会被某些 WHOIS 服务器临时屏蔽。
- GDPR（欧盟数据保护法规）后，很多个人信息已被匿名化。

### 例子

比如说查询 x.com 是什么时候创建的

```c
whois x.com
```

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746593792064-ae4ff113-6c95-4d12-94af-ec0695aafff1.png)



## FTP

基本特性:

- **工作在 TCP 协议之上，默认端口为 21**
- 支持 **双向传输**：上传和下载
- 支持 **用户身份验证**
- 可运行在 **主动模式（PORT）** 或 **被动模式（PASV）**
- 支持文本和二进制两种传输模式



**命令如下**

| 命令           | 功能             |
| -------------- | ---------------- |
| `open`         | 连接 FTP 服务器  |
| `user`         | 输入用户名和密码 |
| `ls`           | 列出目录内容     |
| `cd`           | 切换目录         |
| `get`          | 下载文件         |
| `put`          | 上传文件         |
| `mget`         | 批量下载         |
| `bye` / `quit` | 退出连接         |



连接示例

```c
root@ip-10-10-82-248:~# ftp 10.10.64.101
Connected to 10.10.64.101.
220 (vsFTPd 3.0.5)
Name (10.10.64.101:root): anonymous
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 0        0            1480 Jun 27  2024 coffee.txt
-rw-r--r--    1 0        0              14 Jun 27  2024 flag.txt
-rw-r--r--    1 0        0            1595 Jun 27  2024 tea.txt
226 Directory send OK.
ftp> get flag.txt
local: flag.txt remote: flag.txt
200 PORT command successful. Consider using PASV.
150 Opening BINARY mode data connection for flag.txt (14 bytes).
226 Transfer complete.
14 bytes received in 0.00 secs (11.9929 kB/s)
ftp> !ls
'=2.5,!=2.5.0,!=2.5.2,!=2.6'   Downloads      Postman   thinclient_drives
 burp.json		       flag.txt       Rooms     Tools
 CTFBuilder		       Instructions   Scripts
 Desktop		       Pictures       snap
ftp> !cat flag.txt
THM{FAST-FTP}
```



### 流量分析

常见 FTP 命令定义（协议级别）

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746594995632-4afec1d2-1ef6-4b5f-a96f-3c5a70e25226.png)

| 命令   | 含义         |
| ------ | ------------ |
| `USER` | 指定用户名   |
| `PASS` | 指定密码     |
| `LIST` | 显示文件列表 |
| `RETR` | 下载文件     |
| `STOR` | 上传文件     |
| `DELE` | 删除文件     |
| `CWD`  | 改变当前目录 |
| `PWD`  | 显示当前目录 |
| `QUIT` | 关闭连接     |

------



| 协议 | 用途             | 典型端口     | 是否支持邮件接收 |
| ---- | ---------------- | ------------ | ---------------- |
| SMTP | 邮件发送         | 25, 587, 465 | 否               |
| POP3 | 邮件接收（下载） | 110, 995     | 是               |
| IMAP | 邮件接收（同步） | 143, 993     | 是               |

## SMTP

 SMTP（Simple Mail Transfer Protocol，简单邮件传输协议）是**电子邮件传输的核心协议**，用于在邮件客户端和服务器之间、或者服务器与服务器之间发送电子邮件。它定义了**邮件从发送方传送到接收方的规则和流程**。  



SMTP 的特点

- **只负责发送，不负责接收或存储邮件**（接收和存储通常由 POP3 或 IMAP 协议完成）
- **文本协议**，命令和响应都是基于ASCII的文本
- **可靠性高**，基于TCP传输

### SMTP通信

SMTP 主要就是分为**三个阶段**：

这里用 THM 的截图展示

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746606742567-89768d91-ad58-44fd-9cd3-5c42c0dc3376.png)

#### 1. 建立连接

- 客户端通过 TCP 连接到服务器（例如 port 25）
- 服务器返回一个 `220` 开头的欢迎消息

#### 2. 邮件传输

- 客户端和服务器通过一系列命令与响应完成邮件发送：

| 命令             | 含义                              |
| ---------------- | --------------------------------- |
| `HELO` 或 `EHLO` | 向服务器打招呼并表明身份          |
| `MAIL FROM:`     | 指定发件人邮箱地址                |
| `RCPT TO:`       | 指定收件人邮箱地址                |
| `DATA`           | 开始发送邮件正文，正文以 `.` 结尾 |
| `QUIT`           | 终止会话                          |

例如：

```python
C: HELO example.com
S: 250 Hello example.com
C: MAIL FROM:<alice@example.com>
S: 250 OK
C: RCPT TO:<bob@example.com>
S: 250 OK
C: DATA
S: 354 Start mail input; end with <CRLF>.<CRLF>
C: Subject: Hello
C: This is a test email.
    C: .
S: 250 OK
C: QUIT
S: 221 Bye
```

#### 3. 断开连接

- 邮件成功发送后，客户端发送 `QUIT`，服务器响应 `221`，关闭连接。



## POP3

 Post Office Protocol version 3

 是一个**用于接收电子邮件的应用层协议**，主要用于**从远程邮件服务器下载邮件到本地客户端**，通常与 SMTP 搭配使用。  



### telnet 连接示例

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746607853102-f099b6fa-6752-4604-9126-dfa51ceec42c.png)

```python
root@ip-10-10-106-239:~# telnet 10.10.224.227 110
Trying 10.10.224.227...
Connected to 10.10.224.227.
Escape character is '^]'.
+OK [XCLIENT] Dovecot (Ubuntu) ready.
USER linda
+OK
PASS Pa$$123
+OK Logged in.
STAT
+OK 4 2216
LIST
+OK 4 messages:
1 690
2 589
3 483
4 454
.
RETR 4
+OK 454 octets
Return-path: <user@client.thm>
Envelope-to: linda@server.thm
Delivery-date: Thu, 12 Sep 2024 20:12:42 +0000
Received: from [10.11.81.126] (helo=client.thm)
	by example.thm with smtp (Exim 4.95)
	(envelope-from <user@client.thm>)
	id 1soqAj-0007li-39
	for linda@server.thm;
	Thu, 12 Sep 2024 20:12:42 +0000
From: user@client.thm
To: linda@server.thm
Subject: Your Flag

Hello!
Here's your flag:
THM{TELNET_RETR_EMAIL}
Enjoy your journey!
```

题目如下

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746608436572-bf858b1d-6b57-4061-bfca-7774a43addbf.png)

### POP3 流程

POP3 的设计理念是：**邮件从服务器下载后即从服务器删除**（除非设置“保留副本”）。流程如下：

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746607447668-a297f770-db8d-4fc9-8a38-bbdad2e4701c.png)

#### 1. 建立连接

客户端（如 Outlook、Foxmail）连接邮件服务器的 POP3 服务端口。

#### 2. 用户认证

客户端发送用户名和密码进行身份验证。

#### 3. 操作邮箱

认证通过后，客户端可以使用以下 POP3 命令操作邮件：

| 命令   | 含义                         |
| ------ | ---------------------------- |
| `USER` | 发送用户名                   |
| `PASS` | 发送密码                     |
| `STAT` | 查询邮件数量和总大小         |
| `LIST` | 列出邮件列表及大小           |
| `RETR` | 下载邮件内容                 |
| `DELE` | 删除邮件（默认 POP3 会删除） |
| `QUIT` | 断开连接并删除已标记的邮件   |

#### 4. 下载与删除

客户端使用 `RETR` 下载邮件，再用 `DELE` 标记删除（服务器将在会话结束时真正删除）。

#### 5. 断开连接

客户端使用 `QUIT` 命令断开连接。





## IMAP



IMAP 与 POP3 的核心区别在于：

- POP3 是下载邮件（然后删除）
- IMAP 是在线访问邮件（服务器为主）

#### IMAP 的典型特征：

- 邮件保留在服务器上
- 支持多个文件夹（Inbox、Sent、Draft、Trash）
- 支持多客户端同步（手机、PC 同时管理）
- 可以选择只下载邮件头部（提高效率）

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746608739648-02d4001e-bf69-4560-9e26-6ce878f2096d.png)





IMAP 使用的是一种基于文本的命令/响应结构。每条命令以一个标识符（tag）开始，比如 `A001`。

| 命令           | 说明                         |
| -------------- | ---------------------------- |
| `LOGIN`        | 登录账户                     |
| `LIST`         | 查看邮箱文件夹列表           |
| `SELECT INBOX` | 选择某个文件夹（如收件箱）   |
| `FETCH`        | 获取邮件（可以只获取头部）   |
| `STORE`        | 修改邮件状态（如已读、删除） |
| `SEARCH`       | 搜索符合条件的邮件           |
| `LOGOUT`       | 注销并断开连接               |

#### 示例：

```plain
A001 LOGIN yourusername yourpassword
A002 SELECT INBOX
A003 FETCH 1 BODY[HEADER]
A004 LOGOUT
```



回答问题

```plain
FETCH 4 body[]
```

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746608899932-96472362-806a-4858-8eba-4ddfd79558ac.png)







## 思考🤔

| **Protocol**  **协议** | **Transport Protocol**  **传输协议** | **Default Port Number**  **默认端口号** |
| ---------------------- | ------------------------------------ | --------------------------------------- |
| TELNET                 | TCP                                  | 23                                      |
| DNS                    | UDP or TCP  UDP 或 TCP               | 53                                      |
| HTTP                   | TCP                                  | 80                                      |
| HTTPS                  | TCP                                  | 443                                     |
| FTP                    | TCP                                  | 21                                      |
| SMTP                   | TCP                                  | 25                                      |
| POP3                   | TCP                                  | 110                                     |
| IMAP                   | TCP                                  | 143                                     |



浅显地理解

| 协议              | 使用 TCP 的原因                            |
| ----------------- | ------------------------------------------ |
| HTTP              | 数据必须完整、可靠，不能丢                 |
| FTP               | 文件传输要求高可靠性                       |
| SMTP/POP3/IMAP    | 邮件不能丢失或乱序                         |
| DNS（多数用 UDP） | 查询速度快，偶尔丢失可重发，不要求建立连接 |



## others

### ❌`telnet`命令不可用

- Windows 用户可能需要启用 telnet：

- 控制面板 → 程序和功能 → 启用或关闭 Windows 功能 → 勾选 “Telnet客户端”

- Linux 用户可以使用：

```bash
sudo apt install telnet
```



![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1746609090370-5d68fc94-7f42-44d9-8512-627ecb107342.png)

### 参考

https://medium.com/@nikhilbwr34/tryhackme-networking-core-protocols-cyber-security-101-thm-c30318b3d103#id_token=eyJhbGciOiJSUzI1NiIsImtpZCI6IjA3YjgwYTM2NTQyODUyNWY4YmY3Y2QwODQ2ZDc0YThlZTRlZjM2MjUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyMTYyOTYwMzU4MzQtazFrNnFlMDYwczJ0cDJhMmphbTRsamRjbXMwMHN0dGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMTYyOTYwMzU4MzQtazFrNnFlMDYwczJ0cDJhMmphbTRsamRjbXMwMHN0dGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDU2NTY0ODQ1NTIwMzMwMTEzNjUiLCJlbWFpbCI6ImJ4MzM2NjFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5iZiI6MTc0NjU5Mzc4NSwibmFtZSI6ImJ4IGtpbmciLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSXJnNElmWC1sTmdUcldPTmtFdEM1SDkxSUdkdzhRQXhpXzh0eDlBOUhxLWRwODRDS0o9czk2LWMiLCJnaXZlbl9uYW1lIjoiYngiLCJmYW1pbHlfbmFtZSI6ImtpbmciLCJpYXQiOjE3NDY1OTQwODUsImV4cCI6MTc0NjU5NzY4NSwianRpIjoiMTM1MTg0ZDA2NWEyNGU4ZDlkODc3ZjZkZDZmZTkxMDhiYjI3ZmU1OCJ9.m3R0waCPNoX03tQ0pVBD8aY5P4j36qh44K2fat0ZIE3C34rO6_5wvbhKZB6uuTmX-3p3gGEwLokUDSEAe0AQaijoN87pHQZ1J5Yenfd6DjAyBIJxmlyYdPHbn4dASIlH5-I5iCfXgdV-BjiXe459skjSAXRH9D7Q_3o3o-bGTI_wAWvlIZkCu_OI_yVjaPJl1B-kJcGnTXpd3FEk-7jMQCrP_EDL6Ezll3WPKEPpyUJ_wBpuvUbukMr_jYZSy8fdaJxqBDXkkTZL4XVqglHgiSDwBo354cTiTCVxybr1lJuY6p2Ow6xePr8VZk4h_1zSElUd9nxwPFtIg5jFx_FHgw
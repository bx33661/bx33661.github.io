---
title: "OWASP Juice Shop Lab Walkthrough and Vulnerability Exercises"
description: "Deploying OWASP Juice Shop with Docker and Node.js and practicing one-star challenges involving the score board, XSS, sensitive files, and encoding, plus SQL and NoSQL injection."
date: 2025-08-11T00:00:00.000Z
tags:
  - "Security Lab"
  - "OWASP Juice Shop"
  - "Security Research"
  - "Frontend Security"
authors:
  - "bx"
draft: false
slug: "juice-shop-en"
lang: "en"
translationKey: "juice-shop"
---

# Studying the OWASP Juice Shop Lab
## Introduction
OWASP Juice Shop is an open-source project for learning and testing web application security. It provides a realistic web application environment simulating an online store, with multiple security vulnerabilities and attack surfaces.

OWASP Juice Shop is an intentionally insecure web application for security training, awareness, and testing security tools. It contains all vulnerability categories in the OWASP Top 10 as well as many other security flaws.

It is a modern single-page application (SPA) built with a popular technology stack:
- Front end: Angular
- Back end: Node.js + Express
- Database: SQLite

Juice Shop includes more than 100 coding challenges covering:
- Injection attacks
- Authentication bypass
- Authorization flaws
- XSS (cross-site scripting)
- CSRF (cross-site request forgery)
- Sensitive data exposure
- XML external entities (XXE)
- Insecure deserialization
- Components with known vulnerabilities
- Insufficient logging and monitoring

## Environment Setup
Introduction page

[OWASP Juice Shop | OWASP Foundation](https://owasp.org/www-project-juice-shop/)

Official GitHub address

[juice-shop](https://github.com/juice-shop/juice-shop#from-sources)

First install Docker, then run:

### Docker Deployment

1. Run `docker pull bkimminich/juice-shop`
2. Run `docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop`
3. Browse to [http://localhost:3000](http://localhost:3000/) (on macOS and Windows, browse to [http://192.168.99.100:3000](http://192.168.99.100:3000/) if you are using docker-machine instead of the native Docker installation)

### Node.js Deployment

Alternatively, run it directly with Node.js:

Visit http://localhost:3000 to get started.

In the application, click “Score Board” in the upper-right corner to view all challenges. Challenges are grouped by difficulty:
- ⭐ Easy
- ⭐⭐ Medium
- ⭐⭐⭐ Hard
- ⭐⭐⭐⭐ Expert
- ⭐⭐⭐⭐⭐ Master

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755055555371-f200e4d5-be75-49c6-95b2-ea6c138012cf.png)

## Vulnerability Categories and Learning

### Injection Attacks

#### SQL Injection

Try SQL injection on the login page:

#### NoSQL Injection

An injection attack against MongoDB:

## One-Star Challenges
### First Challenge: Find the Score Board
Finding the route in the frontend code is enough.

```bash
http://127.0.0.1:3000/#/score-board
```

### XSS
**DOM XSS**

> Use the `<iframe src="javascript:alert(`xss`)">` code to perform a _DOM_-based XSS attack.
>

Find a suspicious location and try executing it; the search box works.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755055625089-953f106f-854a-49ab-a8a4-d71b711c9f54.png)

We find that XSS is present and not filtered.

We can analyze it and directly use XSS to embed a web page.

Use an iframe embed; the rest are some player parameters.

```bash
<iframe
    width="100%"
    height="166"
    scrolling="no"
    frameborder="no"
    allow="autoplay"
    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/771984076&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true">
</iframe>
```

Use the same entry point; the XSS embedding result is as follows.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755056100396-a9c77f93-7f42-4099-b779-0d1de1e00e21.png)

### Read Confidential Documents
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755056427452-db027247-4942-4eaa-acfb-661f2f76a432.png)

Visit the link.

```bash
http://127.0.0.1:3000/ftp/legal.md
```

This may expose files. Try the following; it turns out more files can be read.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755056413505-361b0119-c350-44bf-9a30-64fab8677bb4.png)

****

****

### Missing Encoding
> Obtain a photo of Bjoern's cat in “War mode.”
>

This challenge is on the photo wall.

The image does not display because # in the URL denotes an anchor.

```bash
<img src="/assets/public/images/uploads/ᓚᘏᗢ-#zatschi-#whoneedsfourlegs-1572600969477.jpg">
```

Changing it to `%23` solves the issue.

Refresh, and the cat appears.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755057229276-076028be-d48d-492c-aa3d-654c6a8cfe60.png)

### **Privacy Policy**

### Outdated Allowlist
> Redirect us to a cryptocurrency address that we no longer promote.
>

The main task is to find the cryptocurrency address.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755057840988-60b665a9-c0f3-4264-b256-bd2a3c0e929a.png)

This is a frontend method collection that displays different cryptocurrency payment addresses in a dialog (QR code).

There are three:

1. **Bitcoin**  
Address: `1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm`  
Redirect URL: `./redirect?to=https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm`
2. **Dash**  
Address: `Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW`  
Redirect URL: `./redirect?to=https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW`
3. **Ether (Ethereum)**  
Address: `0x0f933ab9fCAAA782D0279C300D73750e1311EAE6`  
Redirect URL: `./redirect?to=https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6`

Visit the redirect link to complete the challenge.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755058227513-afa7d652-253c-47c2-9989-758d2aa63242.png)

### Web3 Sandbox
> Find the accidentally deployed code sandbox for writing smart contracts instantly.
>

This is another simple information-gathering challenge.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755062268393-553e8911-bfa3-4a37-95de-ca0711c9858e.png)

```plain
http://127.0.0.1:3000/#/web3-sandbox
```

The interface is as follows.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755062456032-d041ff0f-1854-47d1-ba3f-80c0591bd6a9.png)

### Exposed Metrics
> Find the [common monitoring software](https://github.com/prometheus/prometheus) used by the backend service.
>

Find the corresponding endpoint.

```plain
http://127.0.0.1:3000/metrics
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755062707214-b89ef996-8617-4193-8dee-83b2797cdf85.png)

### Bully Chatbot
> Receive a coupon code from the support chatbot.
>

It is not truly intelligent; it only gives corresponding replies. Try providing keywords.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755063088484-0998376d-68a9-45bb-878b-046d422adf68.png)

```plain
Oooookay, if you promise to stop nagging me here's a 10% coupon code for you: k#*Agh7ZKp
```

### Privacy Policy
> Read our privacy policy.
>

This challenge is so one-star; just visit the page.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755063186473-31ab6cfe-4d54-4f32-8609-44911c3ba7a7.png)

It is completed as soon as you enter.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1755063220889-af90753c-d101-446d-9d0d-b09f8e376de7.png)

## Others
### Common Cryptocurrency Address Formats
> Information gathered from the internet.
>

**1. Bitcoin (BTC)**

+ Common prefixes:
    - `1` prefix (P2PKH address)
    - `3` prefix (P2SH address)
    - `bc1` prefix (Bech32 format)
+ Character set: uppercase and lowercase letters (excluding 0, O, I, l) plus digits
+ Length: generally 26–42 characters
+ Example:

```plain
1BoatSLRHtKNngkdXEeobR76b53LETtpyT
3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
```

---

**2. Ethereum (ETH) / ERC-20 Tokens**

+ Prefix: `0x`
+ Character set: hexadecimal (0-9, a-f)
+ Length: 0x plus 40 hexadecimal characters (42 characters total)
+ Example:

```plain
0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

---

**3. Litecoin (LTC)**

+ Prefixes:
    - `L` prefix (legacy)
    - `M` prefix (P2SH)
    - `ltc1` prefix (Bech32)
+ Length: about 34 characters
+ Example:

```plain
LZ8hyM2sa7RnZkz6jfb7dZ9DyJzjjQuo9J
```

**4. USDT / TRON / BNB **

+ **USDT-TRC20 (based on TRON)**:
    - `T` prefix
    - Length: 34 characters
    - Example:

```plain
TRh5WwW1V5pD7KQbWQ2ikC69j3P9wKc2yC
```

+ **BNB (BEP20)**:
    - Same as Ethereum addresses, with the `0x` prefix


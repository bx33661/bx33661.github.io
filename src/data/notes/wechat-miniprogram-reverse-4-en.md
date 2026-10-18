---
title: "WeChat 4.0 Miniapp Reverse Engineering: Unpacking, Decompiling, Deobfuscating"
description: "WeChat 4.0 miniapp reverse-engineering notes: new storage paths, package extraction, decompilation, deobfuscation, and tool usage."
date: 2025-09-29T00:00:00.000Z
category: "Personal Notes"
tags:
  - "Mini Program"
  - "Deobfuscation"
  - "Security Research"
authors:
  - "bx33661"
draft: false
slug: "wechat-miniprogram-reverse-4-en"
lang: "en"
translationKey: "wechat-miniprogram-reverse-4"
---
<meta name="referrer" content="no-referrer">

# WeChat 4.0 Mini Program Reverse Engineering
The main changes are that the new version of WeChat uses a different storage layout, with some differences in encryption and other details.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1759145993916-b64b1932-aebb-4ac4-ac25-a80af8dfffcd.png)

We still use this project.

Unpack → decompile → deobfuscate

[https://github.com/strengthen/AppletReverseTool](https://github.com/strengthen/AppletReverseTool)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1759145999600-fe375548-0c6f-4d91-ae85-9eb3616745e4.png)

The specific package:

```python
C:\Users\bx336\AppData\Roaming\Tencent\xwechat\radium\Applet\packages
```

Alternatively, if you have tools such as Everthing, search for `wxapkg`.

Find the one matching the time sequence.

For decompilation, use the script in this project as well; it is based on Node.

```python
npm install
```

The main thing is to determine whether it is a main package alone or includes subpackages.

```python
./bingo.bat testpkg/master-xxx.wxapkg
```

To unpack subpackages, you need this:

```python
./bingo.bat testpkg/sub-1-xxx.wxapkg -s=../master-xxx
```

For deobfuscation, apply it to the main files.

Use a large language model to decode it.

I'll make a Dify workflow later.


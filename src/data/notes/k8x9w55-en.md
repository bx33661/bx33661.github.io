---
title: "Next.js CVE-2025-29927 Reproduction Notes"
description: "Next.js CVE-2025-29927 in Vulhub: how x-middleware-subrequest affects middleware authorization, with an initial analysis of the mechanism."
date: 2024-01-15T00:00:00.000Z
tags:
  - "CTF"
  - "Web Security"
  - "Security Research"
  - "Next.js"
authors:
  - "bx"
draft: false
slug: "k8x9w55-en"
category: "Vulnerability Reproduction"
lang: "en"
translationKey: "k8x9w55"
---


## A Brief Introduction to Next.js

I see many blogs and other sites using Next.js.

Next.js is an open-source frontend development framework based on React, used to build modern web applications, especially applications using server-side rendering (SSR) and static site generation (SSG). It is developed and maintained by Vercel (formerly Zeit).

Next.js backend services can indeed run in two modes: **Node.js Runtime** and **Edge Runtime**.

### Edge computing

Here, let's take a closer look at **Edge Functions (edge functions / edge computing)**.

An Edge Function is a small function that runs on a server closer to the user. It responds quickly with low latency and is suited to providing the “first response” to a request.

> Edge computing is a distributed-computing paradigm. It **pushes** computation and data storage closer to where they are needed — the **source of data generation** or the **end user**. This contrasts with traditional centralized cloud computing, where all data is sent to a distant, large data center for processing.

| Platform | Product name |
| --- | --- |
| Vercel | Edge Functions |
| Cloudflare | Workers |
| Netlify | Edge Functions |
| AWS | Lambda@Edge |
| Deno | Deno Deploy |
| Bun | Bun Edge Runtime (experimental) |

****

## Vulnerability reproduction

### Reproducing the environment

> Versions earlier than Next.js 14.2.25 and 15.2.3 are affected.

I reproduced it here using a Vulhub environment.

[vulhub/next.js/CVE-2025-29927 at master · vulhub/vulhub](https://github.com/vulhub/vulhub/tree/master/next.js/CVE-2025-29927)

The environment opens to a login page.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744794454533-cf13e340-41d9-42b3-b7cb-23d19b2a1fa5.png)

If we log in with the default administrator username and password,

we can see that we enter the administration panel.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744794389126-ed1509c8-ddb9-4ff1-a525-77a0a9293110.png)

We analyze it in Yakit.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744794960780-cf1f250b-17c3-4302-9071-4e31d34b9d1e.png)

We add the following to the request:

```java
x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware
```

The result shows that we bypassed authorization and authentication.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744795004945-4e435926-4b9a-49d8-8b45-a1a6c6bc08ee.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744795045146-09256ab9-06d6-4eca-bf23-cb44a686f373.png)

### Vulnerability principles

How Next.js handles a special internal HTTP header, `x-middleware-subrequest`.

> **Purpose of the `**x-middleware-subrequest**` header:** This header is intended for internal use by the Next.js framework, mainly to prevent middleware from entering an infinite recursive loop while handling requests. When middleware internally triggers a request to another URL that might also require the same middleware, this header tracks the call level or state.

**Therefore, our bypass mechanism works as follows:**

**When a Next.js application receives a request with a carefully crafted **`**x-middleware-subrequest**`** header, the framework incorrectly determines that the request appears to have already been processed by the middleware (or has reached the maximum recursion depth), and decides to skip the middleware logic that should have run.**

**As a result, we can access resources that should be protected.**

****

Returning to the payload, I have seen some sources say:

_In some versions, Next.js checks the value of the _`_x-middleware-subrequest_`_ header to prevent infinite recursion. It counts the number of times the header value contains the current middleware name. The default maximum recursion depth (_`_MAX_RECURSION_DEPTH_`_) is 5._

```java
curl -i -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware" http://127.0.0.1:3000
```

So when Next.js receives this request,

it assumes there is no need to execute the middleware again, skips its processing logic, and passes the request to the next stage.

### Vulnerability detection

See THM for details.

[TryHackMe | Cyber Security Training](https://tryhackme.com/room/nextjscve202529927)


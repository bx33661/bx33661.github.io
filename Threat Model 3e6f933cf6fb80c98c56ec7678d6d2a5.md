# Threat Model

状态: 未开始

“误报最常见的原因是模型对信任边界的理解不足—The most common cause of false positives is that the model lacks a good understanding of your trust boundaries”

这是近期我对 AI 审计漏洞实践的最深刻感悟

### 什么是Threat Model？

Threat Model（威胁模型）是在分析系统之前，先明确几个问题：

攻击者是谁？他能控制什么？他不能控制什么？系统信任什么？

```python
path = config["backup_path"]
open(path, "w").write(data)
```

 这里在 Agent 安全审计的时候，就有可能识别出来说：

`path` 没有经过校验，攻击者可能传入 `../../etc/passwd`，存在 Path Traversal / Arbitrary File Write

但是真实生产和代码中，如果这个配置只能由服务器管理员修改：

```python
管理员
  │
  ▼
config.yaml     ← Trusted
  │
  ▼
backup_path
  │
  ▼
open()
```

普通攻击者根本无法控制它，那么“攻击者通过 HTTP 请求修改 path 从而任意写文件”这条攻击路径就是不存在的

所以 LLM 找到的是：

```python
Source → Sink
```

但是我们真正关心的是 ：

```python
Attacker-controlled Source
        ↓
    Data Flow
        ↓
Dangerous Sink
```

这个Source点必须真的处于攻击者控制范围内

### Trust Boundary

信任边界这个概念，这里假设

一个典型的 Web 系统

```python
                    Untrusted
                        │
Internet Attacker ── HTTP Request
                        │
================ Trust Boundary ================
                        │
                   Web Server
                        │
                Application Code
                   │          │
                Database    Config
                             ↑
                           Trusted
```

一般情况下，HTTP 参数 `request.args["url"]` 属于 Untrusted Input,但是服务器环境变量 `os.environ["DATABASE_URL"]`  属于Trusted Input

但是上面这种不是代码层面决定的，而是部署环境决定的

比如：

```
url = os.getenv("WEBHOOK_URL")requests.get(url)
```

单看代码很像 SSRF：

```
url
 ↓
requests.get()
 ↓
SSRF?
```

但如果 `WEBHOOK_URL` 只能由管理员配置，那么普通互联网攻击者无法控制：

```
Attacker
   X
   │ 无法控制
   ▼
WEBHOOK_URL
   │
   ▼
requests.get()
```

因此对于定义的“远程未认证攻击者”Threat Model，它可能就不是一个可利用的 SSRF 漏洞

### 为什么误报？

因为模型看到代码：

```java
String url = config.getWebhookUrl();
httpClient.get(url);
```

很容易根据训练数据里的模式匹配：

```
用户可控 URL
      ↓
HTTP Client
      ↓
SSRF
```

但真正缺失的信息是：

> `config.getWebhookUrl()` 是否 attacker-controlled？
> 

这就是文章所谓：

> model lacks a good understanding of your trust boundaries
> 

LLM 可能把：

```
Config
```

错误理解成：

```
Untrusted Input
```

于是产生 False Positive,这个其实更危险

假设：

```java
@PostMapping("/admin/import")
public void importData(String url) {
    importer.load(url);
}
```

模型可能根据 `/admin/` 推测：

> 这是内部管理员接口，所以风险较低。
> 

但实际部署：

```
Internet
   │
   ▼
/admin/import
   │
   ▼
No Authentication
   │
   ▼
importer.load(url)
```

那么,真实攻击路径是

```
Attacker-controlled URL
        ↓
     load(url)
        ↓
 Internal HTTP Request
        ↓
       SSRF
```

所以也不是我们的 Agent 和模型能力差。代码本身可能分析得完全正确，错的是 AI 对系统环境的假设
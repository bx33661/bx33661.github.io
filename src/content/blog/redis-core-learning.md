---
title: "Redis 核心指南：基础、实战与缓存之道"
description: "深度总结 Redis 的核心知识点，涵盖五大基本数据类型的应用场景、Python 实战操作，以及缓存穿透、击穿、雪崩等经典问题的解决方案（布隆过滤器等）。"
date: 2026-02-10
tags:
  - "redis"
  - "database"
  - "python"
  - "cache"
  - "backend"
authors:
  - "bx"
draft: false
slug: "redis-core-guide"
---

<meta name="referrer" content="no-referrer">

> 本文记录了 Redis 的核心操作与实战经验，特别是针对缓存场景下的常见问题及其解决方案。

## 一、基本操作

### 1. 五大基本命令

Redis 的基础交互非常直观，以下是 Python (`redis-py`) 的操作演示：

*   **SET key value**：写入数据（默认覆盖）。
*   **GET key**：读取数据。如果 Key 不存在，返回 `None` (Python) 或 `nil` (Redis)。
*   **DEL key**：删除 Key，返回被删除的数量。

```python
import redis

# 连接 Redis
r = redis.Redis(host='localhost', port=6379, db=0)

# 写入与获取
r.set("target", "127.0.0.1")
ip = r.get("target")
print(ip)  # b'127.0.0.1'

# 删除
count = r.delete("target")
print(count) # 1
```

### 2. 生存时间 (TTL)

控制数据的生命周期是缓存系统的核心能力：

*   **EXPIRE key seconds**：设置 Key 的“倒计时”（生存时间）。
*   **TTL key** (Time To Live)：查看 Key 还能存活多久。

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0)

r.set("test", "test") # 永不过期
r.set("target", "bx33661", ex=5) # 5秒后过期

print(r.ttl("target")) # 输出 5
time.sleep(3)
print(r.ttl("target")) # 输出 2
time.sleep(3)
print(r.ttl("target")) # 输出 -2 (已过期)
print(r.ttl("test"))   # 输出 -1 (永不过期)
```

**TTL 返回值的含义：**
*   `> 0`：剩余生存秒数。
*   `-1`：Key 存在，但**没有设置过期时间**（永生）。
*   `-2`：Key **根本不存在**（已经过期或未创建）。

### 3. 批量操作

为了减少网络开销，可以使用批量命令：

*   **MSET key value ...**：原子性地设置多个 Key。
*   **MGET key ...**：一次性获取多个 Value。

```python
r.mset({
    "user:1:flag": "flag{hello}",
    "user:2:flag": "flag{world}",
    "user:3:flag": "flag{redis}"
})

flags = r.mget(["user:1:flag", "user:2:flag", "user:3:flag"])
print(flags)
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770691262744-856239c8-bb6b-46b5-a69e-2068819a8c41.png)

### 4. 管道 (Pipeline)

**为什么要用管道？**

*   **普通模式**：Client 发送 -> Server 回复 -> Client 发送... (N 次 RTT 网络往返)。
*   **管道模式**：Client 打包发送 N 个命令 -> Server 执行完 -> 一次性回传结果 (1 次 RTT)。

这能带来极大的性能提升，特别是在批量写入场景。

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

# 使用 Pipeline
with r.pipeline() as pipe:
    for i in range(1000):
        pipe.set(f"task:{i}", "waiting")
        pipe.expire(f"task:{i}", 60)
    
    # 执行打包好的命令
    results = pipe.execute()

print(f"成功执行了 {len(results)} 个命令")
```

原理图示：
```
Python 本地内存缓冲：
┌───────────────────────────┐
│ set task:0                │
│ expire task:0             │
│ ...                       │
│ set task:999              │
└───────────────────────────┘
              │
              │ execute() (一次网络发送)
              ▼
Redis Server
```

---

## 二、数据类型与场景

Redis 不仅仅是 KV 存储，它提供了丰富的数据结构。

| **场景** | **推荐类型** | **理由** |
| :--- | :--- | :--- |
| Token / 验证码 | **String** | 简单，原生支持过期 |
| 用户信息 / 对象 | **Hash** | 修改字段方便，比 String 存 JSON 更省内存 |
| 消息队列 / 历史记录 | **List** | 双向链表，支持阻塞读取 (BLPOP) |
| 标签 / 黑名单 | **Set** | 自动去重，集合运算（交并补）快 |
| 排行榜 / 延时队列 | **ZSet** | 自动按 Score 排序，支持范围查询 |

### 1. Hash (哈希)

适合存储对象，例如游戏中的玩家属性：

```python
# 设置玩家属性
r.hset("user:1002", mapping={
    "name": "bx",
    "age": 22,
    "score": 500
})

# 增加分数 (直接操作字段，无需取回整个对象)
r.hincrby("user:1002", "score", 100)

score = r.hget("user:1002", 'score')
print(score) # b'600'
```

**常用命令速查：**

| 命令 | 功能 | 典型场景 |
| :--- | :--- | :--- |
| `HSET` / `HMGET` | 设置/获取字段 | 对象存取 |
| `HINCRBY` | 字段自增 | 计数器、点赞数 |
| `HEXISTS` | 判断字段是否存在 | 属性检查 |
| `HGETALL` | 获取所有字段 | 读取完整对象 (注意大 Key 风险) |

### 2. List (列表)

Redis 的 List 是一个**双向链表**。
*   **优势**：头部/尾部插入删除 (LPUSH/RPUSH) 极快 O(1)。
*   **劣势**：随机访问中间元素 (Index) 较慢 O(N)。
*   **场景**：消息队列、最新 N 条动态。

### 3. ZSet (有序集合)

ZSet 是 Redis 最具特色的数据结构。它类似于 Set（元素去重），但每个元素关联一个 `Double` 类型的 **Score**。

**场景：CTF 竞赛排行榜**

```python
# 添加战队分数
r.zadd("ctf_rank", {"Team_A": 100, "Team_B": 250, "Team_C": 50})

# 获取第一名 (按分数从高到低, 0-0 即取第一个)
top1 = r.zrevrange("ctf_rank", 0, 0, withscores=True)
print(f"当前第一名: {top1}") # [('Team_B', 250.0)]

# Team_C 解出一题，加 200 分
r.zincrby("ctf_rank", 200, "Team_C")

# 查看最新全榜
print(f"最新排名: {r.zrevrange('ctf_rank', 0, -1)}")
```

---

## 三、缓存系统的经典问题 ("缓存三兄弟")

做缓存设计时，必须考虑这三个极端场景。

### 1. 缓存穿透 (Cache Penetration)

> **现象**：请求绕过缓存，直接查询数据库。但数据库里也没有这个数据。
> **后果**：缓存完全失效，高并发下数据库被不存在的查询打垮。

**场景模拟：**
1.  攻击者请求 `id = -1` 或 `id = 99999999` (不存在的 ID)。
2.  Redis 查不到 -> 去查 DB。
3.  DB 也查不到 -> 不写入 Redis（通常逻辑是查到了才写缓存）。
4.  循环上述过程，数据库压力爆满。

**解决方案：**

#### A. 缓存空对象 (Cache Null)
当 DB 查不到时，也在 Redis 里存一个特殊值（如 `NULL` 或 `NOT_FOUND`），并设置较短的过期时间。

```python
# 伪代码
val = redis.get(key)
if not val:
    val = db.query(key)
    if not val:
        # 防穿透：写入空值，过期时间设短一点
        redis.set(key, "NULL", ex=60) 
    else:
        redis.set(key, val, ex=3600)
```
*   **缺点**：如果攻击者用海量随机 Key 攻击，Redis 会存储大量垃圾 Key 占用内存。

#### B. 布隆过滤器 (Bloom Filter)
布隆过滤器是一种空间效率极高的数据结构，用于判断**“某样东西一定不存在（或者可能存在）”**。

它不存具体数据，只存“指纹”（Hash 位）。

**原理举例（签到表）：**
有一张长纸条（Bit Array），初始全为 0。
1.  存储 `"Alice"`：用 3 个哈希函数算出位置 `1, 4, 7`，把这 3 个格子打钩（置 1）。
2.  查询 `"Bob"`：算出位置 `2, 5, 8`。一看这 3 个格子不全为 1，直接断定 **Bob 绝对不在**。
3.  查询 `"Eve"`：算出位置 `1, 4, 7`。一看全是 1（Alice 打的钩）。过滤器会说 **"Eve 可能在"**（实际是误判）。

**特点：**
*   **误判率 (False Positive)**：可能把不存在判为存在（小概率），但**绝不会把存在的判为不存在**。这足以拦截绝大多数恶意请求。
*   **难删数据**：因为多个元素可能共用同一个比特位，删除一个元素可能会误伤其他元素（导致 False Negative，这是绝对不允许的）。

### 2. 缓存击穿 (Cache Breakdown)

> **现象**：一个**超级热点 Key**（如秒杀商品、突发新闻）突然过期。
> **后果**：那一瞬间，成千上万的并发请求同时发现缓存失效，同时涌向数据库，瞬间击垮数据库。

**解决方案：**
*   **互斥锁 (Mutex Lock)**：发现缓存失效时，不是所有线程都去查库，而是先抢锁。抢到锁的线程去查库并更新缓存，其他线程等待。
*   **逻辑过期**：数据本身不设置 Redis 过期时间，而是在 Value 里包含一个逻辑过期时间戳。查询时发现逻辑过期，异步启动一个线程去更新数据，当前请求先返回旧值。

### 3. 缓存雪崩 (Cache Avalanche)

> **现象**：**大量 Key 在同一时间集中过期**，或者 Redis 服务宕机。
> **后果**：整个缓存层失效，流量如同雪崩一样全部砸向数据库。

**解决方案：**
*   **随机过期时间**：设置过期时间时，加上一个随机值（例如 `1小时 + random(1-5分钟)`），让失效时间分散开。
*   **高可用架构**：Redis 哨兵模式 (Sentinel) 或集群模式 (Cluster)，防止单点故障。
*   **限流降级**：在数据库撑不住时，启用限流保护，或者直接返回默认降级数据。

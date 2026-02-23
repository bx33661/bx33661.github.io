---
title: "Redis 与 Lua 脚本（Part 2）"
author: "bx"
description: "整理 Lua 核心语法、Redis Lua 脚本执行模型（原子性、KEYS/ARGV、call/pcall）以及一个固定窗口限流实战示例，并补充 OpenResty 与 Lua 的关系。"
pubDatetime: 2026-02-18
tags:
  - "redis"
  - "lua"
  - "openresty"
  - "backend"
  - "security"
draft: false
slug: "redis-lua-script-part2"
---

<meta name="referrer" content="no-referrer">

> 这篇是 Redis 学习笔记 Part 2，重点放在 Lua 脚本能力和在 Redis/OpenResty 场景中的实际使用。

## Lua 基础快速梳理

参考文档：[The Programming Language Lua](https://www.lua.org/)

最近需要阅读和编写一些 Lua 脚本，先把最关键的语法点集中整理一遍。

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770798518431-6af07867-bf9c-4019-b4e3-ce6aae3bfce5.png)

### 1. 变量与作用域

Lua 默认变量是全局变量，只有显式写 `local` 才是局部变量。

### 2. 数据类型

Lua 共有 8 种类型：

1. `nil`：空值。给变量赋 `nil` 可以理解为删除该键。
2. `boolean`：`true` / `false`。
3. `number`：Lua 5.1 中是双精度浮点数。
4. `string`：不可变字符串。
5. `function`：函数是一等公民。
6. `userdata`：保存 C 数据结构。
7. `thread`：协程。
8. `table`：Lua 唯一的复合数据结构。

Lua 的核心是 `table`。它既能当数组，也能当字典。

数组示例（注意索引从 `1` 开始）：

```lua
-- 隐式索引
local list = { "Misc", "Web", "Pwn" }

-- 显式索引
local list2 = {
  [1] = "Misc",
  [2] = "Web",
  [3] = "Pwn"
}

print(list[1]) -- Misc
print(list[0]) -- nil
```

长度获取：

```lua
local list = {
  [1] = "Chinese",
  [2] = "English",
  [3] = "Math"
}

print(#list) -- 3
```

字典示例：

```lua
local user = {
  name = "bx", -- 等价于 ["name"] = "bx"
  ["age"] = 18,
  [10001] = "id"
}

print(user.name)
print(user["name"])
print(user["age"])
print(user[10001])
```

遍历时常用 `ipairs` 和 `pairs`：

| 函数 | 适用对象 | 顺序 | 遇到 `nil` 的行为 |
| --- | --- | --- | --- |
| `ipairs` | 连续数字索引数组 | 从 1 递增 | 遇到第一个 `nil` 停止 |
| `pairs` | 全部键值对 | 不保证顺序 | 不因 `nil` 提前停止 |

`ipairs` 示例：

```lua
local t = {10, 20, 30}

for i, v in ipairs(t) do
  print(i, v)
end
```

`pairs` 示例：

```lua
local t = {
  name = "bx",
  age = 18
}

for k, v in pairs(t) do
  print(k, v)
end
```

### 3. 其他常用点

1. 字符串拼接使用 `..`，不是 `+`。

```lua
local key_prefix = "admin:"
local id = 1001

local key = key_prefix .. id
print("Key:", key)

local message = string.format("User ID: %d", id)
print("Message:", message)
```

2. Lua 没有 `switch`，只有 `if / elseif / else`。

```lua
local score = 0

-- 在 Lua 里，0 也是真值
if score then
  print("0 在 Lua 中为 true")
end

if score > 90 then
  print("A")
elseif score > 60 then
  print("B")
else
  print("C")
end
```

Lua 真值规则：只有 `false` 和 `nil` 为假，其他值（包括 `0`、`""`、`{}`）都为真。

3. 元表（Metatable）

元表可以改写 `table` 的默认行为，常见元方法有：

- `__index`：访问不存在字段时触发。
- `__newindex`：给不存在字段赋值时触发。
- `__add` / `__sub`：运算符重载。
- `__call`：让 `table` 像函数一样被调用。
- `__tostring`：自定义打印输出。

## Redis 中的 Lua 脚本

### 1. 原子性

在 Redis 里执行 Lua 脚本时，Redis 会把整段脚本作为一个原子操作执行。脚本运行期间不会插入其他命令，因此非常适合实现“读-改-写”一体化逻辑。

### 2. `redis.call` 与 `redis.pcall`

| 方法 | 出错时行为 |
| --- | --- |
| `redis.call` | 抛异常并终止脚本 |
| `redis.pcall` | 返回错误对象，不直接中断 |

### 3. `EVAL` 与 `numkeys`

Python 端常见调用方式：

```python
r.eval(script, numkeys, *keys_and_args)
```

参数拆分规则：

```python
r.eval(script, numkeys, key1, key2, ..., arg1, arg2, ...)
```

`numkeys` 的意义是告诉 Redis：后续参数中前多少个属于 Key。

- 前 `numkeys` 个参数进入 `KEYS[]`
- 剩余参数进入 `ARGV[]`

所以写脚本时要明确区分 `KEYS[]` 与 `ARGV[]`。

### 4. 固定窗口限流示例

规则：用户 `user:1001` 在 10 秒内最多请求 3 次。

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)


def example_rate_limiter():
    user_id = "user:1001"
    limit = 3
    window_seconds = 10

    rate_limit_script = """
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])

    local current = redis.call("INCR", key)

    if tonumber(current) == 1 then
        redis.call("EXPIRE", key, window)
    end

    if tonumber(current) > limit then
        return 0 -- Blocked
    else
        return 1 -- Allowed
    end
    """

    print(f"Simulating requests for {user_id} (limit={limit}, window={window_seconds}s)")

    for i in range(1, 6):
        allowed = r.eval(rate_limit_script, 1, f"ratelimit:{user_id}", limit, window_seconds)
        status = "Allowed" if allowed == 1 else "Blocked"
        print(f"Request {i}: {status}")
        time.sleep(0.5)


if __name__ == "__main__":
    example_rate_limiter()
```

输出示例：

```text
Simulating requests for user:1001 (limit=3, window=10s)
Request 1: Allowed
Request 2: Allowed
Request 3: Allowed
Request 4: Blocked
Request 5: Blocked
```

## OpenResty 与 Lua

> OpenResty 本质是 NGINX + LuaJIT。

它把 Lua 脚本能力嵌入 NGINX 请求处理链路，让我们可以在网关层做鉴权、限流、路由和安全逻辑。

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770813371928-8d76217c-ebf4-44de-8ddd-ab614935883d.png)

## 小结

Lua 本身不复杂，但 `table`、真值规则、元表这三部分很关键。放到 Redis 场景后，核心是理解原子执行模型、参数分离（`KEYS/ARGV`）和错误处理方式（`call/pcall`）。

下一步可以继续扩展：滑动窗口限流、令牌桶限流，以及在 OpenResty 中落地成网关策略。

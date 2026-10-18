---
title: "Redis and Lua Scripts (Part 2)"
description: "Covers core Lua syntax, the Redis Lua execution model (atomicity, KEYS/ARGV, call/pcall), a fixed-window rate-limiting example, and the relationship between OpenResty and Lua."
date: 2026-02-18T00:00:00.000Z
tags:
  - "redis"
  - "lua"
  - "openresty"
  - "backend"
  - "Security"
authors:
  - "bx"
draft: false
slug: "redis-lua-script-part2-en"
lang: "en"
translationKey: "redis-lua-script-part2"
---


> This is Part 2 of my Redis study notes, focusing on Lua scripting capabilities and practical use in Redis/OpenResty scenarios.

## Quick Review of Lua Basics

Reference: [The Programming Language Lua](https://www.lua.org/)

I've recently needed to read and write some Lua scripts, so here's a focused review of the most important syntax.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770798518431-6af07867-bf9c-4019-b4e3-ce6aae3bfce5.png)

### 1. Variables and Scope

Lua variables are global by default; only an explicit `local` makes a variable local.

### 2. Data Types

Lua has eight types:

1. `nil`: nil. Assigning `nil` to a variable can be understood as deleting that key.
2. `boolean`: `true` / `false`.
3. `number`: a double-precision floating-point number in Lua 5.1.
4. `string`: immutable string.
5. `function`: functions are first-class values.
6. `userdata`: stores C data structures.
7. `thread`: coroutine.
8. `table`: Lua's only composite data structure.

The core of Lua is `table`. It can act as both an array and a dictionary.

Array example (note that indexing starts at `1`):

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

Getting the length:

```lua
local list = {
  [1] = "Chinese",
  [2] = "English",
  [3] = "Math"
}

print(#list) -- 3
```

Dictionary example:

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

`ipairs` and `pairs` are commonly used for iteration:

| Function | Applies to | Order | Behavior on encountering `nil` |
| --- | --- | --- | --- |
| `ipairs` | Array with consecutive numeric indices | Increments from 1 | Stops at the first `nil` |
| `pairs` | All key-value pairs | Order not guaranteed | Does not stop early because of `nil` |

`ipairs` example:

```lua
local t = {10, 20, 30}

for i, v in ipairs(t) do
  print(i, v)
end
```

`pairs` example:

```lua
local t = {
  name = "bx",
  age = 18
}

for k, v in pairs(t) do
  print(k, v)
end
```

### 3. Other Common Points

1. String concatenation uses `..`, not `+`.

```lua
local key_prefix = "admin:"
local id = 1001

local key = key_prefix .. id
print("Key:", key)

local message = string.format("User ID: %d", id)
print("Message:", message)
```

2. Lua has no `switch`, only `if / elseif / else`.

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

Lua truthiness: only `false` and `nil` are false; all other values (including `0`, `""`, `{}`) are true.

3. Metatables

Metatables can override the default behavior of `table`. Common metamethods include:

- `__index`: triggered when accessing a nonexistent field.
- `__newindex`: triggered when assigning to a nonexistent field.
- `__add` / `__sub`: operator overloading.
- `__call`: lets `table` be called like a function.
- `__tostring`: customizes printed output.

## Lua Scripts in Redis

### 1. Atomicity

When Redis executes a Lua script, it runs the entire script as an atomic operation. No other commands are interleaved while the script runs, making this useful for implementing combined “read-modify-write” logic.

### 2. `redis.call` and `redis.pcall`

| Method | Behavior on error |
| --- | --- |
| `redis.call` | Throws an exception and terminates the script |
| `redis.pcall` | Returns an error object without directly interrupting execution |

### 3. `EVAL` and `numkeys`

Common invocation from Python:

```python
r.eval(script, numkeys, *keys_and_args)
```

Argument-splitting rules:

```python
r.eval(script, numkeys, key1, key2, ..., arg1, arg2, ...)
```

`numkeys` tells Redis how many of the following arguments are Keys.

- The first `numkeys` arguments go into `KEYS[]`
- The remaining arguments go into `ARGV[]`

So make sure to distinguish `KEYS[]` from `ARGV[]` in scripts.

### 4. Fixed-window Rate-Limiting Example

Rule: user `user:1001` may make at most 3 requests within 10 seconds.

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

Example output:

```text
Simulating requests for user:1001 (limit=3, window=10s)
Request 1: Allowed
Request 2: Allowed
Request 3: Allowed
Request 4: Blocked
Request 5: Blocked
```

## OpenResty and Lua

> OpenResty is essentially NGINX + LuaJIT.

It embeds Lua scripting into the NGINX request-processing pipeline, allowing authentication, rate limiting, routing, and security logic at the gateway layer.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770813371928-8d76217c-ebf4-44de-8ddd-ab614935883d.png)

## Summary

Lua itself is not complicated, but `table`, truthiness rules, and metatables are all important. In Redis, the key ideas are atomic execution, argument separation (`KEYS/ARGV`), and error handling (`call/pcall`).

Next, we can extend this to sliding-window and token-bucket rate limiting, and implement gateway policies in OpenResty.

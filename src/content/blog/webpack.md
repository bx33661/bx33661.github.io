---
title: "Webpack 渗透思路"
description: "Webpack 渗透思路,反编查找"
date: 2025-05-29
tags:
  - "Webpack"
  - "学习分析"
  - "JavaScript"
  - "web"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "bxwebpack"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">


# Webpack 渗透思路
>  目前了解到的就是这些
Webpack 是一个现代 JavaScript 应用程序的**静态模块打包器**。当 webpack 处理应用程序时，它会在内部构建一个依赖关系图，映射项目需要的每个模块，然后生成一个或多个 bundle。

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659337-503b112c-4790-4f3e-8725-14fa9921cb1e.png)

所以说整体思路就是

"识别特征—还原源码—定位关键逻辑—安全分析"

### 如何分辨 webpack 打包网站

fofa 语句

```plain
body="chunk.js" || body="runtime" || body="
__webpack_require__
"
body="/static/js/" && body=".chunk.js"
```

典型的案例如下

```plain
<!-- webpack 打包后的典型 HTML 结构 -->
<!DOCTYPE html>
<html>
<head>
    <title>App</title>
    <!-- webpack 生成的 CSS 文件，通常带有 hash -->
    <link href="/static/css/main.a1b2c3d4.css" rel="stylesheet">
</head>
<body>
    <div id="root"></div>
    <!-- webpack 生成的 JS 文件，通常带有 hash -->
    <script src="/static/js/runtime-main.1a2b3c4d.js"></script>
    <script src="/static/js/2.e5f6g7h8.chunk.js"></script>
    <script src="/static/js/main.i9j0k1l2.chunk.js"></script>
</body>
</html>
```

- **文件名带有 hash 值**：如 `main.a1b2c3d4.js`
- **chunk 文件**：文件名包含 `chunk` 关键字
- **runtime 文件**：通常有 `runtime` 文件
- **数字命名的文件**：如 `2.e5f6g7h8.chunk.js`

例如

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659336-879d24a5-d2bb-41fa-85a8-2b1c71d0ab76.png)

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659621-b6eb4aa0-5a7d-490c-a5c9-f490d849da45.png)

### 控制台源代码就有Webpack://

webpack 目前支持多种调试模式，不同模式的区别在于编译后代码和源码之间的映射方式不同。具体来说，源码是通过不同的方式来映射的。有些模式会生成一个 .map 文件（用于源码映射），有些模式会通过注释的形式包含源码映射信息，还有些模式会使用 DataUrl 的方式（即把映射信息以 data URI 的形式嵌入到生成的文件中）

几种常见的映射打包方式

1. source-map

生成独立的 .map 文件，方便调试，调试时可以还原到源代码。

适合用于生产环境，便于排查问题，但会暴露源码。

1. inline-source-map

将 source map 以 DataUrl 的形式内联到编译后的文件中，不生成单独的 .map 文件。

适合开发环境，方便查看源码但文件体积较大。

1. eval-source-map

将 source map 以 DataUrl 的形式嵌入到每个模块中（通过 eval），构建速度快，调试体验好。

适合开发环境，不推荐用于生产环境。

1. cheap-module-source-map

提供行映射而不是列映射，忽略模块中的 loader source map，生成速度较快。

适用于开发环境，如果只关心行号，可以提升效率。

1. hidden-source-map

生成 .map 文件，但不会在编译后的文件中引用，适合用于只需要 sourcemap 供错误收集工具使用，不直接暴露给用户。

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659351-08287979-f6e4-452f-9ec6-a840fbc3c398.png)

存在泄露

Sources—> Page—> Webpack://中查看到Webpack项目源码

可以采用下面的反解 webpack

然后就可以分析项目结构和源代码审计等等了

### 自动化工具检测

https://github.com/rtcatc/Packer-Fuzzer

这个工具可以对 webpack 网站进行一个扫描，漏洞探查

```plain
python .\PackerFuzzer.py -u "..."
```

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659540-c57f3b85-7bd8-403e-a985-0593228f0401.png)

会生成一个 doc 文档，扫描报告

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659900-bbb47e15-33fb-4bf7-b99e-4a04ae7e6f69.png)

## Webpack 案例

把相关代码放入 GitHub 仓库上面了

https://github.com/bx33661/Webpack-demo/tree/main

```plain
npm run dev
npm run build
```

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600659885-f58b3dec-a95e-4b85-8c50-56771d7ddfc5.png)

会在 dist 文件夹中生成两个文件

1. **bundle.js**

bundle.js 是webpack打包后生成的JavaScript文件，它包含了项目中所有JavaScript模块和依赖的集合。

主要特点：

- 代码压缩 ：文件被压缩和混淆，以减小文件大小，提高加载速度。这就是为什么它看起来很难读懂。
- 模块整合 ：webpack将所有模块（包括 index.js 和 greeting.js ）打包成一个文件，解决了模块依赖问题。
- 样式注入 ：CSS文件（ style.css ）也被打包到了这个文件中，通过JavaScript动态创建style标签注入到页面。
- 自执行函数 ：整个代码被包裹在一个自执行函数中 (()=>{...})() ，创建了一个独立的作用域。

1. **index.html**

- 自动引入bundle ：自动添加了 `<script defer="defer" src="bundle.js"></script>` 标签，引入打包后的JavaScript文件。
- 压缩HTML ：HTML代码被压缩，移除了不必要的空格和换行。
- 保留内容结构 ：保留了原始模板中的DOM结构，包括标题、按钮和结果显示区域。
- 元数据保留 ：保留了原始模板中的meta标签和其他头部信息。

```javascript
(() => {
  "use strict";
  var n = {
    56: (n, e, t) => {
      n.exports = function(n) {
        var e = t.nc;
        e && n.setAttribute("nonce", e)
      }
    },
    72: n => {
      var e = [];
      function t(n) {
        for (var t = -1, r = 0; r < e.length; r++)
          if (e[r].identifier === n) {
            t = r;
            break
          } return t
      }
      function r(n, r) {
        for (var a = {}, i = [], c = 0; c < n.length; c++) {
          var s = n[c],
            d = r.base ? s[0] + r.base : s[0],
            u = a[d] || 0,
            p = "".concat(d, " ").concat(u);
          a[d] = u + 1;
          var l = t(p),
            f = {
              css: s[1],
              media: s[2],
              sourceMap: s[3],
              supports: s[4],
              layer: s[5]
            };
          if (-1 !== l) e[l].references++, e[l].updater(f);
          else {
            var v = o(f, r);
            r.byIndex = c, e.splice(c, 0, {
              identifier: p,
              updater: v,
              references: 1
            })
          }
          i.push(p)
        }
        return i
      }
      function o(n, e) {
        var t = e.domAPI(e);
        return t.update(n),
          function(e) {
            if (e) {
              if (e.css === n.css && e.media === n.media && e.sourceMap === n.sourceMap && e.supports === n.supports && e.layer === n.layer) return;
              t.update(n = e)
            } else t.remove()
          }
      }
      n.exports = function(n, o) {
        var a = r(n = n || [], o = o || {});
        return function(n) {
          n = n || [];
          for (var i = 0; i < a.length; i++) {
            var c = t(a[i]);
            e[c].references--
          }
          for (var s = r(n, o), d = 0; d < a.length; d++) {
            var u = t(a[d]);
            0 === e[u].references && (e[u].updater(), e.splice(u, 1))
          }
          a = s
        }
      }
    },
    113: n => {
      n.exports = function(n, e) {
        if (e.styleSheet) e.styleSheet.cssText = n;
        else {
          for (; e.firstChild;) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(n))
        }
      }
    },
    208: (n, e, t) => {
      t.d(e, {
        A: () => c
      });
      var r = t(601),
        o = t.n(r),
        a = t(314),
        i = t.n(a)()(o());
      i.push([n.id, "* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: Arial, sans-serif;\n  line-height: 1.6;\n  color: #333;\n  background-color: #f4f4f4;\n}\n\n#app {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\n.title {\n  color: #2c3e50;\n  text-align: center;\n  margin-bottom: 20px;\n  padding-bottom: 10px;\n  border-bottom: 1px solid #eee;\n}\n\n.content {\n  background: white;\n  padding: 20px;\n  border-radius: 5px;\n  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);\n}\n\nbutton {\n  background: #3498db;\n  color: white;\n  border: none;\n  padding: 10px 15px;\n  border-radius: 4px;\n  cursor: pointer;\n  margin-top: 10px;\n  font-size: 16px;\n  transition: background 0.3s;\n}\n\nbutton:hover {\n  background: #2980b9;\n}\n\n#result {\n  margin-top: 20px;\n  padding: 15px;\n  background: #f9f9f9;\n  border-left: 4px solid #3498db;\n  display: none;\n}\n\n#result.active {\n  display: block;\n  animation: fadeIn 0.5s;\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}", ""]);
                const c = i
            },
            314: n => {
                n.exports = function(n) {
                    var e = [];
                    return e.toString = function() {
                        return this.map((function(e) {
                            var t = "",
                                r = void 0 !== e[5];
                            return e[4] && (t += "@supports (".concat(e[4], ") {")), e[2] && (t += "@media ".concat(e[2], " {")), r && (t += "@layer".concat(e[5].length > 0 ? " ".concat(e[5]) : "", " {")), t += n(e), r && (t += "}"), e[2] && (t += "}"), e[4] && (t += "}"), t
                        })).join("")
                    }, e.i = function(n, t, r, o, a) {
                        "string" == typeof n && (n = [
                            [null, n, void 0]
                        ]);
                        var i = {};
                        if (r)
                            for (var c = 0; c < this.length; c++) {
                                var s = this[c][0];
                                null != s && (i[s] = !0)
                            }
                        for (var d = 0; d < n.length; d++) {
                            var u = [].concat(n[d]);
                            r && i[u[0]] || (void 0 !== a && (void 0 === u[5] || (u[1] = "@layer".concat(u[5].length > 0 ? " ".concat(u[5]) : "", " {").concat(u[1], "}")), u[5] = a), t && (u[2] ? (u[1] = "@media ".concat(u[2], " {").concat(u[1], "}"), u[2] = t) : u[2] = t), o && (u[4] ? (u[1] = "@supports (".concat(u[4], ") {").concat(u[1], "}"), u[4] = o) : u[4] = "".concat(o)), e.push(u))
                        }
                    }, e
                }
            },
            540: n => {
                n.exports = function(n) {
                    var e = document.createElement("style");
                    return n.setAttributes(e, n.attributes), n.insert(e, n.options), e
                }
            },
            601: n => {
                n.exports = function(n) {
                    return n[1]
                }
            },
            659: n => {
                var e = {};
                n.exports = function(n, t) {
                    var r = function(n) {
                        if (void 0 === e[n]) {
                            var t = document.querySelector(n);
                            if (window.HTMLIFrameElement && t instanceof window.HTMLIFrameElement) try {
                                t = t.contentDocument.head
                            } catch (n) {
                                t = null
                            }
                            e[n] = t
                        }
                        return e[n]
                    }(n);
                    if (!r) throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
                    r.appendChild(t)
                }
            },
            825: n => {
                n.exports = function(n) {
                    if ("undefined" == typeof document) return {
                        update: function() {},
                        remove: function() {}
                    };
                    var e = n.insertStyleElement(n);
                    return {
                        update: function(t) {
                            ! function(n, e, t) {
                                var r = "";
                                t.supports && (r += "@supports (".concat(t.supports, ") {")), t.media && (r += "@media ".concat(t.media, " {"));
                                var o = void 0 !== t.layer;
                                o && (r += "@layer".concat(t.layer.length > 0 ? " ".concat(t.layer) : "", " {")), r += t.css, o && (r += "}"), t.media && (r += "}"), t.supports && (r += "}");
                                var a = t.sourceMap;
                                a && "undefined" != typeof btoa && (r += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(a)))), " */")), e.styleTagTransform(r, n, e.options)
                            }(e, n, t)
                        },
                        remove: function() {
                            ! function(n) {
                                if (null === n.parentNode) return !1;
                                n.parentNode.removeChild(n)
                            }(e)
                        }
                    }
                }
            }
        },
        e = {};
    function t(r) {
        var o = e[r];
        if (void 0 !== o) return o.exports;
        var a = e[r] = {
            id: r,
            exports: {}
        };
        return n[r](a, a.exports, t), a.exports
    }
    t.n = n => {
        var e = n && n.__esModule ? () => n.default : () => n;
        return t.d(e, {
            a: e
        }), e
    }, t.d = (n, e) => {
        for (var r in e) t.o(e, r) && !t.o(n, r) && Object.defineProperty(n, r, {
            enumerable: !0,
            get: e[r]
        })
    }, t.o = (n, e) => Object.prototype.hasOwnProperty.call(n, e), t.nc = void 0;
    var r = t(72),
        o = t.n(r),
        a = t(825),
        i = t.n(a),
        c = t(659),
        s = t.n(c),
        d = t(56),
        u = t.n(d),
        p = t(540),
        l = t.n(p),
        f = t(113),
        v = t.n(f),
        m = t(208),
        b = {};
    b.styleTagTransform = v(), b.setAttributes = u(), b.insert = s().bind(null, "head"), b.domAPI = i(), b.insertStyleElement = l(), o()(m.A, b), m.A && m.A.locals && m.A.locals, document.addEventListener("DOMContentLoaded", (() => {
        console.log("页面已加载");
        const n = document.getElementById("clickBtn"),
            e = document.getElementById("result");
        n && e && n.addEventListener("click", (() => {
            const n = 
你好，Webpack! 当前时间: ${(new Date).toLocaleTimeString()}
;
            e.textContent = n, e.classList.add("active")
        }))
    }))
})();
```

修改一下，添加devtool 选项：

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  // 入口文件
  entry: './src/index.js',

  // 添加devtool配置来启用source map
  devtool: 'source-map', // 这将生成完整的source map文件

  // 输出配置
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true // 每次构建前清理dist文件夹
  },

  // ... 其余配置保持不变 ...
};
```

这样的话我们

```cmd
❯ npm run build
```

这样可以生成一个`bundle.js.map`文件

### 反解 webpack

有很多工具，这里使用reverse-sourcemap

```cmd
npm install --global reverse-sourcemap
```

看一下用法

```cmd
❯ reverse-sourcemap -h
reverse-sourcemap - Reverse engineering JavaScript and CSS sources from sourcemaps
Usage: reverse-sourcemap [options] <file|directory>
  -h, --help               Help and usage instructions
  -V, --version            Version number
  -v, --verbose            Verbose output, will print which file is currently being

                           processed
  -o, --output-dir String  Output directory - default: .
  -M, --match String       Regular expression for matching and filtering files -
                           default: \.map$
  -r, --recursive          Recursively search matching files
Version 1.0.4
```

直接逆向出来

```cmd
❯ reverse-sourcemap --output-dir ./ bundle.js.map
```

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600660162-e8d73ba2-beb7-42b7-a813-48b78384be65.png)

效果如下

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600660355-63c2bf60-5702-4339-85f1-48ec0f4dfb09.png)

可以看到与我们原本项目结构相比，结构基本一致

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600660620-af2dcf9e-5d9e-4feb-9557-903bce17535c.png)

效果还是不错的

![img](https://cdn.nlark.com/yuque/0/2025/png/42994824/1753600660503-be2cbf07-d9a7-424d-b62e-8438942eb015.png)

所以说有的时候，我们会发现一些网站泄露了一些"map"文件，我们可以达到意想不到的利用
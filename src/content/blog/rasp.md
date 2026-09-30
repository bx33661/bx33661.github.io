---
title: "RASP 学习：从 Java Agent 到 OpenRASP SQL 注入检测与绕过"
description: "从 JVM 字节码和 Java Agent 原理讲起，动手写四个渐进实验，然后走读 OpenRASP 的 SQL 注入检测链路，最后分析检测的绕过面。"
date: 2026-09-30
tags:
  - "RASP"
  - "Java"
  - "Security"
  - "SQL注入"
authors:
  - "bx"
draft: false
slug: "openrasp-sql-detect-bypass"
---

> 最近在学 RASP，把 OpenRASP 的代码翻了一遍，这篇文章就是学习记录

## WAF、RASP、EDR

WAF 在应用门外看请求，RASP 嵌在应用进程里看操作，EDR 蹲在主机上看进程。

| 技术 | 全称 | 部署位置 | 主要防什么 |
| ---- | ---- | -------- | ---------- |
| **WAF** | Web Application Firewall | 应用前面、网络入口 | SQL 注入、XSS、恶意请求、Bot |
| **RASP** | Runtime Application Self-Protection | 嵌入应用运行时 | 注入、命令执行、反序列化、路径穿越 |
| **EDR** | Endpoint Detection & Response | 操作系统终端 | 木马、勒索、提权、横向移动 |

RASP 全称 Runtime Application Self-Protection，以 Agent 的形式跑在应用进程内部，在敏感操作真正发生的位置——SQL 执行、命令执行、文件读写——拿到实际参数，结合请求上下文做判断。

说白了：WAF 看的是你递进来的东西，RASP 看的是程序正要做的动作。

## 从字节码到 Java Agent

### Java 程序是怎么执行的

Java 源码不直接跑在 CPU 上，中间隔着 JVM。`javac` 把 `.java` 编译成 `.class`，里面装的是字节码

```text
.java 源码
   ↓ javac
.class 字节码
   ↓ ClassLoader 加载
JVM 中的 Class
   ↓
解释执行 / JIT 编译
   ↓
CPU 机器指令
```

一行最简单的 `int c = a + b;`，编译出来是四条指令

```text
iload_1
iload_2
iadd
istore_3
```

JVM 是基于栈的虚拟机，这个"基于栈"不是说 JVM 只有栈，是说字节码做运算靠操作数栈，不像 x86 汇编在寄存器之间倒腾。方法调用时压一个栈帧进去

```text
栈帧 Stack Frame
├── 局部变量表 Local Variables
└── 操作数栈 Operand Stack
```

上面几条指令的语义：`iload_1` 从局部变量表 slot 1 取一个 int 压栈，`iadd` 弹两个相加再压回去。可以把 JVM 字节码粗略理解成一种栈式汇编

### 用 javap 看一个真实的类

写个最小的例子，这里编写一个 BusinessService.java

```java
public class BusinessService {
    public int process(int value) {
        return value + 1;
    }
}
```

javac 编译之后，我们使用 `javap -c -v -p` 反汇编（`-c` 反汇编代码，`-v` 输出常量池，`-p` 包含私有成员）

![BusinessService 的 javap 字节码反汇编结果](/blog/openrasp-sql-detect-bypass/01-javap-bytecode.png)

```java
❯ javap -c -v -p BusinessService.class
Classfile xxxxx
  Last modified xxxxxxx
  SHA-256 checksum 0db9428d91bc3389000e9cd137c36e7167e7b8890719424e4c976afa668c6b9c
  Compiled from "BusinessService.java"
public class BusinessService
  minor version: 0
  major version: 61
  flags: (0x0021) ACC_PUBLIC, ACC_SUPER
  this_class: #7                          // BusinessService
  super_class: #2                         // java/lang/Object
  interfaces: 0, fields: 0, methods: 2, attributes: 1
Constant pool:
   #1 = Methodref          #2.#3          // java/lang/Object."<init>":()V
   #2 = Class              #4             // java/lang/Object
   #3 = NameAndType        #5:#6          // "<init>":()V
   #4 = Utf8               java/lang/Object
   #5 = Utf8               <init>
   #6 = Utf8               ()V
   #7 = Class              #8             // BusinessService
   #8 = Utf8               BusinessService
   #9 = Utf8               Code
  #10 = Utf8               LineNumberTable
  #11 = Utf8               process
  #12 = Utf8               (I)I
  #13 = Utf8               SourceFile
  #14 = Utf8               BusinessService.java
{
  public BusinessService();
    descriptor: ()V
    flags: (0x0001) ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>":()V
         4: return
      LineNumberTable:
        line 1: 0

  public int process(int);
    descriptor: (I)I
    flags: (0x0001) ACC_PUBLIC
    Code:
      stack=2, locals=2, args_size=2
         0: iload_1
         1: iconst_1
         2: iadd
         3: ireturn
      LineNumberTable:
        line 3: 0
}
SourceFile: "BusinessService.java"
```

关注 `process` 部分

| 指令 | 动作 | 操作数栈变化 |
| ---- | ---- | ------------ |
| `iload_1` | 取局部变量槽 1 中的整数 | `[] → [value]` |
| `iconst_1` | 压入整数 1 | `[value] → [value, 1]` |
| `iadd` | 弹出两个整数，相加后压回 | `[value, 1] → [value+1]` |
| `ireturn` | 弹出整数，作为方法返回值 | 方法返回 |

**为什么参数在槽 1？**

这是实例方法，槽 0 固定保存 `this`，槽 1 才是第一个参数。静态方法没有 this，第一个参数从槽 0 开始

`descriptor: (I)I` 是方法描述符，括号里参数、括号后返回值，`(I)I` 就是收一个 int 返回一个 int。JVM 靠这个区分重载，后面读 OpenRASP 源码会大量遇到

`stack=2, locals=2, args_size=2` 是 Code 属性的元数据：操作数栈最深 2 格、局部变量表 2 格（this + value）、参数 2 个

左边的 `0、1、2、3` 是指令偏移量，不是源码行号

### 运行时数据区

JVM 运行时不止一个操作数栈

```text
线程
  ↓
JVM Stack
  ↓
一个个 Stack Frame
  ├── Local Variables
  └── Operand Stack

Heap
  ↓
Java 对象

Metaspace
  ↓
类元数据

Constant Pool
  ↓
类名、方法名、字段、字符串常量等
```

比如 `User user = new User();`，真正的对象在堆里，栈上放的是引用。上面 javap 输出的 Constant pool 部分就是每个类自带的常量表，`invokespecial #1` 里的 `#1` 就是往这张表里查

### 类加载：插桩的时机

classloader，类执行前要先加载

```text
.class 文件
   ↓
ClassLoader
   ↓
读取 class 字节
   ↓
defineClass
   ↓
JVM 验证 / 准备 / 解析
   ↓
形成 JVM 中的 Class
   ↓
开始执行
```

这条链上有个对所有插桩工具都关键的时间点：**class 字节已经读进来、但还没正式成为 JVM 里的 Class**。在这里改字节码，JVM 加载的就是改过的版本，业务完全无感

Java 官方为这个时机提供了机制：`java.lang.instrument.Instrumentation`（这个单词从英文语义理解就是"插桩"）

### Instrumentation

可以理解成 JVM 官方提供给 Agent 的运行时插桩接口，能观察类加载、改字节码、重新转换已加载的类

有个容易搞混的点：Instrumentation 本身不改字节码，它只是 JVM 和 Agent 之间的通道。真正干活的是 ASM / Byte Buddy / Javassist，三选一

```text
Java Agent
     ↓
Instrumentation
     ↓
拿到 class byte[]
     ↓
ASM / Byte Buddy 修改
     ↓
返回新的 byte[]
     ↓
JVM 加载
```

### Java Agent 和 premain

Java Agent 就是一段拥有特殊 JVM 能力的 Java 程序。普通程序入口是 main，Agent 的入口是

```java
public static void premain(String agentArgs, Instrumentation inst)
```

`java -javaagent:agent.jar -jar app.jar` 启动时，JVM 先加载 agent.jar、调 premain、把 Instrumentation 交给 Agent，然后才跑应用的 main。顺序永远是 premain 在前

Agent 拿到 inst 之后通常做一件事

```java
inst.addTransformer(transformer);
```

注册一个 `ClassFileTransformer`，它就是类加载链上的 Hook 点，核心方法

```java
byte[] transform(
    ClassLoader loader,
    String className,
    Class<?> classBeingRedefined,
    ProtectionDomain protectionDomain,
    byte[] classfileBuffer
)
```

`classfileBuffer` 就是 JVM 准备加载的字节码，返回新的 byte[] JVM 就加载你的版本，返回 null 就是不动。类加载链路变成

```text
.class
   ↓
ClassLoader
   ↓
ClassFileTransformer 拿到 byte[]
   ↓
Agent 修改 byte[]，返回新的 byte[]
   ↓
JVM
```

比如原始代码

```java
public void hello() {
    System.out.println("hello");
}
```

Agent 可以把它改成逻辑上的

```java
public void hello() {
    Agent.before();

    System.out.println("hello");

    Agent.after();
}
```

改的不是源码（源码早没了），是方法字节码，往指令流前面插几条新指令

### Hook

Hook 是比 Agent 更大的概念：把 `A → B → C` 变成 `A → 我的逻辑 → B → 我的逻辑 → C`。实现方式很多，LD_PRELOAD、inline hook 都算。在 JVM 上官方路径就是 Agent + Instrumentation + 字节码修改，不依赖 native 诡技、不受 JIT 影响，是最稳的一条

### 为什么 APM 和 RASP 都爱用 Java Agent

因为所有代码最后都变成字节码。Spring、Tomcat、MyBatis、第三方 SDK、你自己的代码，JVM 看到的都是 `.class`。Agent 卡在类加载这层就等于卡住了公共咽喉，不用改业务源码

APM 统计耗时是最典型的用法，插桩后逻辑上变成

```java
long start = System.nanoTime();

service.query();

long cost = System.nanoTime() - start;
report(cost);
```

SkyWalking、Pinpoint 都是这套

RASP 思路一样，只是插的位置换成危险的 sink

```text
命令执行    Runtime.exec / ProcessBuilder.start
SQL         Statement.execute / PreparedStatement.execute
JNDI        Context.lookup
反序列化    ObjectInputStream.readObject
文件访问    FileInputStream / FileOutputStream
```

比如 `Runtime.getRuntime().exec(cmd)`，RASP 在 exec 前面插一段 `RaspHook.checkCommand(cmd)`，安全放行，恶意抛异常——命令根本不会执行。OpenRASP 实际覆盖了哪些 sink，后面有目录走读

### agentmain 和 retransformClasses

除了 premain 还有第二个入口 agentmain，用于 JVM 已经在跑之后再动态 Attach

```text
premain    JVM 启动时 Agent 就在了
agentmain  JVM 已经在跑，Attach 机制把 Agent 塞进去
```

Tomcat 运行中，Arthas 这类诊断工具 Attach 上去，不用重启就能进 JVM，靠的就是这个

这时候会有一个问题：Agent 后来才进来，目标 Class 早就加载了怎么办？

Instrumentation 提供了 `retransformClasses()`

```java
inst.retransformClasses(UserService.class);
```

让 JVM 把这个类重新过一遍 Transformer，更新运行中的实现。所以完整图景是两条路

```text
类还没加载：.class → transform → 修改 → 加载
类已经加载：retransformClasses → transform → 修改 → 更新实现
```

### 一张图收尾

```text
                  javac
Java 源代码 ----------------> .class 字节码
                                |
                                v
                           ClassLoader
                                |
                                v
                      --------------------
                      | Instrumentation  |
                      --------------------
                                |
                         调用 Transformer
                                |
                                v
                   ClassFileTransformer
                                |
                         拿到 byte[]
                                |
                                v
                      ASM / Byte Buddy
                                |
                         修改 JVM 指令
                                |
                                v
                         新的 byte[]
                                |
                                v
                              JVM
                                |
                       验证 / 加载 Class
                                |
                                v
                         Interpreter / JIT
                                |
                                v
                            CPU
```

几个概念这样记：Java Agent 是有特殊能力的 Java 程序，Instrumentation 是 JVM 给它的官方插桩接口，ClassFileTransformer 是字节码进 JVM 前的转换 Hook，ASM / Byte Buddy 是真正改字节码的工具，Hook 是"插入执行流程"这个思想。RASP 和 APM 都是这套组合的应用

## 实验

我们这里动手走一遍先简单体会一下 Java Agent

### 证明 premain 先于 main 执行

创建 SimpleAgent

```java
package demo.agent;

import java.lang.instrument.Instrumentation;

public class SimpleAgent {

    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("Java Agent 启动了");
        System.out.println("参数: " + agentArgs);
    }
}
```

Agent 的 `MANIFEST.MF`

```text
Manifest-Version: 1.0
Premain-Class: demo.agent.SimpleAgent
```

创建app

```java
public class App {
    public static void main(String[] args) {
        System.out.println("业务 main 启动");
    }
}
```

打包运行

```bash
java -javaagent:agent.jar=hello -jar app.jar
```

![premain 先于业务 main 执行的输出](/blog/openrasp-sql-detect-bypass/02-premain-output.png)

Agent 输出在业务输出前面，最外层打通

### 观察类的加载

继续深入，我们添加 addTransformer

```java
package demo.agent;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.IllegalClassFormatException;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;

public class SimpleAgent {
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("Java Agent 启动了");
        System.out.println("参数: " + agentArgs);

        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined, ProtectionDomain protectionDomain, byte[] classfileBuffer) throws IllegalClassFormatException {
                if ("App".equals(className)) {
                    System.out.println("Agent 观察到类加载"+className);
                }
                return null;
            }
        });
    }
}
```

`addTransformer` 是向 JVM 注册一个"类加载观察者"，JVM 每加载一个类都会调它。当前 App 没有包名，所以匹配 `"App"`

构建工件，运行后结果

![Transformer 观察 App 类加载的输出](/blog/openrasp-sql-detect-bypass/03-transformer-class-loading.png)

这一步返回的还是 null（不改），下一步改成真的改

### 修改字节码，插入第一个 Hook

我们继续深入体会一下 Java Hook 思想，创建 HookAgent.java，用 Javassist 改目标方法

```java
package demo.agent;

import java.io.ByteArrayInputStream;
import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import javassist.ClassPool;
import javassist.CtClass;
import javassist.CtMethod;

public class HookAgent {
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("Agent premain: " + agentArgs);

        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                    Class<?> classBeingRedefined, ProtectionDomain protectionDomain,
                    byte[] classfileBuffer) {
                if (!"demo/app/BusinessService".equals(className)) {
                    return null;
                }

                CtClass target = null;
                try {
                    ClassPool pool = new ClassPool(true);
                    target = pool.makeClass(new ByteArrayInputStream(classfileBuffer));
                    CtMethod process = target.getDeclaredMethod("process");
                    process.insertBefore("System.out.println(\"[HOOK] process 参数: \" + $1);");
                    byte[] transformed = target.toBytecode();
                    System.out.println("Agent 已转换类: " + className);
                    return transformed;
                } catch (Exception e) {
                    System.err.println("Agent 转换失败: " + e);
                    return null;
                } finally {
                    if (target != null) {
                        target.detach();
                    }
                }
            }
        });
    }
}
```

在 App 目录，App.java，BusinessService.java

```java
package demo.app;

public class App {
    public static void main(String[] args) {
        System.out.println("业务 main 启动");
        BusinessService service = new BusinessService();
        service.process("alpha");
        service.process("beta");
    }
}
```

```java
package demo.app;

public class BusinessService {
    public void process(String value) {
        System.out.println("业务处理: " + value);
    }
}
```

运行配置

![IDEA 中 Java Agent 的运行配置](/blog/openrasp-sql-detect-bypass/04-agent-run-configuration.png)

或者执行命令

```bash
java -javaagent:agent/target/agent-1.0-SNAPSHOT.jar=hello \
  -jar app/target/app-1.0-SNAPSHOT.jar
```

可以观察到

![字节码插桩后的方法调用输出](/blog/openrasp-sql-detect-bypass/05-bytecode-hook-output.png)

那么我们就可以归纳出来调用轨迹了

```text
Agent premain
→ App.main 开始
→ JVM 首次加载 BusinessService
→ Transformer 修改它的 process 方法字节码（一次）
→ process("alpha")：先打印 Hook 日志，再执行原业务代码
→ process("beta")：再次打印 Hook 日志，再执行原业务代码
```

有个重要的时序认知从这里直接能看出来：`Agent 已转换类` 只出现一次，`[HOOK]` 出现两次。类加载和方法调用不是同一个时刻，插桩发生在前者，Hook 执行发生在后者

### 把检测逻辑从 Hook 中分离出来

目前插入的是一条打印语句，没有策略判断或者阻断，我们继续深入形成 **业务方法 → Hook → 检测逻辑 → 返回业务方法**

把上一阶段直接插入 println，改为在 process 入口插入对 [DetectionBridge.checkProcess](/Users/zhangboxiang/Progarm/shixi/agentt-hook-lab/agent/src/main/java/demo/agent/DetectionBridge.java) 的调用。[HookAgent.java](/Users/zhangboxiang/Progarm/shixi/agentt-hook-lab/agent/src/main/java/demo/agent/HookAgent.java) 仍只匹配 `demo/app/BusinessService`，但现在返回的是包含这次调用的新字节码

```java
package demo.agent;

import java.io.ByteArrayInputStream;
import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import javassist.ClassPool;
import javassist.CtClass;
import javassist.CtMethod;

public class HookAgent {
    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("Agent premain: " + agentArgs);

        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                    Class<?> classBeingRedefined, ProtectionDomain protectionDomain,
                    byte[] classfileBuffer) {
                if (!"demo/app/BusinessService".equals(className)) {
                    return null;
                }

                CtClass target = null;
                try {
                    ClassPool pool = new ClassPool(true);
                    target = pool.makeClass(new ByteArrayInputStream(classfileBuffer));
                    CtMethod process = target.getDeclaredMethod("process");
                    process.insertBefore("{ demo.agent.DetectionBridge.checkProcess($1); }");
                    byte[] transformed = target.toBytecode();
                    System.out.println("Agent 已转换类: " + className);
                    return transformed;
                } catch (Exception e) {
                    System.err.println("Agent 转换失败: " + e);
                    return null;
                } finally {
                    if (target != null) {
                        target.detach();
                    }
                }
            }
        });
    }
}
```

DetectionBridge.java

```java
package demo.agent;

public final class DetectionBridge {
    private DetectionBridge() {
    }

    public static void checkProcess(String value) {
        System.out.println("[DETECT] process 参数: " + value);
    }
}
```

运行调用

![敏感方法检测 Hook 的执行输出](/blog/openrasp-sql-detect-bypass/06-rasp-detection-output.png)

看着像是把日志从 `[HOOK]` 改名为 `[DETECT]`，但是**调用位置变了**。改写后的 process 相当于

```java
public void process(String value) {
    DetectionBridge.checkProcess(value);      // 新插入的调用
    System.out.println("业务处理: " + value);  // 原业务代码
}
```

Agent 能在目标类进入 JVM 时取得类的字节码，并返回修改后的字节码。同时可以发现：BusinessService 被转换一次，但修改后的 process 被调用两次，这里可以理解类加载和方法调用不是同一个时刻

到这里一个迷你 RASP 的骨架就有了。OpenRASP 做的事本质上是这套骨架的放大版：把 BusinessService.process 换成 JDBC 驱动的 execute，把 DetectionBridge 换成 V8 里跑的 JS 检测插件

## OpenRASP

项目：https://github.com/baidu/openrasp

### Project Struct

<img src="/Users/zhangboxiang/Library/Application Support/typora-user-images/image-20260930180001323.png" alt="image-20260930180001323" style="zoom:50%;" />

```text
openrasp/
├── agent/java            Java Agent（本文主角）
│   ├── boot              引导模块：premain / agentmain 入口、模块加载器
│   └── engine            引擎模块：Hook、检测调度、V8 桥接、云控
├── agent/php ...         PHP 扩展实现，思路相同
├── plugins/
│   ├── official/         官方检测插件
│   ├── iast/             IAST 传感器插件
│   └── addons/           辅助插件（XSS 演示、扫描器识别等）
├── openrasp-v8           V8 引擎 + SQL/命令词法器的原生实现（git 子模块）
├── cloud                 云控管理平台后端
├── rasp-vue              管理平台前端
├── rasp-install          安装脚本
└── siem                  SIEM 对接
```

### boot 和 engine 为什么分成两个模块

[boot 模块](https://github.com/baidu/openrasp/blob/master/agent/java/boot/src/main/java/com/baidu/openrasp/Agent.java)的 Agent 类就是实验里 SimpleAgent 的工程版，两个入口都有

```java
public static void premain(String agentArg, Instrumentation inst) {
    init(START_MODE_NORMAL, START_ACTION_INSTALL, inst);
}

public static void agentmain(String agentArg, Instrumentation inst) {
    init(Module.START_MODE_ATTACH, agentArg, inst);
}
```

init 只做两件事：把 agent jar 加进 Bootstrap ClassLoader 的搜索路径，然后交给 ModuleLoader 加载真正的引擎模块（入口类 EngineBoot，声明在 MANIFEST 的 `Rasp-Module-Class` 属性里）

这样拆的用意：boot 小而稳定几乎不用动，engine 是独立的 jar 可以单独升级替换（配合 attach + retransform，理论上支持不停机换引擎）

还有个细节先记下，后面绕过那章要用：init 把整个启动包在 `catch (Throwable)` 里，失败就打印一句

```text
Failed to initialize, will continue without security protection
```

然后照常跑业务。启动失败不阻断业务，保护直接没有

### EngineBoot 启动顺序

[EngineBoot.start()](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/EngineBoot.java) 按这个顺序来

```text
Loader.load()                加载 openrasp-v8 原生库（JNI：V8 引擎 + 词法器）
loadConfig()                 读取配置、初始化日志 / syslog
JS.Initialize()              初始化 V8、加载 JS 检测插件
CheckerManager.init()        注册检测器（V8AttackChecker 等）
initTransformer(inst)        创建 CustomClassTransformer 并 retransform
CrashReporter.install()      云控模式下安装崩溃上报
```

对照实验：迷你 RASP 的 premain 里"注册 Transformer"一步，在这里拆成了"加载规则 → 注册检测调度 → 安装插桩"三步，规则和插桩是解耦的

### Hook 是怎么被发现的

[CustomClassTransformer](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/transformer/CustomClassTransformer.java) 不手工维护 Hook 清单，它扫描 `com.baidu.openrasp.hook` 包下所有带 `@HookAnnotation` 注解的类，反射实例化收进集合，类加载时逐个调 `isClassMatched` 判断要不要插桩。想加检测点，写个带注解的类丢进这个包就行

已加载类的问题它也处理了

```java
public void retransform() {
    Class[] loadedClasses = inst.getAllLoadedClasses();
    for (Class clazz : loadedClasses) {
        if (isClassMatched(clazz.getName().replace(".", "/"))) {
            // hook已经加载的类，或者是回滚已经加载的类
            inst.retransformClasses(clazz);
        }
    }
}
```

遍历 JVM 里所有已加载的类，匹配上的全部 retransform 一遍

> `release()` 方法是同样的套路反着用：removeTransformer + retransform，把字节码恢复原样。这个"回滚"能力后面打检测器那章还会提到

另外 `ignoreHooks` 配置可以按类型关 Hook，写 `all` 就全关（少数标记为 necessary 的除外，比如采集请求参数那几个，关了检测就没上下文了）

### 插件和部署形态

JS 插件目录被 FileScanMonitor 监控着，插件文件一更新就重载。改规则不用重新插桩，甚至不用重启应用，这是把检测逻辑放进 JS 最直接的收益

| 插件 | 角色 |
| ---- | ---- |
| `plugins/official` | 生产检测规则 |
| `plugins/iast` | IAST 传感器，只采集不判断 |
| `plugins/addons` | 演示与辅助 |

部署形态两种：standalone 用本地配置文件，cloud 模式下配置、插件、告警都走云控平台，`rasp-install` 负责把 `-javaagent` 参数注入到各容器的启动脚本里

```text
boot(Agent.premain / agentmain)
   ↓ ModuleLoader
engine(EngineBoot) ── Transformer ── @HookAnnotation Hooks
   │                                     ↕ 插桩 / 回滚
   └── JS.Initialize ── V8(openrasp-v8) ── plugins/(official | iast | addons)
                          ↕ 云控通道
                       cloud / rasp-vue
```

## OpenRASP 怎么检测一条 SQL

就根据"一个 HTTP 请求进入 Java Web 应用，应用通过 JDBC 执行一条 SQL。OpenRASP 在哪里介入，又怎样决定放行、报警或阻断？"这个问题开始

先看一下整个时间图

```text
【JVM 启动、类加载阶段】
premain
  → 加载 OpenRASP 引擎
  → 注册 Transformer
  → 找到要 Hook 的类和方法
  → 将检测调用写入方法字节码

【应用运行、请求处理阶段】
HTTP 请求进入
  → 保存当前请求的上下文
  → 应用执行 JDBC Statement.execute(...)
  → 已插入的 Hook 收集 SQL
  → Checker 执行检测
  → 放行 / 记日志 / 阻断
```

我们必须分清的两个阶段

```text
类加载阶段：安装 Hook（装一次）
    驱动类加载 → Transformer 修改 execute 等方法的字节码

业务运行阶段：执行检测（每次调用都走）
    调用 execute(sql) → 插入的 checkSQL 运行 → 插件判断 → 放行或阻断
```

实验三、四已经验证过这个时序，下面按这两条线读源码

### 类加载阶段：SQLStatementHook

这里重点看 [SQLStatementHook.java](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/hook/sql/SQLStatementHook.java)

![SQLStatementHook 的 JDBC 驱动类匹配代码](/blog/openrasp-sql-detect-bypass/07-sql-statement-hook.png)

匹配的是 MySQL、PostgreSQL 等**具体驱动的 Statement 实现类**，同时确定数据库类型 server。这个"精确类名匹配"的写法后面绕过那章会回来细说

匹配后，[hookSqlStatementMethod（L129-L149）](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/hook/sql/SQLStatementHook.java#L129-L149)根据方法名＋描述符选择 execute、executeUpdate、executeQuery、addBatch 的特定重载，并调用 insertBefore

具体代码如下，这一段其实比较难读，这里逐行分析记录了一下

```java
    private void hookSqlStatementMethod(CtClass ctClass) throws NotFoundException, CannotCompileException {
        String[] executeFuncDescs = new String[]{"(Ljava/lang/String;)Z", "(Ljava/lang/String;I)Z",
                "(Ljava/lang/String;[I)Z", "(Ljava/lang/String;[Ljava/lang/String;)Z"};

        String[] executeUpdateFuncDescs = new String[]{"(Ljava/lang/String;)I", "(Ljava/lang/String;I)I",
                "(Ljava/lang/String;[I)I", "(Ljava/lang/String;[Ljava/lang/String;)I"};

        String executeQueryFuncDesc = "(Ljava/lang/String;)Ljava/sql/ResultSet;";

        String addBatchFuncDesc = "(Ljava/lang/String;)V";

        String checkSqlSrc = getInvokeStaticSrc(SQLStatementHook.class, "checkSQL",
                "\"" + type.name + "\"" + ",$0,$1", String.class, Object.class, String.class);
        insertBefore(ctClass, "execute", checkSqlSrc, executeFuncDescs);
        insertBefore(ctClass, "executeUpdate", checkSqlSrc, executeUpdateFuncDescs);
        insertBefore(ctClass, "executeQuery", executeQueryFuncDesc, checkSqlSrc);
        insertBefore(ctClass, "addBatch", addBatchFuncDesc, checkSqlSrc);

        addCatch(ctClass, "execute", executeFuncDescs);
        addCatch(ctClass, "executeUpdate", executeUpdateFuncDescs);
        addCatch(ctClass, "executeQuery", new String[]{executeQueryFuncDesc});
        addCatch(ctClass, "addBatch", new String[]{addBatchFuncDesc});
    }
```

把它分成三块

```text
① Desc 数组：列出要修改的具体方法签名
② checkSqlSrc + insertBefore：方法开头插 checkSQL 调用
③ addCatch：方法抛 SQLException 时插异常检查
```

**① Desc 是什么**

就是方法描述符，前面 javap 那节讲过。`(Ljava/lang/String;)Ljava/sql/ResultSet;` 翻译成人能读的形式

```text
ResultSet executeQuery(String sql)
```

为什么 execute 要列四个 Desc？因为它是重载方法，光说名字不够，JVM 靠描述符区分重载，这四个分别对应

```text
boolean execute(String sql)
boolean execute(String sql, int option)
boolean execute(String sql, int[] indexes)
boolean execute(String sql, String[] names)
```

**② checkSqlSrc 在做什么**

这一句是在**拼一段将要插入的调用代码**，不是现在就调用 checkSQL

```java
String checkSqlSrc = getInvokeStaticSrc(
    SQLStatementHook.class, "checkSQL",
    "\"" + type.name + "\"" + ",$0,$1",
    String.class, Object.class, String.class
);
```

拼出来的东西近似于

```text
SQLStatementHook.checkSQL("mysql", this, sql);
```

- `type.name`：匹配驱动类时确定的数据库类型，比如 "mysql"
- `$0`：被修改方法的当前对象，相当于 this
- `$1`：被修改方法的第一个参数，这里就是 SQL 字符串
- 后面三个 `*.class`：目标 checkSQL 方法的参数类型

四行 insertBefore 把同一段调用分别插进四个方法。用实验四对照就是同一件事

```text
process.insertBefore("DetectionBridge.checkProcess($1);");
```

只是 OpenRASP 要处理多个驱动和重载，所以写得长

**③ addCatch 是什么**

处理另一种时机：驱动方法执行时抛了 SQLException。拿 executeQuery 举例，插桩后效果大致是

```text
ResultSet executeQuery(String sql) {
    checkSQL("mysql", this, sql);     // 执行前检查

    try {
        return 原来的SQL执行逻辑(sql);
    } catch (SQLException e) {
        checkSQLErrorCode("mysql", e, sql); // SQL 异常检查
        throw e;                           // 原异常继续抛出
    }
}
```

这是帮助理解的示意，不是字节码原样。异常检查会按配置筛错误码，不是每个 SQL 异常都算数——它抓的是报错注入：注入起效时数据库会抛特定错误（MySQL 1064 语法错误、1105 XPATH 错误、1367 非几何值错误这类），对应插件里的算法3 sql_exception，默认只 log

### 请求进入：保存上下文

在 Web 请求入口（各容器的 Adapter/Filter Hook，见 hook/server/ 目录），HookHandler.checkRequest 把请求对象关联到当前线程并打开检测开关，请求结束时 onServiceExit 关开关、清缓存

所以同一请求线程里执行 SQL 时，检测器手里有两样东西

```text
SQL Hook 提供：实际要执行的 SQL
请求 Hook 提供：当前请求的参数等上下文
```

这是 RASP 检测的根基，上下文和操作在同一处汇合。没有上下文，SQL 检测就退化成"SQL 防火墙"，只能看语句本身

### 业务执行 SQL：Hook 收集数据

假设业务调用

```text
statement.executeQuery("SELECT * FROM users");
```

插入的方法入口代码先调 checkSQL，逻辑简化后

```java
public static void checkSQL(String server, Object statement, String stmt) {
    if (stmt != null && !stmt.isEmpty()) {
        HashMap<String, Object> params = new HashMap<String, Object>();
        params.put("server", server);
        params.put("query", stmt);
        HookHandler.doCheck(CheckParameter.Type.SQL, params);
    }
}
```

只是提取数据并发起检测，判断不在这里

### Java 侧把检测任务交给 JS 插件

调用链为

```text
HookHandler.doCheck(SQL, params)
    ↓ 检查当前线程、配置及全局开关
CheckerManager.check(SQL, checkParameter)
    ↓ 根据 SQL 类型选择 Checker
V8AttackChecker.checkParam(...)
    ↓
JS.Check(...)
    ↓
V8.Check("sql", 参数, 请求上下文, 超时设置)
```

CheckParameter 保存检测类型、Hook 参数及当前请求，SQL 类型对应 V8AttackChecker，JS.Check 把参数序列化成 JSON 通过 JNI 交给 V8 里注册在 sql 检测点上的 JS 函数。相关源码：[HookHandler](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/HookHandler.java#L268-L359)、[CheckerManager](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/plugin/checker/CheckerManager.java)、[JS.Check](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/plugin/js/JS.java#L112-L180)

有个容易误会的地方：**V8 是运行 JS 规则的引擎，不是自带 SQL 注入判定的黑盒**，判定逻辑全在官方插件 plugin.js 里。顺带一提，plugin.js 开头还有判断 `RASP.get_jsengine() !== 'v8'` 的兼容分支——早期版本用的 Rhino，还有一段时间 SQL/SSRF 检测是 Java 原生实现的，后来才统一进 JS 插件 + V8

### JS 插件怎么检查 SQL

![官方 SQL 检测插件的规则代码](/blog/openrasp-sql-detect-bypass/08-sql-plugin-check.png)

规则入口在官方 [plugin.js 的 plugin.register('sql', ...)](https://github.com/baidu/openrasp/blob/master/plugins/official/plugin.js#L1716-L2039)，函数接收

```text
params.query   → 实际执行的 SQL
params.server  → 数据库类型
context        → 当前请求信息
```

主要有四类算法

| 算法 | 思路 | 默认动作 |
| ---- | ---- | -------- |
| `sql_userinput` | 用户输入进入 SQL 并改变 token 结构 | block，置信度 90 |
| `sql_policy` | SQL 本身命中危险结构特征 | block，置信度 100 |
| `sql_exception` | 数据库报错特征（报错注入痕迹） | 只 log |
| `sql_regex` | 用户自定义正则 | 默认关 |

#### sql_userinput

最核心的一个，判定是一条漏斗，任何一环不过就放行

```text
遍历输入源：parameter（GET/POST/multipart）
           cookie、user-agent / referer / x-forwarded-for、JSON body
  → 参数值长度 < 8（min_length）→ 跳过
  → params.query.indexOf(value) 找不到原文 → 跳过
  → 整条 SQL 恰好等于参数值 且 allow_full 开启 → 跳过
  → 形如 "1,2,3"、"user_id,user_name" 的值 → 跳过（防误报）
  → RASP.sql_tokenize 词法分析
     （MySQL 用 ANTLR 完整语法器，其他库用简化 flex 词法器）
  → is_token_changed：输入跨越 ≥ 2 个 token（长度 > 20 时 ≥ 3）
     → 判定"SQL 结构被用户输入改写" → block
```

几个环节数得说细一点

**"输入出现在 SQL 里"不等于攻击。** 正常业务 `where name='alice'`，参数 alice 也在 SQL 里，但整段落在字符串字面量一个 token 内部，结构没变。真正的判据是 is_token_changed：tokenize 之后看用户输入覆盖的那段是不是"撑开"成了多个 token——`alice' or '1'='1` 这种闭合引号再接逻辑运算的，必然跨好几个 token。这是语义层判断，比正则黑名单高一个档次

**为什么 min_length = 8。** 短参数误报太多（id=1 这种），低于 8 个字符整个跳过。注意跳过的是所有检查，绕过那章会用到

**反探测例外。** is_token_changed 里有一段：token 跨度小于 10、且"非 SQL 关键词"的 token 少于 2 个时，不算攻击。这是防探测的——攻击者拿 `and 1=1` 这类最小 payload 一个字符一个字符试 RASP 在不在，每个都拦等于把检测器的行为告诉对方。这个例外依赖一张关键词表做子串匹配，它的缝隙后面一起看

#### sql_policy

策略检查，不管输入是谁，看 SQL 本身危不危险。为了省性能先过预筛选正则 pre_filter，不命中连 tokenize 都不做。默认开启的特征

| 特征 | 拦什么 |
| ---- | ------ |
| `union_null` | `union select NULL,NULL,NULL` / `union select 1,2,3` |
| `version_comment` | `/*!` MySQL 版本注释 |
| `function_blacklist` | load_file / sleep / benchmark / pg_sleep / is_srvrolemember / updatexml / extractvalue |
| `into_outfile` | INTO OUTFILE / DUMPFILE 写文件 |

默认关的：stacked_query（堆叠）、no_hex（0x 字面量）、information_schema（元数据表）、function_count（函数频次）。哪些开哪些关就是误报率和检出率的权衡

### V8 引擎

OpenRASP 带了一个运行 JavaScript 的引擎，就是 Google 的 V8，加上专用接口和 JNI 桥接形成 openrasp-v8 组件

| 部分 | 作用 |
| ---- | ---- |
| Java Agent、Hook | 收集 SQL、请求上下文 |
| JS 插件 | 执行检测规则 |
| V8 | 负责运行这些规则 |

```text
Java 应用准备执行 SQL
        ↓
Java Hook 获取 SQL 和请求上下文
        ↓
通过 JNI 交给嵌入的 V8
        ↓
V8 执行 plugin.js 里的 SQL 检测函数
        ↓
返回检测结果
        ↓
Java 侧处理告警或阻断
```

所以不需要打开浏览器，也不是另外起一个 Node.js 服务。规则放 JS 里的好处：插桩装在 JVM 里、规则热更新在 JS 里，策略迭代不用重新插桩；代价是多一层 JNI 开销，所以引擎侧做了 LRU 缓存——这个缓存后面打检测器那章有讲

### 小结

```text
类加载：
Transformer → 匹配 JDBC 驱动类 → 给 execute 等方法插入 checkSQL

请求运行：
请求上下文 ───────────────────────────┐
业务调用 execute(sql) → checkSQL 提取 SQL ├→ HookHandler
                                      ↓
                           CheckerManager → V8 → JS SQL 插件
                                                   ↓
                                          ignore / log / block
```

## SQL 之外还有哪些检测点

前面 sink 清单里列过一批，OpenRASP 实际覆盖了哪些，直接看 hook 包的目录就知道了，目录结构本身就是检测面清单

| 目录 / 文件 | 检测点 | 覆盖的类 |
| ----------- | ------ | -------- |
| `hook/sql/` | sql、sql_exception | 各 JDBC 驱动的 Statement / PreparedStatement / Connection |
| `hook/system/` | command | ProcessBuilder / ProcessImpl。现代 JDK 里 Runtime.exec 内部就是委托 ProcessBuilder，一处 Hook 两边都覆盖 |
| `hook/file/` | directory、readFile、writeFile、deleteFile、rename、fileUpload、link | FileInputStream / FileOutputStream / NIO Files.* / commons-fileupload / Spring 上传 |
| `hook/ssrf/` | ssrf、ssrfRedirect | URLConnection、Apache HttpClient、OkHttp、WebLogic UDDI，加重定向二次检查 |
| `hook/xxe/` | xxe | 各 XML 解析器：SAX / DOM / dom4j / JDOM / StAX / Woodstox |
| 根目录 | deserialization | ObjectInputStream（resolveClass） |
| | jndi | Context.lookup，Log4Shell 那类的关键 sink |
| | dns | 域名解析，DNS 外带通道 |
| | ognl | Struts2 OGNL 表达式（S2 系列 RCE） |
| `JspCompilationContextHook` | writeFile | JSP 编译上下文，JSP webshell 落盘走的就是写文件检测 |
| `hook/server/` | request、requestEnd、response、参数采集 | 容器适配：catalina(Tomcat)、jetty、resin、weblogic、websphere、wildfly、tongweb、bes、spring |
| `hook/dubbo/` | dubbo 生命周期 | Dubbo RPC 上下文采集 |

和官方 plugin.js 里实际注册的检测点对得上：sql / command / directory / readFile / writeFile / deleteFile / rename / fileUpload / link / include / ssrf / ssrfRedirect / xxe / ognl / eval / loadLibrary / jndi / dns / deserialization / webdav / response

### 几个代表检测点

**命令执行。** 和 sql_userinput 同构：cmd_tokenize 之后看用户输入有没有改变 token 结构。另有一个 command_common 算法，动作是 log，正则专门抓渗透特征——`cat /etc/passwd`、`nc -e /bin/sh`、`bash -i >& /dev/tcp/` 反弹 shell、`{echo,base64,-d}` 这类。定位是探针：正常业务几乎不会执行这些，出现即说明已经出事了，记下来追查

SSRF三个算法

```text
1. 参数来自用户输入且解析出内网 IP → block
2. 目标是已知回传地址（dnslog 系、requestb.in、transfer.sh）→ block
3. 目标是云厂商 metadata 地址 → block
   硬编码：169.254.169.254（AWS）
          100.100.100.200（阿里云）
          168.63.129.16（Azure）
          metadata.google.internal（GCP）
```

SSRF 里重定向是经典绕法（公网 302 跳内网），所以有 ssrfRedirect：跳转后的新地址再过一遍检查

**反序列化。** Hook 在 ObjectInputStream.resolveClass 上，每从流里解析出一个类名就和黑名单做全等比较。名单 13 个类：Commons-Collections 的 InvokerTransformer / InstantiateTransformer / ChainedTransformer（含 collections4 版本）、groovy 的 MethodClosure、TemplatesImpl、c3p0 的 PoolBackedDataSourceBase、Spring 的 ClassPathXmlApplicationContext 等。全等匹配简单可靠，但名单外的 gadget、这些类的子类都不在防线内——又是一处依赖枚举完备的地方

**XXE。** 这个检测点比较特别：除了检测，hook/xxe/ 下还有一组 DisableDom4jXxeEntity、DisableSaxXxeEntity……做法是直接改写解析器配置禁用外部实体。不是告警，是替业务把洞修上。对没法改业务代码的场景，这种虚拟补丁比报警实用

**JNDI 和 DNS 默认只 log。** 更多是给关联分析留数据源，比如 Log4Shell 爆发后翻一下 jndi 日志就知道谁中招了

## RASP 相比于 WAF 的本质区别

> RASP 相对 WAF 的本质优势是看得到最终 SQL + 完整上下文（更准确说：RASP 能在被覆盖的敏感操作处看到实际操作参数，并结合已采集的请求上下文进行判断）

假设用户提交

```text
name=alice
```

WAF 看到的是入口的输入本身

```text
用户提交了 name=alice
```

RASP 在 SQL 执行位置，还能看到应用生成的查询

```text
SELECT * FROM users WHERE name = 'alice'
```

**WAF 主要检查输入，RASP 可以检查输入经过业务处理后产生的实际操作。**

所以，某种变化如果只发生在 HTTP 表示层——URL 编码、大小写、注释插入——应用解析后又还原成同样的 SQL，那它根本影响不了 SQL 检测的判断。`sel/**/ect`、双重编码这些 WAF 时代的经典手段在 RASP 面前没有意义

但 RASP 不是没有绕过面。它的检测依赖两个前提：能把"用户输入"和"最终 SQL"对应起来（算法1 的污点关联），以及把"危险特征"枚举完整（算法2 的黑名单、Hook 的类名清单）。接下来两章就分别拆这两个前提

## SQL 注入检测的绕过

> 只在自己搭的本地环境里验证

### 总体思路

变形类手段全部无效，能打的就是那两个结构性前提，整理成几类

```text
A 类：打断"参数值 == SQL 子串"这个前提（打算法1）
B 类：token 判定层的缝隙（打算法1 的判定细节）
C 类：sql_policy 的枚举缺口（打算法2）
D 类：Hook 覆盖面的盲区（打插桩层）
E 类：杂项
```

还有一类完全不打检测逻辑、直接让检测不发生的手段，下一章单独讲

### A 类：打断「参数值 == SQL 子串」

算法1 的入口是 `params.query.indexOf(value)`，[plugin.js:1755](https://github.com/baidu/openrasp/blob/master/plugins/official/plugin.js#L1755)。匹配不上整条算法直接作废，所以问题变成：什么情况下"进到 SQL 里的字符串"和"HTTP 参数值"不一致

**1. 输入源不在采集范围内。** 插件只比对四类输入（plugin.js:701、L1818-L1858）：GET/POST/multipart 参数、Cookie、JSON body，加三个 header（user-agent / referer / x-forwarded-for）。不在视野里的：

- RESTful 路径参数，`/user/{id}` 里的 id 来自 URI path，不在 parameter map 里
- 其他 header，Authorization、Host、X-Real-IP、自定义 header
- 非 HTTP 入口，MQ 消费出来的数据、CSV 导入、缓存

**2. 二阶注入。** "输入源缺失"最典型的形态，单独说：注册时用户名存进数据库（INSERT 正常），之后某个页面把这个用户名取出来拼查询——`SELECT ... WHERE created_by='用户名'`。注入发生的那次请求里，HTTP 参数中根本不存在 payload 这个值，indexOf 自然找不到。参数化查询对二阶注入同样有效，但 OpenRASP 这种"请求上下文关联"式检测天然覆盖不了，除非做跨请求的污点传播

**3. 应用层在拼接前做了变换。** 应用拼 SQL 前先转义（PHP 的 addslashes、Java 自写的 replace("'","''")），query 里多出反斜杠或引号，参数原文对不上。二次 urldecode、大小写转换、base64 解码同理。OpenRASP 有个能容忍字符插入的 lcs_search（最长公共子串匹配），默认是关的。GBK 宽字节也是这类：转义引入的字节和连接编码互相作用后，query 和参数值对不上号

**4. 短参数。** `min_length: 8`（plugin.js:63、1734）。数一下：`'or 1=1` 是 7 个字符（引号、o、r、空格、1、=、1），低于 8，所有检查直接跳过。布尔盲注的最小可用 payload 有不少落在这个长度以下

**5. allow_full。** 整条 SQL 恰好等于参数值时放行，[plugin.js:1761](https://github.com/baidu/openrasp/blob/master/plugins/official/plugin.js#L1761)。这是给 phpMyAdmin 这类直接提交 SQL 的管理器留的口子。如果目标应用本身有传完整 SQL 的接口（报表、查询构造器），算法1 对它整体失效，只剩算法2

### B 类：token 判定层的缝隙

**distance 阈值。** plugin.js:1283-1286：注入片段要跨 ≥2 个 token（长度超 20 时 ≥3）才报警。这是防误报的，`dbname`.`table` 这种带引号的标识符会被拆成相邻 token，正常业务到处都是。想利用得把 payload 收缩进单个 token，而实际能改 SQL 语义的注入几乎必然跨 token，所以这条更多是理论窗口

**反探测白名单是子串匹配。** plugin.js:1317-1326，token 跨度小于 10、非关键词 token 少于 2 个时不报。问题出在关键词的判定方式——正则没有锚定，`test()` 是子串匹配

```js
sqliAntiDetect.test(raw_tokens[i].text) || non_kw++
```

一个 token 只要**包含**任何关键词就算关键词：`forest` 包含 `or`，`interval` 包含 `in` 和 `into`。构造一个"几乎全由关键词（或包含关键词的标识符）组成"的短 payload，非关键词 token 可以压到 2 以下，算法1 就静默了。和 distance 阈值、min_length 一层层叠下来，这个静默区不小

### C 类：sql_policy 的枚举缺口

**预筛选正则的边界。** 算法2 为了省 tokenize 开销，SQL 得先命中 pre_filter 才进后续检查（plugin.js:1874-1876）。正则里函数名两侧要求 `\W`（非单词字符）

```text
\W(information_schema|outfile|dumpfile|load_file|benchmark|pg_sleep|sleep|...)\W
```

`sleep(` 能命中（前面空格、后面括号），嵌在标识符里的不行：`to_char(` 里的 char 前面是字母 o，`unhex(` 里的 hex 前面是 n，都不命中。预筛选不命中连 tokenize 都不发生，后面的函数黑名单轮不到执行——哪怕你单独开了 hex 检测

**函数黑名单匹配完整 token。** 黑名单判断是"token 是 `(` 且前一个 token 等于名单里的名字"。`dbms_lock.sleep(5)` 在 Oracle 里 token 是 `dbms_lock.sleep` 一整个词，不等于 sleep，匹配不上。同理躲开的还有一批别名：

- 时间盲注只列了 sleep / benchmark / pg_sleep：SQL Server 的 `waitfor delay`、MySQL 的 `get_lock()`（配合两个连接）、`rlike '(a+)+$'` 正则回溯，都不在名单
- 报错注入只列了 updatexml / extractvalue：`exp(~...)`、`polygon()`、GTID 系列未覆盖，兜底的算法3 sql_exception 只 log 不拦

**union_null 的计数窗口。** 只认 union select 后面最多 5 个 token 里的两种形态：纯 NULL/逗号序列（null_count ≥ 5）或纯数字/逗号序列（num_count ≥ 5）。拿实际 token 序列走一遍

`union select 1,2,3` 的 token 是 `1 , 2 , 3`，num_count 逐个数过去正好 5，拦

`union select null,user(),version()` 的 token 是 `null , user ( ) , version (`——null_count 数到 user 就断了（只到 2），num_count 更惨，null 不是数字，第一个就断（0）。两个计数器都到不了 5，放行

混合类型的 UNION 注入整体在盲区里

**默认关闭的特征。** 堆叠（;）、0x 十六进制、information_schema 访问默认都不拦。information_schema 即使打开也只匹配 `information_schema.tables` 这一个精确形态——columns、schemata、mysql.innodb_table_stats 都不在内

### D 类：Hook 覆盖面

isClassMatched 是精确类名匹配，[SQLStatementHook.java:47-106](https://github.com/baidu/openrasp/blob/master/agent/java/engine/src/main/java/com/baidu/openrasp/hook/sql/SQLStatementHook.java#L47-L106)，这份清单值得逐条审

- **没有 MariaDB 驱动。** `org.mariadb.jdbc.*` 不在任何 SQL Hook 的匹配列表里。把 mysql-connector-java 换成 mariadb-java-client，应用功能完全正常（协议兼容），但所有 SQL 对 RASP 不可见。对攻击者是环境既定条件碰上算运气，对防御方是部署审计项：查一下 classpath 里有没有清单外的驱动
- 驱动版本升级改类名、出新包装类，匹配就脱钩。连接池 proxy（c3p0、Druid 的 wrapper）没问题——最终调用底层驱动实现类，Hook 还在——但驱动自己重构类名就会漏
- 非 JDBC 数据源：MongoDB 有单独 Hook，Redis、Elasticsearch、Cassandra 没有，NoSQL 注入不在这套体系里

### E 类：杂项

- 栈白名单：调用栈第一帧类名包含 `phpmyadmin` 就整体放行算法1/2（plugin.js:755、1860）。哪个业务的包名里恰好带这个词就等于白名单
- 算法4 sql_regex 默认空配置
- sql_exception 覆盖的库以 MySQL 为主，且只 log

## 不打检测逻辑，打检测器本身

前面所有绕过都有一个共同点：检测发生了，只是判断被糊弄过去。这章换思路：不关心判断对不对，让检测**根本不发生**

先建立一个认知：RASP 引擎自己也是个跑在同一 JVM 里的普通 Java 程序，它能插桩业务类，业务侧的代码（或者说已经在 JVM 里拿到代码执行的攻击者）同样能摸到它。不过先从不需要代码执行的部分讲——引擎自己的运行策略里就有不少"保护悄悄消失"的时刻

### 跨线程盲区

前面说过请求入口会打开"当前线程的检测开关"，看实现（HookHandler.java:377）

```java
public static void doCheck(CheckParameter.Type type, Map params) {
    if (enableCurrThreadHook.get()) {      // ThreadLocal 开关
        doCheckWithoutRequest(type, params);
    }
}
```

源码里这行的注释写得很直白

> 默认是关闭hook的，只有处理过HTTP requesst的线程才打开

enableCurrThreadHook 是个 ThreadLocal，checkRequest 在请求进入时置 true，onServiceExit 在请求结束时置回 false。SQL 这类走 doCheck 的检测点，只在"正在处理 HTTP 请求的线程"里生效

把执行挪出请求线程，检测整个不发生

```text
Tomcat 工作线程                异步线程池
─────────────                ─────────────
checkRequest: 开关 = true
业务把任务丢进 @Async ───────→  execute(sql)
                               doCheck: 开关 == false
                               直接 return，检测没发生
onServiceExit: 开关 = false
```

现实里的对应物：@Async、CompletableFuture、自建线程池、MQ 监听器、定时任务里执行的 JDBC。注意这比 A 类盲区彻底得多——输入匹配、tokenize、策略检查一整条链都没启动。现代业务异步化越来越重，这是 RASP 类产品的公认难点：上下文挂 ThreadLocal 上，线程一换就丢

### fail-open 家族

RASP 的第一原则是不能拖死业务，检测器自己出问题时只能放行。这个取舍落在代码里是一整族 fail-open 路径

| 场景 | 行为 | 位置 |
| ---- | ---- | ---- |
| Agent 初始化失败 | 应用照常运行，无保护 | boot Agent.init 的 catch |
| 插件检测抛异常 | 记日志，不拦截 | doRealCheckWithoutRequest catch Throwable |
| V8 调用异常 | 返回 null（等于无检测结果） | JS.Check 的 catch |
| JS 插件执行超时 | 引擎终止脚本，不拦截 | V8.Check(..., pluginTimeout) |
| CPU 使用率过高 | 禁用全部 hook | disableHooks 配置 + CpuMonitor |
| 云控白名单模式 | 云控注册成功前不进 hook | doCheckWithoutRequest 的 hookWhiteAll |

每一行单看都是合理的工程决策——检测器崩了总不能把业务带走。CpuMonitor 那条还专门读 `/proc/<pid>/status` 的 `Cpus_allowed_list` 算容器里的真实 CPU 占用，做得很细。但攻击者视角连起来看：制造高 CPU、制造插件异常、想办法让初始化失败，都可能让保护静默失效，而且失效往往没有对防御方可见的告警，只有一条 error 日志躺在 agent 日志文件里

### 检测结果缓存：key 里没有上下文

JS.Check 对 SQL / SSRF / 读写文件这几类检测做了 LRU 缓存（plugin.js 里那句注释"对 prepared sql 特别有效"说的就是它）

```java
Object hashData = null;
if (type == Type.DIRECTORY || type == Type.READFILE || type == Type.WRITEFILE || type == Type.SQL
        || type == Type.SSRF) {
    byte[] paramData = out.getByteArray();
    if (!Config.getConfig().getLruCompareEnable()) {
        hashData = ByteBuffer.wrap(paramData).hashCode();
    }
    ...
    if (Config.commonLRUCache.isContainsKey(hashData)) {
        return null;          // 命中缓存，直接当作干净
    }
}
```

缓存键是 hook 参数序列化后的哈希——对 SQL 就是 `{server, query}` 这份文本，不含任何请求上下文。流程：第一次见到某条 SQL，走完 V8 检测，结果是干净的，hash 进缓存；第二次同样文本的 SQL 直接 return null

对 sql_policy 这种"纯函数于查询文本"的判断，缓存是安全的，同一条 SQL 判一百次结果一样。但 sql_userinput 的判定依赖上下文（哪些参数匹配上了），同一条 SQL 文本在不同请求里结论可以不同。理论上的利用窗口：先用一个参数源不在采集范围的请求（比如 payload 走路径参数）让这条 SQL 以"干净"结论进缓存，再用正常参数源触发同一条 SQL——检测被缓存跳过。实际限制在于 SQL 文本必须完全一致，构造起来不总是方便，但这个 key 的选择值得防御方注意

### 配置和开关面

不需要写代码就能摸到的开关：ignoreHooks 按类型关 Hook（值可以是 all），URL 白名单按检测点粒度放行，云控通道能下发配置和插件。拿到配置权限等于拿到检测器开关，这部分属于权限管理范畴

### 拿到代码执行之后

如果攻击者已经在 JVM 里有了代码执行，对抗就进到字节码层面，几个方向（研究性质）

- **回滚插桩。** CustomClassTransformer.release() 自己演示了标准操作：removeTransformer + retransform，字节码恢复原样。攻击者拿到 Instrumentation 实例（比如再 attach 一个自己的 agent）可以用同样序列拔掉插桩
- **反射关开关。** enableHook、enableCurrThreadHook 都是可反射修改的字段
- **内存马。** Filter / Listener 型内存马不落盘，绕过"文件写入 + JSP 编译"这条检测链，但注册组件和后续请求处理仍在 server hook 视野内。这块是现在 Java 攻防研究的热点，双方在 hook 覆盖面上持续拉锯

有个问题顺带说清楚：阻断的实现是在被插桩方法开头抛 `SecurityException("Request blocked by OpenRASP")`，异常一抛原来的 execute 压根不会执行。所以业务代码 try-catch 吞异常不能"让 SQL 照跑"，只能把报错压掉，数据库那边什么都没发生

## IAST：同一套底座的另一种用法

最后看 plugins/iast，它和 official 插件共用同一套 Hook 和上下文，但角色完全不同：不内置任何攻击判定，只做传感器

代码很薄，核心两步

```text
1. 注册几乎所有检测点，每次触发把 hook 参数和请求上下文暂存
   （sql 附带 RASP.sql_tokenize 结果，command 附带 cmd_tokenize 结果）

2. 请求结束时（requestEnd）把整包数据 POST 出去
```

```js
var data = {
    "web_server":     web_server,     // 应用监听的地址端口
    "context":        new_context,    // 本次请求的完整上下文
    "hook_info":      hook_info,      // 这次请求触发过的所有 sink 及参数
    "plugin_version": plugin_version
}
// 默认发往 http://127.0.0.1:25931/openrasp-result
// 请求头带 scan-request-server 时，发往 header 指定的地址
RASP.request(request_config)
```

判断全在外置的扫描服务器上：拿到"哪个请求触发了哪些 sink、参数长什么样"之后做关联分析、重放和主动 fuzz。火线洞态（DongTai）就是兼容这一思路的开源实现

和几种常见模式对比

| | SAST | DAST | IAST（灰盒） | RASP |
| - | ---- | ---- | ------------ | ---- |
| 形态 | 静态扫源码 | 黑盒扫流量 | 测试环境 agent + 扫描器 | 运行环境 agent |
| 看到什么 | 源码 | HTTP 请求 | 上下文 + sink 参数 | 上下文 + sink 参数 |
| 误报/漏报 | 误报高 | 漏报高 | 较均衡 | 误报低（上下文最全） |
| 实时拦截 | 不能 | 不能 | 一般不拦 | 能 |
| 代价 | CI 集成 | 打到哪测到哪 | 测试环境性能 | 生产性能开销 |

RASP 和 IAST 的关系从架构图直接能读出来：Hook 和上下文采集是通用底座，official 和 iast 只是挂在 V8 上的两种消费者——一个要毫秒级给拦截决策，一个可以把数据慢慢送出去离线分析

## RASP 的局限性

写到这里其实可以回答一个现实问题：RASP 这几年为什么不温不火了

安全圈的热词也从 RASP 变成了 eBPF、CNAPP、供应链、大模型

### 寄生

RASP 跑在业务进程内部，这个部署模型决定了两件事

一是性能。每条 SQL 都要走一遍 JNI + V8 + tokenize，大流量下几个点的损耗，业务方不一定愿意买单。所以引擎侧又是 LRU 缓存又是预筛选正则，全是省开销的补丁

二是稳定性绑定。RASP 内存泄漏就是业务泄漏，RASP 卡死就是业务卡死。前面 fail-open 那张表现在可以给出真正的解读了：CPU 超 90% 就关 hook、插件异常就放行、初始化失败就裸奔——这不是设计失误，是**不敢 fail-closed**。寄生者不敢弄死宿主

再往深了说是责任问题：装了 RASP，误拦一笔支付订单谁背锅？所以大部分实际部署最后都跑在 log 模式

但是log 模式的 RASP 就是个昂贵的 IDS，告警进了 SIEM 然后没人看

### 上限

绕过那两章其实已经把老底掀出来了

RASP 相对 WAF 的优势是视野——看得到最终 SQL 和完整上下文。但它的判断逻辑没有跟上视野：污点关联是 indexOf 字符串匹配级别，不是真正的污点传播（跨线程、二阶注入、MQ 输入全丢）；策略检测是黑名单枚举（waitfor、混合 union、换 MariaDB 驱动直接隐身）。视野是 SQL 执行点级别的，判断还是 WAF 那套思路

所以它的真实能力是"已知攻击模式的运行时确认"，逻辑漏洞、业务漏洞、新 gadget 链，都指不上。再加上每个业务接入都要调白名单和阈值（phpmyadmin 栈白名单、URL 白名单、ignoreHooks 全是运营补丁），安全团队根本没人力持续养它

### 生产环境的变化

- **语言绑定**。JVM 系插桩好使，PHP 靠扩展硬写，Go 这种静态编译的根本插不进桩。云原生时代一个公司里 Java/Go/Python/Node 混着来，一个语言一个 agent，维护成本直接爆炸
- **eBPF 把观测的活抢了**。不动业务进程、近零开销，网络层 + 系统调用层都看得到，容器运行时安全（CWPP）厂商全转过去了。RASP 引以为傲的"in-process 可见性"优势被平掉了大半
- **左移把修复的活抢了**。SCA、IAST、CI 里的 SAST 在开发测试期就把问题解决了，RASP 作为运行时补偿控制，定位变成"上线了才发现问题时的应急手段"
- **部署模型被云原生冲了**。不可变基础设施、容器一跑一销毁，往镜像里塞 agent 这件事本身就反潮流

## 参考文章

[OpenRASP 官方仓库](https://github.com/baidu/openrasp)

[OpenRASP 官方文档 - 检测算法说明](https://rasp.baidu.com/doc/dev/official.html#sql)

[OpenRASP 官方文档 - Java Agent 原理](https://rasp.baidu.com/doc/install/software.html)

[洞态 DongTai - IAST 开源实现](https://github.com/HXSecurity/DongTai)

## 附录：java 启动命令的结构

```text
java [启动选项] <运行入口> [程序参数]
```

两种常见入口

```text
java [启动选项] -cp 类路径 主类名 [程序参数]
java [启动选项] -jar 程序.jar [程序参数]
```

本项目示例

```text
java -javaagent:agent.jar=hello -cp out/production/agentt App Alice
```

| 部分 | 作用 | 谁接收 |
| ---- | ---- | ------ |
| `-javaagent:agent.jar=hello` | JVM 启动时加载 Agent | `premain` 收到 `hello` |
| `-cp out/production/agentt` | 指定查找 `.class` 的位置 | Java 启动器 |
| `App` | 指定业务主类 | 调用 `App.main` |
| `Alice` | 程序参数 | `main` 的 `args[0]` |

**位置最重要**：`-javaagent` 要放在主类 `App` 前面，放在 `App` 后面就只是传给 `main` 的字符串，不会加载 Agent。在 IDEA 中：**VM 选项**填 `-javaagent:...`，**主类**填 `App`，**程序实参**填想传给 `main` 的内容

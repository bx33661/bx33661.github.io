---
title: "Windows应急响应和安全"
description: "Windows下安全分析和应急响应分析"
date: 2025-05-15
tags:
  - "Windows"
  - "Security"
  - "bx"
  - "data"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "bx33661win1"          # 随机URL字符串
---

<meta name="referrer" content="no-referrer">

# Windows应急响应和安全

:::info
体验的话可以自行采用云服务上采用安装 Windows server 系列系统

我这里采用阿里云云服务演示

采用 Windows 自带的远程桌面连接

:::

## IIS 学习

> <font style="color:rgb(0, 0, 0);">基本概念：</font>
>
> IIS（Internet Information Services）是微软提供的 Web 服务器平台，最早随 NT3.51 一起发布，现在几乎成为 Windows Server 上的标准组件之一。它不仅可以把 .NET、ASP、PHP、Node.js、Java（通过 Tomcat/Bridge）等站点托管在 Windows 机器上，还提供 FTP、SMTP、WebDav 等服务，并带有一整套系统管理与扩展接口。

目前很多企业之类的都在用 IIS，再内网 OA，办公区等应用下都在采用

### 核心的架构

_---摘自网上_

+ **HTTP.sys (HTTP Protocol Stack)**_：这是一个在 Windows 内核模式下运行的驱动程序。它负责监听来自网络的 HTTP 和 HTTPS 请求。当请求到达时，HTTP.sys 会接收它，然后根据请求的目标站点和应用程序，将其分发给正确的应用程序池队列，而不需要将请求直接交给用户模式下的工作进程，效率非常高。_
+ **WAS (Windows Process Activation Service)**_：中文名叫“Windows 进程激活服务”。WAS 负责管理应用程序池和工作进程的生命周期。它根据需要启动或停止工作进程 (_`_w3wp.exe_`_)，监控它们的健康状况，并在它们无响应或崩溃时进行回收或重启。WAS 不仅处理 HTTP 请求，还能通过非 HTTP 协议（如 TCP, Named Pipes）激活应用程序，这对于 WCF (Windows Communication Foundation) 服务非常重要。_
+ **应用程序池 (Application Pool)**_：如前所述，这是一个隔离单位。你可以把它想象成一个“容器”，里面运行着一个或多个网站。每个池都有一个独立的工作进程 (_`_w3wp.exe_`_)。_
+ **工作进程 (Worker Process - w3wp.exe)**_：这是真正执行代码的地方。当一个请求从 WAS 交给应用程序池后，对应的工作进程会加载 ISAPI 扩展（如 ASP.NET、PHP 的处理程序），处理请求，生成动态内容，然后将响应返回给 HTTP.sys，最终发送给客户端。_

__

### 常见组件和目录

```python
# 打开IIS管理器
inetmgr

# 重启 IIS（慎用）
iisreset

# 查看监听端口
netstat -ano | findstr :80

# 查询站点目录
%SystemDrive%\inetpub\wwwroot\
```

1. **C:\inetpub\wwwroot**：默认网站根目录
2. **IIS 管理器**：图形化管理工具，运行 `inetmgr`
3. **应用程序池（App Pools）**：运行网站的隔离环境
4. **网站（Sites）**：一个IIS实例下可配置多个网站，每个可绑定不同域名和端口



例如

```python
C:\inetpub\logs\LogFiles\W3SVC1\   
```

W3SVC1--->`World Wide Web Publishing Service #1`





### 服务器管理器

可以理解成

<font style="color:rgb(31, 35, 40);">服务器管理器就是 Windows Server 的"软件商店+系统监控+服务管理"的综合工具</font>

[服务器管理器](https://learn.microsoft.com/zh-cn/windows-server/administration/server-manager/server-manager)

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752929163563-ad152ba2-7c73-4dba-a202-cb7daea9bbb3.png)

__

## 概念认识

### 注册表

> Windows 注册表是一个**集中管理系统配置的数据库**，它保存了：
>
> + 操作系统设置（比如网络配置、驱动程序、服务）
> + 应用程序配置
> + 用户配置（如桌面壁纸、默认浏览器）
> + 启动项、系统策略、安全策略等

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752895480806-559fb01c-3dfc-4b15-9bbe-35e25a1db2c5.png)

注册表结构

 由**键（Key）和值（Value）**组成  ，层级结构的文件系统

```plain
HKEY_LOCAL_MACHINE
    └── SOFTWARE
        └── Microsoft
            └── Windows
                └── CurrentVersion
                    └── Run
                        → 启动项列表
```

五个根键

| 根键名称                       | 说明                             |
| ------------------------------ | -------------------------------- |
| **HKEY_LOCAL_MACHINE (HKLM)**  | 系统级设置（全局）               |
| **HKEY_CURRENT_USER (HKCU)**   | 当前登录用户的设置               |
| **HKEY_CLASSES_ROOT (HKCR)**   | 文件关联和 COM 对象信息          |
| **HKEY_USERS (HKU)**           | 所有用户的配置（HKCU是它的子集） |
| **HKEY_CURRENT_CONFIG (HKCC)** | 当前硬件配置                     |




一个注册表项（Key）可以有多个值（Value）

常见值类型：

| 类型           | 名称     | 说明                      |
| -------------- | -------- | ------------------------- |
| `REG_SZ`       | 字符串值 | 常见的文本                |
| `REG_DWORD`    | 双字节   | 通常用于开关（0/1）或数值 |
| `REG_BINARY`   | 二进制   | 原始数据                  |
| `REG_MULTI_SZ` | 多字符串 | 多个路径或参数            |




** Hive 的实际存储位置和映射关系  **

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752895593102-4580d966-5172-42c2-9e22-bb7e2c308368.png)

| Hive 文件路径（系统磁盘）                                    | 映射的注册表键                       |
| ------------------------------------------------------------ | ------------------------------------ |
| `C:\Windows\System32\config\SAM`                             | `HKLM\SAM`<br/> （账户信息）         |
| `C:\Windows\System32\config\SYSTEM`                          | `HKLM\SYSTEM`<br/> （系统设置）      |
| `C:\Windows\System32\config\SOFTWARE`                        | `HKLM\SOFTWARE`<br/> （程序设置）    |
| `C:\Windows\System32\config\SECURITY`                        | `HKLM\SECURITY`<br/> （安全策略）    |
| `C:\Windows\System32\config\DEFAULT`                         | `HKU\.DEFAULT`<br/> （默认用户设置） |
| `C:\Users\<用户名>\NTUSER.DAT`                               | `HKCU`<br/>（当前用户设置）          |
| `C:\Users\<用户名>\AppData\Local\Microsoft\Windows\UsrClass.dat` | `HKCU\Software\Classes`              |






### 守护进程

在Windows系统中，**守护进程**对应的概念是**Windows服务（Windows Service）**，它们是在后台运行的程序，不需要用户交互。









### IPS




### Windows句柄


## 关键文件夹

### Temp 文件夹📂

`C:\Windows\Temp` 是 **Windows系统的主要临时文件夹**。它的核心作用是为操作系统本身以及以系统权限运行的各种服务和应用程序提供一个存放**临时文件**的地方。  





### %UserProfile%\Recent

可以直接输入`WIN+R`输入地址进入

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752894461533-7b5b7733-8564-4c87-ae77-764aa6359e91.png)

每当你在电脑上打开一个文件（如文档、图片、视频）或访问一个文件夹时，Windows会自动在这个 `Recent` 文件夹里创建一个指向该项目的小快捷方式（`.lnk` 文件）。

这些快捷方式的作用是为Windows的“**最近使用的项目**”或“**快速访问**”等功能提供数据来源。例如，你在文件资源管理器的“快速访问”列表中看到的“最近使用的文件”，其列表就是通过读取这个文件夹的内容生成的。



所以

**基本上，你以交互方式打开或访问过的任何文件、文件夹、应用程序，甚至是驱动器，系统都会在这里创建一个快捷方式（.lnk 文件）作为记录。  **

****

****

****

## 关键应用

### 资源监听器

排查异常情况

比如说挖矿程序这些，cpu 占用都很高 



可以查看

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752824145718-99b68bab-ee8c-406d-a64d-fb3952eca89c.png)

几种异常

| 行为         | 如何识别                                              |
| ------------ | ----------------------------------------------------- |
| ✅ 反弹 shell | 某个陌生进程（如 notepad.exe）连接到外部 IP（反常）   |
| ✅ C2 通信    | 每隔几十秒连接某个海外 IP，流量少但持续               |
| ✅ 持久后门   | 有进程一直监听本地端口（如 4444），但系统中没注册服务 |












任务计划程序里面查找具体信息

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752825910331-cb495b07-c529-404f-a9ac-884554f9466e.png)

> QuarkUpdaterTaskUser1.0.0.12{6D1CC153-AE05-4C07-937A-3E665BAF024D}
>
> 后面的这个字符是 GUID 唯一标识符号，方便确定











计算机管理中的本地用户和组

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752826058924-06483412-7b6e-46ef-8e4c-a2b6f9c85642.png)









## 一些尝试技巧

### Everyting

everything 这个软件太方便了，可以帮助我们快速定位

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1752896605898-530cd2bb-5e88-43f7-81b0-9d6707b38f70.png)

比如说是一个恶意文件会释放出来一些恶意文件一旦我们出发时候

借助 everything 就可以快速帮助我们你查看哪些新东西出现

然后定位到释放出来的位置




---
title: "Spring学习与分析 - 从Servlet到SpringBoot的演进"
author: "bx"
description: "深入理解Spring框架的设计理念，从传统Servlet容器到SpringBoot的演进过程，包括MVC架构、POJO规范、自动配置机制等核心概念。"
pubDatetime: 2025-10-30
tags:
  - "Spring"
  - "SpringBoot"
  - "Java"
  - "后端开发"
  - "Web框架"
draft: false
slug: "spring-learning-analysis"
cover: "/blog/spring-learning-analysis/spring-mvc-flow.png"
---

<meta name="referrer" content="no-referrer">

# Spring学习与分析

> 最近在上课，闲余时间搞一点小开发什么的，主要也是想深入以开发的角度学习一下spring，感觉还是有点帮助的

本文将从传统Servlet容器开始，逐步深入Spring框架的核心概念，帮助你理解从传统Java Web开发到现代SpringBoot开发的演进过程。

## 传统的Servlet容器方式

> 也就是在 Tomcat、Jetty、Resin 等 Servlet 容器里运行 Web 应用

在传统模式下，Web 应用不是直接运行的 JAR，而是需要打成一个 **`.war` (Web Archive)** 文件

### Maven配置

```groovy
<packaging>war</packaging>
```

### 目录结构

```groovy
your-app.war
 └── WEB-INF/
      ├── web.xml
      ├── classes/   （编译后的字节码）
      └── lib/       （依赖的jar包）
```

### 部署流程

主要一个流程如下：

```groovy
打 WAR 包 →

写 web.xml 注册 Servlet/Filter →

放到容器的 webapps →

启动容器访问应用。
```

### Tomcat映射逻辑

在Tomcat中映射逻辑如下，`ROOT` 对应的就是`/`：

| 位置 | 上下文路径（Context Path） | 访问方式示例 |
| --- | --- | --- |
| `webapps/ROOT/` | `/` (默认) | `http://localhost:8080/` |
| `webapps/test/` | `/test` | `http://localhost:8080/test/` |
| `webapps/blog/` | `/blog` | `http://localhost:8080/blog/` |

## web.xml配置详解

[配置 web.xml 部署描述符 | Google App Engine flexible environment docs | Google Cloud](https://cloud.google.com/appengine/docs/flexible/java/configuring-the-web-xml-deployment-descriptor?hl=zh-cn)

很全面的一个web.xml示例规范：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://java.sun.com/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"
         version="3.0">

    <!-- 应用显示名 -->
    <display-name>My Traditional Java WebApp</display-name>

    <!-- 全局上下文参数（在 ServletContext 中可读） -->
    <context-param>
        <param-name>app.mode</param-name>
        <param-value>prod</param-value>
    </context-param>

    <!-- 监听器：常用于初始化资源/集成框架 -->
    <listener>
        <listener-class>com.example.listener.AppContextListener</listener-class>
    </listener>

    <!-- 编码过滤器（中间件） -->
    <filter>
        <filter-name>EncodingFilter</filter-name>
        <filter-class>com.example.filter.EncodingFilter</filter-class>
        <init-param>
            <param-name>encoding</param-name>
            <param-value>UTF-8</param-value>
        </init-param>
    </filter>
    <filter-mapping>
        <filter-name>EncodingFilter</filter-name>
        <url-pattern>/*</url-pattern>
        <dispatcher>REQUEST</dispatcher>
    </filter-mapping>

    <!-- 业务 Servlet -->
    <servlet>
        <servlet-name>HelloServlet</servlet-name>
        <servlet-class>com.example.servlet.HelloServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
        <init-param>
            <param-name>greeting</param-name>
            <param-value>Hello</param-value>
        </init-param>
        <async-supported>true</async-supported>
    </servlet>
    <servlet-mapping>
        <servlet-name>HelloServlet</servlet-name>
        <url-pattern>/hello</url-pattern>
    </servlet-mapping>

    <!-- 会话 & 安全配置 -->
    <session-config>
        <session-timeout>30</session-timeout>
        <cookie-config>
            <http-only>true</http-only>
            <secure>true</secure>
        </cookie-config>
        <tracking-mode>COOKIE</tracking-mode>
    </session-config>

    <!-- 错误页映射 -->
    <error-page>
        <error-code>404</error-code>
        <location>/error/404.jsp</location>
    </error-page>
    <error-page>
        <exception-type>java.lang.Throwable</exception-type>
        <location>/error/500.jsp</location>
    </error-page>

    <!-- 欢迎页列表 -->
    <welcome-file-list>
        <welcome-file>index.jsp</welcome-file>
        <welcome-file>index.html</welcome-file>
    </welcome-file-list>
</web-app>
```

### 注解时代的到来

从 **Servlet 3.0** 开始，可以用注解自动注册，无需再写 `web.xml`。

**`@WebServlet`** 代替 `<servlet>` 和 `<servlet-mapping>`，一个简单的例子：

```java
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/hello")
public class HelloServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        resp.getWriter().println("Hello World!");
    }
}
```

同理：
- `@WebFilter` 代替 `<filter>` 和 `<filter-mapping>`
- `@WebListener` 代替 `<listener>`

### 过滤器机制

> 就是Java Web的中间件

过滤器 (javax.servlet.Filter) 是在请求到达 Servlet/JSP 之前和响应返回客户端之前执行的一段逻辑。它是典型的责任链模式：多个过滤器可以按顺序链式调用。

整个流程：

```groovy
客户端发起请求 →
容器（Tomcat）检查 URL 映射到哪些 Filter →
依次执行这些 Filter 的 doFilter() →
执行目标 Servlet/JSP →
响应返回时，再倒序经过这些 Filter →
返回给客户端。
```

**常见应用场景：**

1. **统一编码处理**
```groovy
<filter>
    <filter-name>EncodingFilter</filter-name>
    <filter-class>com.example.filter.EncodingFilter</filter-class>
    <init-param>
        <param-name>encoding</param-name>
        <param-value>UTF-8</param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>EncodingFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

2. **登录认证**
```groovy
<filter>
    <filter-name>AuthFilter</filter-name>
    <filter-class>com.example.filter.AuthFilter</filter-class>
</filter>
<filter-mapping>
    <filter-name>AuthFilter</filter-name>
    <url-pattern>/secure/*</url-pattern>
</filter-mapping>
```

## Spring框架的演进

> Spring 并不是完全取代 Servlet，而是在 Servlet 基础上演进出来的更高层框架

### 项目目录规范

在src目录下存放java代码，遵循标准的Maven/Gradle项目结构：

- `controller/`：REST 接口或 MVC 控制器
- `service/`：业务逻辑（接口 + 实现类）
- `repository/`：数据访问（通常是 JPA、MyBatis）
- `model/ 或 entity/`：数据库实体类
- `config/`：Spring 配置类，例如 `WebMvcConfigurer`、`SecurityConfig`

### Spring MVC工作流程

Spring MVC 的核心是 `DispatcherServlet`，它作为前端控制器处理所有请求：

```jsx
请求 → DispatcherServlet → Controller → Service → Mapper → DB → 返回
```

![Spring MVC工作流程](/blog/spring-learning-analysis/spring-mvc-flow.png)

### 常用注解详解

1. **@Controller** - 标记类是一个控制器，返回页面视图
2. **@RestController** - = `@Controller + @ResponseBody`，直接返回 JSON
3. **@RequestMapping** - 定义请求路径和方法，类上 + 方法上结合使用
4. **@GetMapping / @PostMapping / @PutMapping / @DeleteMapping** - 更具体的请求方式映射
5. **@RequestParam** - 获取 URL 参数
6. **@PathVariable** - 获取路径参数
7. **@RequestBody** - 获取请求体 JSON → Java 对象

### 实际应用示例

**LoginController.java**

```java
package com.bx33661.springlearn.controller;

import com.bx33661.springlearn.entity.User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {
    @PostMapping("/login")
    public String login(User user) {
        System.out.println("name: " + user.getName());
        System.out.println("password: " + user.getPassword());
        return "success";
    }
}
```

**User.java**

```java
package com.bx33661.springlearn.entity;

public class User {
    private String name;
    private String password;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
```

这里的关键在于：`@PostMapping("/login")` 方法的 `login(User user)` 能够直接接收一个 User 对象作为参数，这是因为 `Spring Framework` 的 **参数绑定（Parameter Binding）** 和 **消息转换（Message Conversion）** 机制在背后自动完成了 HTTP 请求数据到 Java 对象的转换。

## POJO和JavaBean规范

### POJO - Plain Old Java Object

POJO 是一种轻量级的 Java 对象，遵循以下约定：

- POJO 的属性（字段）通常是私有的（private），通过 getter 和 setter 方法访问，以保证封装性
- 为每个私有字段提供公有的 getter 和 setter 方法，遵循命名约定：
  - Getter：getXxx()（对于布尔类型可以是 isXxx()）
  - Setter：setXxx(T value)

**主要示例就是上面那个User类**

### JavaBean规范

> JavaBean 是一种特殊的 POJO，符合 JavaBean 规范的类

**规范要求：**
1. 必须有一个无参构造函数（方便反射创建对象）
2. 属性必须是 **私有的（private）**
3. 提供对应的 **getter/setter 方法** 来访问属性
4. 可以实现 `Serializable` 接口（方便序列化和传输）

**具体示例：**

```java
import java.io.Serializable;

public class Student implements Serializable {
    // 为了避免不同编译器生成不同的序列化ID
    private static final long serialVersionUID = 1L;

    private String id;
    private String name;

    // 必须有无参构造函数
    public Student() {}

    // 有参构造也可以，方便初始化
    public Student(String id, String name) {
        this.id = id;
        this.name = name;
    }

    // Getter / Setter
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // 重写toString，方便打印对象
    @Override
    public String toString() {
        return "Student{id='" + id + "', name='" + name + "'}";
    }
}
```

## Resource目录学习

主要是存放一些资源，但是具体规范需要看是什么资源：

- `static/` → 存放静态资源（HTML、JS、CSS、图片），对应 `/` 路径访问
- `templates/` → 模板引擎文件（如 Thymeleaf）
- `META-INF/resources/` → 优先级最高的静态资源目录

这个目录会被原样拷贝到编译输出目录：

```java
target/classes/
```

效果就是：

```java
src/main/resources/application.properties
→ target/classes/application.properties
```

所以我们可以这样去写：

```java
InputStream in = getClass().getResourceAsStream("/application.properties");
```

## Spring错误处理机制

> Spring Boot 内部有一个 `BasicErrorController`，会拦截错误并返回默认的 JSON 或 HTML

### 典型的报错界面

![Spring Boot错误页面](/blog/spring-learning-analysis/spring-error-page.png)

### JSON格式错误信息

```java
{
  "timestamp": "2025-09-29T13:22:33.134+00:00",
  "status": 404,
  "error": "Not Found",
  "message": "No message available",
  "path": "/test"
}
```

**错误信息解析：**
- type=Not Found, status=404：表示服务器无法找到请求的资源
- This application has no explicit mapping for /error：说明应用程序没有为 /error 路径定义自定义的错误处理页面
- 时间戳记录了错误发生的时间

### 自定义错误页面

> ⚠️ 注意：Spring Boot 会自动根据 HTTP 状态码，去 `templates/error/` 或 `static/error/` 下找对应的页面

目录结构：

```java
src/main/resources/
    └── templates/error/      # 或者 static/error/
        ├── 404.html
        ├── 500.html
        └── error.html
```

如果是使用Thymeleaf这种模板引擎的话，需要注意依赖和对应控制器设置。

同时可以自定义错误控制器，覆盖原生的错误处理：

```java
@Controller
public class MyErrorController implements ErrorController {

    @RequestMapping("/error")
    @ResponseBody
    public Map<String, Object> handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Map<String, Object> map = new HashMap<>();
        map.put("code", status);
        map.put("msg", "出错啦，请联系管理员~");
        return map;
    }

    public String getErrorPath() {
        return "/error";
    }
}
```

## SpringBoot的革命性改进

"约定优于配置"也称为**Convention over Configuration**，也叫 CoC 原则。

简单的理解：你不需要显式写一堆重复的配置，只要遵循框架规定的默认规则，框架就会帮你自动完成；只有当你需要自定义时，才去写额外配置。

**对比传统开发：**
传统方式需要写很多XML等配置文件，大部分时间都在调试和写配置文件。SpringBoot就是要解决这样的难题。

**约定优于配置的例子：**

- **目录结构**：默认会从启动类所在包向下扫描 `@Component`、`@Service`、`@Controller`，不用你在 XML 里手动声明
- **application.properties**：只要写最少的配置，比如数据库连接，其它（比如连接池、事务管理器）Spring Boot 会按约定帮你自动装配
- **静态资源**：只要把 CSS/JS/图片放在 `src/main/resources/static/` 下，就能直接通过 `/xxx.css` 访问，无需额外配置路径
- **模板页面**：默认放在 `src/main/resources/templates/`，就能自动被 Thymeleaf/Freemarker 解析

### SpringBoot启动示例

```java
package org.example.start;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StartApplication {

    public static void main(String[] args) {
        SpringApplication.run(StartApplication.class, args);
    }
}
```

### 启动日志分析

```text
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.5.6)

2025-09-28T20:48:34.589+08:00  INFO 36440 --- [start] [           main] org.example.start.StartApplication       : Starting StartApplication using Java 17.0.16 with PID 36440
2025-09-28T20:48:34.591+08:00  INFO 36440 --- [start] [           main] org.example.start.StartApplication       : No active profile set, falling back to 1 default profile: "default"
2025-09-28T20:48:35.143+08:00  INFO 36440 --- [start] [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port 8080 (http)
2025-09-28T20:48:35.429+08:00  INFO 36440 --- [start] [           main] org.example.start.StartApplication       : Started StartApplication in 1.174 seconds (process running for 1.676)
```

从启动日志可以看出，我们只写了一个 `main()`，其他（Tomcat 启动、Servlet 注册、Bean 扫描）都由框架根据"约定"帮你完成。

### Starter 机制

我们用IDEA时发现，快捷构建spring项目，有很多一站式的starter。

Spring Boot 官方和社区提供了各种 `spring-boot-starter-*`：

| Starter | 整合功能 |
| --- | --- |
| `spring-boot-starter-web` | 内嵌 Tomcat + Spring MVC，快速开发 RESTful API |
| `spring-boot-starter-data-jpa` | JPA + Hibernate，方便操作数据库 |
| `spring-boot-starter-data-redis` | Redis 整合（Lettuce 客户端） |
| `spring-boot-starter-security` | 安全框架 Spring Security |
| `spring-boot-starter-thymeleaf` | 模板引擎 Thymeleaf |
| `spring-boot-starter-amqp` | RabbitMQ 消息队列 |
| `spring-boot-starter-test` | JUnit5 + Spring Test + MockMvc 等测试工具 |

拥有这些，我们只需要在 `pom.xml` 或 `build.gradle` 里加一个 starter，Spring Boot 会自动帮你把依赖和配置整合好。

**Spring Boot 的灵魂在于：**
- **@EnableAutoConfiguration** 注解（隐含在 `@SpringBootApplication` 里）
- 会根据 **classpath 里有没有相关依赖**，自动加载对应的配置

例如：
- 你引入了 `spring-boot-starter-data-redis`，Spring Boot 就会自动创建 `RedisTemplate` 和 `LettuceConnectionFactory`
- 你引入了 `spring-boot-starter-web`，Spring Boot 自动帮你配置 DispatcherServlet、Jackson、Tomcat

配置文件 `application.yml` 里，你只要覆盖关键参数即可：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456
```

## 开发体验优化

### 热部署

> Hot Deployment是指在不停止或重启应用程序的情况下，将更新后的代码、配置文件或其他资源直接应用到运行中的系统，使其生效

这里不细说具体哪种方案，就说平时测试的热部署。

需要用到`spring-boot-devtools`：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <optional>true</optional> <!-- 防止被下游依赖到生产包 -->
</dependency>
```

在build标签中配置：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
      <configuration>
        <addResources>true</addResources>
      </configuration>
    </plugin>
  </plugins>
</build>
```

如果是在IDEA里面的话，需要把这个"自动构建项目"打开：

![IDEA自动构建设置](/blog/spring-learning-analysis/idea-auto-build.png)

具体效果就类似Python那些web框架，修改就生效，不过这个方案适用于测试或者小型项目。

## 模板引擎 - Thymeleaf

[Thymeleaf](https://www.thymeleaf.org/) 是现代的服务端Java模板引擎，能够处理HTML、XML、JavaScript、CSS甚至纯文本。

## 其他重要概念

### Properties文件规范

> 主要记录一下这个文件格式规范

`.properties` 是一种最简单的配置文件格式，特点如下：

**基本语法：**
```
key=value
```
或者
```
key: value
```
（在 Spring Boot 里这两种都可以，推荐 `=`）

**注释：** 用 `#` 或 `!` 开头
```
# 这是一个注释
! 这也是注释
```

**空格处理：** 键和值之间的空格会被忽略
```
server.port=8080
```

**换行续写：**
```
my.long.property=this is a \
  very long line
```
结果：`this is a very long line`

**转义字符：** 支持 `\n`（换行）、`\t`（制表）、`\uXXXX`（Unicode）等
```
greeting=Hello\nWorld
chinese=\u4F60\u597D
```

**占位符引用**（Spring Boot 扩展）
```
app.name=MyApp
app.description=${app.name} is a Spring Boot project
```

## 总结

通过本文的学习，我们了解了从传统Servlet容器到SpringBoot的演进过程：

1. **传统方式**：需要复杂的XML配置，手动管理Servlet、Filter等组件
2. **Spring框架**：提供IoC和AOP等特性，简化了企业级开发
3. **SpringBoot**：通过"约定优于配置"的理念，进一步简化了配置和部署

SpringBoot的设计哲学是让开发者能够快速构建生产级别的应用，同时保持Spring的强大功能和灵活性。理解这些核心概念对于现代Java Web开发至关重要。
---
title: "JavaScript基础知识总结"
description: "JavaScript核心概念和基础语法的学习笔记"
date: 2025-01-23
category: "前端开发"
tags: ["JavaScript", "前端", "基础"]
authors: ["bx33661"]
draft: false
slug: "javascript-basics"
---

# JavaScript基础知识总结

这是我学习JavaScript过程中整理的基础知识笔记。

## 变量声明

JavaScript中有三种变量声明方式：

### var
- 函数作用域
- 存在变量提升
- 可以重复声明

```javascript
var name = "张三";
var name = "李四"; // 可以重复声明
```

### let
- 块级作用域
- 不存在变量提升
- 不可以重复声明

```javascript
let age = 25;
// let age = 30; // 报错：不能重复声明
```

### const
- 块级作用域
- 必须在声明时初始化
- 不能重新赋值

```javascript
const PI = 3.14159;
// PI = 3.14; // 报错：不能重新赋值
```

## 数据类型

JavaScript有8种数据类型：

### 基本类型
1. **Number** - 数字
2. **String** - 字符串
3. **Boolean** - 布尔值
4. **Undefined** - 未定义
5. **Null** - 空值
6. **Symbol** - 符号
7. **BigInt** - 大整数

### 引用类型
8. **Object** - 对象（包括数组、函数等）

## 函数

### 函数声明
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
```

### 函数表达式
```javascript
const greet = function(name) {
    return `Hello, ${name}!`;
};
```

### 箭头函数
```javascript
const greet = (name) => `Hello, ${name}!`;
```

## 总结

JavaScript是一门灵活而强大的编程语言，掌握这些基础概念对于后续学习非常重要。
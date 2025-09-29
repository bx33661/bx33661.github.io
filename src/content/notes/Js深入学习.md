---
title: "JavaScript特性&Promise等"
description: "深入学习JavaScript核心特性，包括链式调用、Promise异步编程、原型链等高级概念，结合LeetCode实践加深理解"
date: 2025-09-29
category: "日常随笔"
tags: ["JavaScript", "Promise", "链式调用", "原型链", "异步编程", "LeetCode"]
authors: ["bx33661"]
draft: false
slug: "javascript-advanced-learning"
---

# Js特性学习

## Js的链式调用

Js链式调用，核心思想就是**方法执行后返回 `this`，而不是普通值。**

```jsx
class StringFormatter {
  constructor(str) {
    this.str = str;
  }

  toLowerCase() {
    this.str = this.str.toLowerCase();
    return this; // 返回this使链式调用成为可能
  }

  trim() {
    this.str = this.str.trim();
    return this;
  }

  capitalize() {
    this.str = this.str.charAt(0).toUpperCase() + this.str.slice(1);
    return this;
  }

  getValue() {
    return this.str;
  }
}

// 使用链式调用
const result = new StringFormatter("  HELLO world  ")
  .toLowerCase()
  .trim()
  .capitalize()
  .getValue();

console.log(result); // 输出: "Hello world"
```

同时要理解一个思想“函数是一等公民”，函数和普通变量是一样的地位。

所以说我们能把数字、字符串存在变量里一样，也能把函数存在变量里、当参数传递、作为返回值返回

具体体现

1. **函数可以赋值给变量**

   ```jsx
   const sayHi = function() {
       console.log("Hello!");
   };
   sayHi(); // Hello!
   ```

   这里 `sayHi` 就像一个变量，存的不是数字，而是函数。

2. **函数可以作为参数传递**

   ```jsx
   function runTwice(fn) {
       fn();
       fn();
   }
   runTwice(() => console.log("Hi"));
   ```

   这里会输出两次这个“hi”

   

3. **函数可以作为返回值**

   这个很典型的一个闭包

   ```jsx
   function makeAdder(x) {
       return function(y) {
           return x + y;
       }
   }
   const add5 = makeAdder(5);
   console.log(add5(10)); // 15
   ```

   这里 `makeAdder` 返回了一个函数，这就是闭包的经典用法

主要就是上面这些，这里有一个闭包思想



## Js中的Promise

> Promise 的设计初衷是解决回调地狱（callback hell）的问题，让异步代码看起来更清晰、更易维护
> 

一个 Promise 对象有三种可能的状态：

1. **pending（进行中）**：初始状态，既没有完成也没有失败。
2. **fulfilled（已完成）**：操作成功完成，返回结果。
3. **rejected（已失败）**：操作失败，返回错误原因。

```jsx
const promise = new Promise((resolve, reject) => {
    let suscess = true; 
    if (suscess) {
        resolve("Promise resolved successfully!");  
    } else {
        reject("Promise rejected!");
    }
});

/*
resolve(value)：表示成功，传递结果。
reject(error)：表示失败，传递错误信息。
*/

promise
    .then((message) => {
        console.log(message); }
    )
    .catch((error) => {
        console.error(error); 
    })
    .finally(() => {
        console.log("Promise has been settled (either resolved or rejected).");
    });
```

相应的可以使用这个`.then` 和`.finally` 处理结果

这里还是要强调这个链式调用

```jsx
new Promise((resolve) => {
  resolve(1)
})
  .then(value => {
    console.log(value) // 1
    return value + 1
  })
  .then(value => {
    console.log(value) // 2
    return value + 1
  })
  .then(value => {
    console.log(value) // 3
  })
Promise 的常用方法
```

Promise 的常用方

(1) `Promise.all()`

并行执行多个 Promise，**全成功才成功**，有一个失败就失败。

```jsx
Promise.all([p1, p2, p3])
  .then(results => console.log(results))
  .catch(err => console.error(err))
```

(2) `Promise.race()`

多个 Promise，**最快返回的那个决定结果**。

```jsx
Promise.race([p1, p2, p3]).then(console.log)
```

(3) `Promise.allSettled()`

等待所有 Promise 完成，不管成功或失败，返回每个结果状态。

```jsx
Promise.allSettled([p1, p2, p3]).then(console.log)
```

(4) `Promise.any()`

只要有一个成功就返回成功，**全部失败才报错**。

```jsx
Promise.any([p1, p2, p3]).then(console.log).catch(console.error)
```



## Leetcode

### 处理json数据

[2727. 判断对象是否为空 - 力扣（LeetCode）](https://leetcode.cn/problems/is-object-empty/)

```jsx
/**
 * @param {Object|Array} obj
 * @return {boolean}
 */
var isEmpty = function(obj) {
    const value = JSON.stringify(obj);
    return value === '{}' || value === '[]';
};
```

### 链式调用理解

可以深入对这个js的理解

[2726. 使用方法链的计算器 - 力扣（LeetCode）](https://leetcode.cn/problems/calculator-with-method-chaining/)

```jsx
class Calculator{

    constructor(value) {
        this.value = value;
    }

    add(value) {
        this.value += value;
        return this;
    }

    subtract(value) {
        this.value = this.value - value;
        return this;
    }
    multiply(value) {
        this.value = this.value * value;
        return this;
    }
    divide(value) {
        if (value === 0) {
            throw new Error("Division by zero is not allowed");
        }
        this.value /= value;
        return this;
    }
    power(value) {
        this.value = Math.pow(this.value, value);
        return this;
    }
    getResult() {
        return this.value;
    }
}

```

这里重点是`return this` 

这里解释是这样的，

1. `this` 指向当前对象实例
2. 通过返回 `this`，每个方法调用后都返回计算器对象本身
3. 这样就可以直接在返回值上继续调用下一个方法

还有一些实践例子展示

```jsx
// jQuery 中的链式调用
$("#myDiv")
    .addClass("highlight")
    .css("color", "red")
    .fadeIn(1000)
    .text("Hello");

// Promise 中的链式调用
fetch("https://api.example.com/data")
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

### 原型链

[2619. 数组原型对象的最后一个元素 - 力扣（LeetCode）](https://leetcode.cn/problems/array-prototype-last/description/)

这个案例很好就展示原型链的一个应用，去丰富原生的一个数组功能

```jsx
Array.prototype.last = function() {
    if (this.length === 0) {
        return -1;
    }
    return this[this.length - 1];
}
```

### promise相加

[2723. 两个 Promise 对象相加 - 力扣（LeetCode）](https://leetcode.cn/problems/add-two-promises/)

第一种写法的话，采用async，返回值也是promise

```jsx
/**
 * @param {Promise} promise1
 * @param {Promise} promise2
 * @return {Promise}
 */
var addTwoPromises = async function(promise1, promise2) {
    const value1 = await promise1;
    const value2 = await promise2;
    return value1 + value2;
};

/**
 * addTwoPromises(Promise.resolve(2), Promise.resolve(2))
 *   .then(console.log); // 4
 */
```

第二种，直接采用`all` 方法

```jsx
/**
 * @param {Promise} promise1
 * @param {Promise} promise2
 * @return {Promise}
 */
var addTwoPromises = async function(promise1, promise2) {
    const result = Promise.all([promise1,promise2]).then(values => values[0] + values[1]);
    return result;
};
```
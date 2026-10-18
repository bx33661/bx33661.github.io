---
title: "JavaScript Features and Promises"
description: "A deeper study of JavaScript fundamentals, including method chaining, asynchronous programming with Promises, and prototype chains, reinforced with LeetCode exercises."
date: 2025-09-29T00:00:00.000Z
category: "Daily Notes"
tags:
  - "JavaScript"
  - "Promise"
  - "Method Chaining"
  - "Prototype Chain"
  - "Asynchronous Programming"
  - "LeetCode"
authors:
  - "bx33661"
draft: false
slug: "javascript-advanced-learning-en"
lang: "en"
translationKey: "javascript-advanced-learning"
---

# Studying JavaScript Features

## JavaScript Method Chaining

The core idea of JavaScript method chaining is that **a method returns `this` after it runs, rather than an ordinary value.**

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

At the same time, understand the idea that “functions are first-class citizens”: functions have the same status as ordinary variables.

Thus, just as we can store numbers and strings in variables, we can also store functions in variables, pass them as arguments, and return them as values.

Here are some examples.

1. **A function can be assigned to a variable**

   ```jsx
   const sayHi = function() {
       console.log("Hello!");
   };
   sayHi(); // Hello!
   ```

   Here, `sayHi` is like a variable that stores a function rather than a number.

2. **A function can be passed as an argument**

   ```jsx
   function runTwice(fn) {
       fn();
       fn();
   }
   runTwice(() => console.log("Hi"));
   ```

   This will output “hi” twice.

   

3. **A function can be returned as a value**

   This is a typical closure.

   ```jsx
   function makeAdder(x) {
       return function(y) {
           return x + y;
       }
   }
   const add5 = makeAdder(5);
   console.log(add5(10)); // 15
   ```

   Here, `makeAdder` returns a function; this is a classic use of closures.

These are the main points above, including the idea of closures.



## Promises in JavaScript

> Promises were designed to solve the problem of callback hell, making asynchronous code clearer and easier to maintain.
> 

A Promise object has three possible states:

1. **pending**: the initial state; neither fulfilled nor rejected.
2. **fulfilled**: the operation completed successfully and returned a result.
3. **rejected**: the operation failed and returned a reason for the error.

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

The results can be handled with `.then` and `.finally`, respectively.

The importance of method chaining should still be emphasized here.

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

Common Promise methods

(1) `Promise.all()`

Run multiple Promises in parallel; **all must succeed for the operation to succeed**. If one fails, the operation fails.

```jsx
Promise.all([p1, p2, p3])
  .then(results => console.log(results))
  .catch(err => console.error(err))
```

(2) `Promise.race()`

For multiple Promises, **the one that settles fastest determines the result**.

```jsx
Promise.race([p1, p2, p3]).then(console.log)
```

(3) `Promise.allSettled()`

Wait for all Promises to settle, whether fulfilled or rejected, and return the status of each result.

```jsx
Promise.allSettled([p1, p2, p3]).then(console.log)
```

(4) `Promise.any()`

Return successfully as soon as one succeeds; **report an error only if all fail**.

```jsx
Promise.any([p1, p2, p3]).then(console.log).catch(console.error)
```



## LeetCode

### Processing JSON Data

[2727. Is Object Empty - LeetCode](https://leetcode.cn/problems/is-object-empty/)

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

### Understanding Method Chaining

This is a way to deepen your understanding of JavaScript.

[2726. Calculator with Method Chaining - LeetCode](https://leetcode.cn/problems/calculator-with-method-chaining/)

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

The key point here is `return this`.

The explanation is as follows:

1. `this` refers to the current object instance.
2. By returning `this`, each method call returns the calculator object itself.
3. This lets you call the next method directly on the returned value.

Here are some more practical examples.

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

### Prototype Chain

[2619. Array Prototype Last - LeetCode](https://leetcode.cn/problems/array-prototype-last/description/)

This example clearly demonstrates an application of the prototype chain: extending the functionality of a native array.

```jsx
Array.prototype.last = function() {
    if (this.length === 0) {
        return -1;
    }
    return this[this.length - 1];
}
```

### Adding Promises

[2723. Add Two Promises - LeetCode](https://leetcode.cn/problems/add-two-promises/)

In the first implementation, async is used, and the return value is also a Promise.

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

In the second, use the `all` method directly.

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
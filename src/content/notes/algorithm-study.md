---
title: "数据结构与算法学习笔记"
description: "常用数据结构和算法的学习总结，包含代码示例和复杂度分析"
date: 2025-01-21
category: "算法学习"
tags: ["算法", "数据结构", "编程", "面试"]
authors: ["bx33661"]
draft: false
---

# 数据结构与算法学习笔记

算法和数据结构是程序员的基本功，本文总结了常用的数据结构和算法。

## 基础数据结构

### 1. 数组 (Array)

**特点：**
- 连续内存存储
- 随机访问，时间复杂度O(1)
- 插入删除操作复杂度O(n)

**应用场景：**
- 需要频繁随机访问元素
- 数据量相对固定

### 2. 链表 (Linked List)

**特点：**
- 非连续内存存储
- 插入删除操作复杂度O(1)
- 访问元素复杂度O(n)

**代码示例：**
```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class LinkedList:
    def __init__(self):
        self.head = None
    
    def insert(self, val):
        new_node = ListNode(val)
        new_node.next = self.head
        self.head = new_node
    
    def delete(self, val):
        if not self.head:
            return
        
        if self.head.val == val:
            self.head = self.head.next
            return
        
        current = self.head
        while current.next and current.next.val != val:
            current = current.next
        
        if current.next:
            current.next = current.next.next
```

### 3. 栈 (Stack)

**特点：**
- 后进先出 (LIFO)
- 主要操作：push、pop、peek

**应用场景：**
- 函数调用栈
- 表达式求值
- 括号匹配

### 4. 队列 (Queue)

**特点：**
- 先进先出 (FIFO)
- 主要操作：enqueue、dequeue

**应用场景：**
- 广度优先搜索
- 任务调度
- 缓冲区

## 常用算法

### 1. 排序算法

#### 快速排序
```python
def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
```

**时间复杂度：**
- 平均情况：O(n log n)
- 最坏情况：O(n²)

#### 归并排序
```python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

**时间复杂度：** O(n log n)

### 2. 搜索算法

#### 二分搜索
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1
```

**时间复杂度：** O(log n)

## 算法复杂度分析

### 时间复杂度
- **O(1)** - 常数时间
- **O(log n)** - 对数时间
- **O(n)** - 线性时间
- **O(n log n)** - 线性对数时间
- **O(n²)** - 平方时间

### 空间复杂度
分析算法所需的额外存储空间。

## 学习建议

1. **理论与实践结合** - 理解原理后动手实现
2. **多做练习** - LeetCode、牛客网等平台
3. **总结归纳** - 整理常见题型和解题模板
4. **复杂度分析** - 养成分析时间空间复杂度的习惯

## 总结

数据结构和算法是编程的基础，需要持续练习和总结。掌握常用的数据结构和算法对于解决实际问题和面试都非常重要。
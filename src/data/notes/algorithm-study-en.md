---
title: "Data Structures and Algorithms Study Notes"
description: "Notes on common data structures and algorithms, complexity analysis, example code, interview review, and complexity comparisons."
date: 2025-01-21T00:00:00.000Z
category: "Algorithm Study"
tags:
  - "Algorithms"
  - "Data Structures"
  - "Programming"
  - "Interviews"
authors:
  - "bx33661"
draft: false
slug: "algorithm-study-en"
lang: "en"
translationKey: "algorithm-study"
---

# Data Structures and Algorithms Study Notes

Data structures and algorithms are fundamental skills for programmers. This article summarizes commonly used data structures and algorithms.

## Basic Data Structures

### 1. Array

**Characteristics:**
- Stored in contiguous memory
- Random access, O(1) time complexity
- Insertion and deletion have O(n) complexity

**Use cases:**
- Frequent random access to elements is needed
- Data size is relatively fixed

### 2. Linked List

**Characteristics:**
- Stored in non-contiguous memory
- Insertion and deletion have O(1) complexity
- Accessing an element has O(n) complexity

**Code example:**
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

### 3. Stack

**Characteristics:**
- Last in, first out (LIFO)
- Main operations: push, pop, peek

**Use cases:**
- Function call stack
- Expression evaluation
- Matching parentheses

### 4. Queue

**Characteristics:**
- First in, first out (FIFO)
- Main operations: enqueue, dequeue

**Use cases:**
- Breadth-first search
- Task scheduling
- Buffers

## Common Algorithms

### 1. Sorting Algorithms

#### Quicksort
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

**Time complexity:**
- Average case: O(n log n)
- Worst case: O(n²)

#### Merge sort
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

**Time complexity:** O(n log n)

### 2. Search Algorithms

#### Binary search
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

**Time complexity:** O(log n)

## Algorithm Complexity Analysis

### Time complexity
- **O(1)** - Constant time
- **O(log n)** - Logarithmic time
- **O(n)** - Linear time
- **O(n log n)** - Linearithmic time
- **O(n²)** - Quadratic time

### Space complexity
Analyze the extra storage space required by the algorithm.

## Study Recommendations

1. **Combine theory and practice** - Implement things after understanding the principles
2. **Practice more** - Use platforms such as LeetCode and Nowcoder
3. **Summarize and organize** - Collect common problem types and solution templates
4. **Analyze complexity** - Make a habit of analyzing time and space complexity

## Summary

Data structures and algorithms are the foundation of programming and require continuous practice and review. Mastering common data structures and algorithms is important for solving real-world problems and for interviews.
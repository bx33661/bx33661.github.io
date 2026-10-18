---
title: "Java Two Sum Practice"
description: "Using LeetCode Two Sum as an example, records two Java approaches—nested-loop enumeration and hash-map matching—to compare different ways of solving the same problem."
date: 2024-07-26T00:00:00.000Z
tags:
  - "Java"
  - "bx"
  - "Algorithm Learning"
authors:
  - "bx"
draft: false
slug: "java-algorithm-practice-en"
category: "Algorithm Practice"
lang: "en"
translationKey: "java-algorithm-practice"
---

# Java Algorithm Practice Notes

> Mainly based on some example problems on LeetCode

## Two Sum

https://leetcode.cn/problems/two-sum/description/?envType=study-plan-v2&envId=top-100-liked

### Brute-force enumeration

Just use two nested loops.

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int length = nums.length;
        for (int i = 0; i < length; i++) {
            for (int j = i + 1; j < length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i,j};
                }
            }
        }
        return null;
    }
}
```

### Direct matching with a hash map

This approach has low algorithmic complexity.

```java
public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<Integer,Integer>();
        for (int i = 0; i < nums.length; i++) {
            int a = target - nums[i];
            if (map.containsKey(a)) {
                return new int[] { map.get(a), i };
        }
            map.put(nums[i], i);
}
        return null;
    }
}
```


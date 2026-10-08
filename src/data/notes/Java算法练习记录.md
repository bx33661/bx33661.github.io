---
title: "Java 两数之和练习"
description: "以 LeetCode 两数之和为例，记录 Java 的双重循环枚举与哈希表匹配两种写法，用于比较同一问题的不同求解思路。"
date: 2024-07-26
tags:
  - "Java"
  - "bx"
  - "算法学习"
authors:
  - "bx"
draft: false
slug: "java-algorithm-practice"
formerBlogSlug: "java-algorithm-practice"
category: "算法练习"
---

# Java算法练习记录

> 主要是基于力扣上一些例题

## 两数之和

https://leetcode.cn/problems/two-sum/description/?envType=study-plan-v2&envId=top-100-liked

### 暴力枚举

两层循环直接干

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

### 使用哈希表直接匹配

这个写法算法复杂度不高

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


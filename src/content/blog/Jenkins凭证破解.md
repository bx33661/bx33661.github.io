---
title: "Jenkins凭证破解&敏感信息获取"
description: "Jenkins 是一个开源的**自动化服务器（Automation Server）**，主要用于**持续集成和持续交付（CI/CD）**。"
date: 2025-08-10
tags:
  - "jenkins"
  - "凭证破解"
  - "bx"
  - "脚本"
authors:
  - "bx"
draft: false              # 设为 true 则为草稿
slug: "jenkins-credential-crack"          # 随机URL字符串
---
<meta name="referrer" content="no-referrer">

# Jenkins凭证破解&敏感信息获取
Jenkins 是一个开源的**自动化服务器（Automation Server）**，主要用于**持续集成和持续交付（CI/CD）**。

官网地址

[https://www.jenkins.io/](https://www.jenkins.io/)



## Jenkins 凭证存储原理简述
主要原因是 `Jenkins`允许用户将各种需要用到的凭证集中存储，而不是在 Job 配置脚本中直接写明文密码或密钥。这样可以避免密码泄露、减少重复输入、方便统一管理  

如果我们能够获取到对应的密钥之类的信息，就能破解得到一些凭证信息



1. **凭证存储位置**  
Jenkins 把用户在“凭证管理”里配置的账号密码、秘钥等敏感信息，加密后存储在：
    - `$JENKINS_HOME/credentials.xml`
    - 或者某些 Job 配置目录下的 `config.xml` 文件里
2. **加密机制**  
Jenkins 使用了自己的一套对称加密方式：
    - 密钥由两个文件决定：
        * `$JENKINS_HOME/secrets/master.key` ：主密钥文件
        * `$JENKINS_HOME/secrets/hudson.util.Secret` ：一个辅助的“盐”或密钥材料
    - Jenkins 会结合这两个文件生成实际的解密密钥，用来解密 `credentials.xml` 或 `config.xml` 中加密的内容。
3. **加密内容**
    - 凭证内容在 XML 里通常是以 Base64 编码的加密字符串形式存储
    - 加密后内容无法直接看到密码明文
4. **解密过程**
    - 拿到 `master.key` 和 `hudson.util.Secret` 两个文件
    - 用 Jenkins 提供的或者社区开发的解密工具，结合这两个文件
    - 对加密的凭证数据执行解密算法（AES 对称加密）
    - 解出明文的密码或秘钥



## 本地搭建测试
### 基本环境启动
这里才用 docker 搭建

```java
docker run -d -p 8080:8080 -p 50000:50000 --name myjenkins jenkins/jenkins:lts
```

到对应路径查看初始密码

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754993304199-7c581d90-7ad8-4122-a3fe-d0b281543e70.png)

跟着步骤配置和下载

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754993284453-7e457e35-1925-40ac-9473-0f6729c3a913.png)

最后搭建成功

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754993399144-c77d22e1-0d5b-4fe0-8841-7ed4379595fe.png)



### 设置凭证
这里设置一个假的凭证

```java
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAAci0xAAAA
EAAAAAEAAAAzAAAAC3NzaC1lZDI1NTE5AAAAIKsVqEXAMPLEfaI+m33VNlBwYp4k
NlZEXAMPLEy2M5mJk4zAAAAsIEXzT2BF809gAAAAtzc2gtZWQyNTUxOQAAACCrFa
gEXAMPLEfaI+m33VNlBwYp4kNlZEXAMPLEy2M5mJk4zAAAAECAwQFBgcICQoLDA
0ODxAREhMUFRYXGBkaGxwdHh9odHRwczovL2dpdGh1Yi5jb20vYmFieXNoZW5na3
UBAgMEBQY=
-----END OPENSSH PRIVATE KEY-----


ID: bx
Description: bx
Username: bx
Private Key:
Passphrase: 留空 (因为这个假密钥没有密码)。
```

在对应界面配置一下

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754994396599-c49d9a70-df15-46c0-9937-9c0f7152170a.png)







## 凭证破解
需要三件套

1. `$JENKINS_HOME/secrets/master.key`
2. `$JENKINS_HOME/secrets/hudson.util.Secret`
3. `$JENKINS_HOME/<font style="color:rgb(0, 0, 0);background-color:rgb(244, 244, 246);">credentials.xml</font>`里面的凭证内容



具体测试凭证文件`<font style="color:rgb(0, 0, 0);background-color:rgb(244, 244, 246);">credentials.xml</font>`内容如下

```xml
<?xml version='1.1' encoding='UTF-8'?>
<com.cloudbees.plugins.credentials.SystemCredentialsProvider plugin="credentials@1419.v2337d1ceceef">
  <domainCredentialsMap class="hudson.util.CopyOnWriteMap$Hash">
    <entry>
      <com.cloudbees.plugins.credentials.domains.Domain>
        <specifications/>
      </com.cloudbees.plugins.credentials.domains.Domain>
      <java.util.concurrent.CopyOnWriteArrayList>
        <com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey plugin="ssh-credentials@361.vb_f6760818e8c">
          <scope>SYSTEM</scope>
          <id>bx</id>
          <description>bx</description>
          <username>bx</username>
          <usernameSecret>false</usernameSecret>
          <privateKeySource class="com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey$DirectEntryPrivateKeySource">
            <privateKey>{AQAAABAAAAGgQ/Vgr9DBmTtPJn0FoJQQNLmnAVszr8M6pnogmCuewS6cT5LEyqIoeEu4VEe5zckSGDed8wD1PdwJu4FHrzG0OOR/IsUHdXSf2MBAuwKyvWQ6sK+TspkzkYd4/9WqjAFzVyBRRz0oe3rmeENBHI+Xswx+QYjA84LDglcMl1IBPiywoj280ivr/t0sGTJ3zBKbmmD9mOc0fg9BNsbDjqdbRLlZtZACzWTU2TL+VVe8kTa9GQqg2hmzHlQD8gG02rYOx/rf2UA9LoghxpxPes9H9CrlJl4/DvuYU6xb1ndXgGVqxcX2MGkub/aXpEutyOFZC3FtrkqF3NCRvzXfv2tlDIbxk2sMMoLCeh1BIEVpDkECvFoEqe5plcuzo3e2nF1xhfAGEl7uSuMQGudeM0rzO+fsa0hfZnFYmSjKG/GbZS/SZVAWdF7Fd3X5225h4qZUX+kNuu29dJNVWCelKxYoGIa9l6QIzdQ7gnQY2+6KeiOZYAgpdoGda7vK5b4Rs6FdxZ8LQLhxoxOZkBqglN9+TXiXdYwkRcFANhPI8LuX18XbeaBJGyiormly2W/pJQbU}</privateKey>
          </privateKeySource>
        </com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey>
        <org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl plugin="plain-credentials@199.v9f8e1f741799">
          <scope>GLOBAL</scope>
          <id>bx1</id>
          <description>bx1</description>
          <secret>{AQAAABAAAAAQ++1oVp9Kbbh7HnJH7hOT0r8AVObBdgWHSEZ+o6RR/8M=}</secret>
        </org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
      </java.util.concurrent.CopyOnWriteArrayList>
    </entry>
  </domainCredentialsMap>
</com.cloudbees.plugins.credentials.SystemCredentialsProvider>
```

解密脚本采用

 这里我改了一个脚本
https://github.com/bx33661/JenkinsCredsDecoder

解密 ssh 密钥

```bash
python3 jenkins_credential.py master.key hudson.util.Secret AQAAABAAAAGgQ/Vgr9DBmTtPJn0FoJQQNLmnAVszr8M6pnogmCuewS6cT5LEyqIoeEu4VEe5zckSGDed8wD1PdwJu4FHrzG0OOR/IsUHdXSf2MBAuwKyvWQ6sK+TspkzkYd4/9WqjAFzVyBRRz0oe3rmeENBHI+Xswx+QYjA84LDglcMl1IBPiywoj280ivr/t0sGTJ3zBKbmmD9mOc0fg9BNsbDjqdbRLlZtZACzWTU2TL+VVe8kTa9GQqg2hmzHlQD8gG02rYOx/rf2UA9LoghxpxPes9H9CrlJl4/DvuYU6xb1ndXgGVqxcX2MGkub/aXpEutyOFZC3FtrkqF3NCRvzXfv2tlDIbxk2sMMoLCeh1BIEVpDkECvFoEqe5plcuzo3e2nF1xhfAGEl7uSuMQGudeM0rzO+fsa0hfZnFYmSjKG/GbZS/SZVAWdF7Fd3X5225h4qZUX+kNuu29dJNVWCelKxYoGIa9l6QIzdQ7gnQY2+6KeiOZYAgpdoGda7vK5b4Rs6FdxZ8LQLhxoxOZkBqglN9+TXiXdYwkRcFANhPI8LuX18XbeaBJGyiormly2W/pJQbU
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754995223431-097a8143-d5df-47c7-915d-886dd7c2fc9e.png)

解密密文

```bash
python jenkins_credential.py master.key hudson.util.Secret AQAAABAAAAAQ++1oVp9Kbbh7HnJH7hOT0r8AVObBdgWHSEZ+o6RR/8M=  
```

![](https://cdn.nlark.com/yuque/0/2025/png/42994824/1754995291609-b4cc7e2c-bec3-4ba6-a3db-76fddfcf9b3a.png)


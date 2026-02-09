---
title: "HnuCTF2026竞赛平台搭建和运维记录"
description: "记录HnuCTF2026竞赛平台的搭建、运维过程，包括平台选择、服务器配置、代理设置以及比赛结果总结。"
date: 2026-02-09
tags:
  - "ctf"
  - "运维"
  - "k8s"
  - "docker"
  - "HnuCTF"
  - "A1CTF"
authors:
  - "bx"
draft: false
slug: "hnuctf-2026-ops"
---

总的来说这次平台运维和搭建还是比较成功的，比赛期间没有出现大规模的崩溃和数据丢失。
出现最多的就是由于代理网络问题引起的网络波动。

## 平台选择

目前我们能够选择的 CTF 平台不多，我们选择的顾虑点如下：

1.  希望是自主搭建，自主可控
2.  能够对平台进行适配性修改
3.  尽量是 UI 美观好看，现代化
4.  开源

最终讨论结果就是 A1CTF 平台，十分成熟可用的基座平台。

[GitHub - carbofish/A1CTF: A CTF platform designed for A1natas.](https://github.com/carbofish/A1CTF)

整个使用下来十分赞，这里感谢 A1CTF 平台。

## 架构解析：云原生混合容器架构

本项目采用 混合容器架构：

*   **Docker Compose 管理核心服务**：用于部署相对“静态”的基础设施（Web 后端、Postgres 数据库、Redis 缓存）。这种方式配置简单，适合管理生命周期较长的长连接服务。
*   **K3s 管理动态任务**：CTF 平台的特殊性在于需要为每个选手/队伍动态生成、销毁题目环境（Pod）。利用 Kubernetes 的调度能力，可以轻松实现题目的资源隔离、自动清理和端口管理。

### 工作流程

当一名选手点击“启动题目”时，数据流是这样的：

1.  [**选手操作**]：点击前端网页按钮。
2.  [**Web 平台 (Docker)**]：
    *   收到 HTTP 请求。
    *   读取挂载进来的 `k8sconfig.yaml` 文件（这是通往 K3s 的“钥匙”）。
    *   **跨系统调用**：Web 平台作为 **Kubernetes Client**，向本机运行的 K3s API Server 发送指令：*"请给我启动一个名为 `challenge-101-team-A` 的 Pod"*。
3.  [**K3s 集群**]：
    *   API Server 收到指令，调度器开始工作。
    *   拉取镜像，启动 Pod。
    *   分配一个随机的高端口（比如 `31001`）映射给这个 Pod。
4.  [**反馈回路**]：
    *   K3s 告诉 Web 平台：*"任务完成，端口是 `31001`，IP 是 `1.2.3.4`"*。
    *   Web 平台把这个 `IP:Port` 显示给选手。

当选手和题目交互时候，流量流如下：

```bash
选手的电脑 <---> 服务器公网IP:31001 <---> K3s Service <---> 题目 Pod
```

## 运维实录

### 服务器选择

由于预算有限，根据之前比赛经验：
*   参与人数 200 多人
*   动态在线靶机巅峰数量在 100 以内等

本次 HnuCTF 比赛选取的是一台雨云的 8 核 16G 的服务器，all in one,没有采用多主机形式。

具体配置见图，是一台国内宁波的机子：
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770641425907-ab802f53-71d9-4924-8514-d0735dbd2a17.png)

### 基础系统配置

```yaml
system:
  gin-port: 8082          # 后端服务监听端口
  gin-host: 0.0.0.0       # 监听地址
  baseURL: http://ctf.hnusec.com # 平台对外的基础 URL
  trusted-proxies:        # 信任的代理 IP，用于正确获取客户端真实 IP
    - 127.0.0.1/32
    - 114.66.61.197/32    # 宿主机 IP，Nginx 转发时需要
```

### Kubernetes 集成

后端通过 `k8sconfig.yaml` 连接 K3s 集群，并使用 NodePort 模式暴露题目服务。

```yaml
k8s:
  k8s-config-file: "k8sconfig.yaml"
  node-ip-map:            # 节点名称到 IP 的映射，用于生成题目访问链接
    - { name: "instance-a2lxuib0", "address": "114.66.61.197" }
```

> **注意**: `name` 必须与 `kubectl get nodes` 输出的节点名称一致。

### 缓存策略

采用多级缓存策略：应用内内存缓存 (Ristretto) + Redis 分布式缓存，大幅降低数据库压力。

```yaml
cache-time:               # 内存缓存时间
  game-scoreboard: 500ms
  challenges-for-game: 1s
redis-cache-time:         # Redis 缓存时间
  user-list: 500ms
```

### 痛点解决：代理网络问题

由于服务器在国内，拉取 Docker Hub 的镜像非常慢甚至失败，这是部署初期最大的痛点。

本次采用的是 [**clash-for-linux-install**](https://github.com/nelvko/clash-for-linux-install) 这个项目，给服务器配置了代理环境，加速镜像拉取。

添加节点,十分简单，不需要我们做代理转换：

```bash
clashsub add
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770645896559-9df36a64-86d9-495a-afb4-167774a10d6d.png)

可以直接从 ui 平台查看和管理节点状态：

```bash
clashui
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770645716919-b9127a5d-c196-49c5-b18f-49cedaabd9a5.png)

进入 web-ui 界面：
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770642531429-7d754748-949b-42d4-bc94-9b60018fdf9b.png)

我们为了速度开启的全局 tun 模式：

```bash
$ clashtun
😾 Tun 状态：关闭

$ clashtun on
😼 Tun 模式已开启
```

## 比赛与平台观察

### 运行状况

比赛期间服务器情况，服务器总体情况如下：
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770641332828-63c82fdd-1c36-4e8e-b4f5-b39bf9136367.png)

平台监控如下：
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770641611141-02f605c4-8a3e-450b-99cd-3a79038876c4.png)

总的来说其实性能是过剩了，CPU 使用率和内存整理都是富余的，只是储存 30GB 还是有点吃力。
对于动态容器顶峰时刻，有几十多个动态靶机同时启动，平台的整体速度没问题，但是需要实时的去协调存储不够带来的问题。
由于每个类型题目的形式不一样所以说不好在 k8s 层面做对应大小限制，比如说 web 方向 nextjs 漏洞那题将近 1G 的容器大小。

### 反作弊情况

通过平台的异常事件，我们是抓到了两组提交对方 flag 的情况，也是给予了红屏锁定，平台本身是没问题的。
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770643253897-a65dd9ab-3526-41f3-a492-d9c14d0b3d86.png)
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770643332637-8e2eda7e-0737-4ead-95e0-a4f713e089ba.png)

但是也发现一些如 Re，Misc 代打情况，由于没有对于每个队伍的附件做一个隐藏水印等处理，所以没办法精准的追溯到人。
后续计划是对平台反作弊的这个功能持续升级一下，提升追溯能力。

### 比赛结果

经过 24H 的激烈竞争，各个方向的选手竞争非常激烈。
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770641783295-71ae3c85-a3c7-41df-a57d-5a95f477ee33.png)

在凌晨十分还有题目被解出，在内部 QQ 群部署了专门适配 A1CTF 的赛事通报 Bot（orixian.制作）：
![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1770642118573-a36c1c86-043b-4975-8086-5fbfe3bfe609.png)

## 附：搭建完整流程教程

> 这里记录一下，方便我或者大家后续直接使用。

### 1. 前置条件

*   **操作系统**: Ubuntu 20.04 或 22.04 LTS
*   **硬件配置**:
    *   CPU: 4Core+
    *   RAM: 8GB+ (取决于题目数量)
    *   Disk: 40GB+
*   **软件依赖**:
    *   Git
    *   Docker & Docker Compose
    *   K3s (用于题目容器调度)

### 2. 安装步骤

#### 2.1 安装 Docker

```bash
# 更新 apt 索引
sudo apt-get update

# 安装必要的证书和工具
sudo apt-get install -y ca-certificates curl gnupg

# 添加 Docker 官方 GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 并设置开机自启
sudo systemctl enable --now docker
```

#### 2.2 安装 K3s

HnuCTF 使用 Kubernetes (K3s) 来动态生成题目环境。

```bash
# 安装 K3s (国内建议使用镜像源或手动下载，这里使用官方脚本)
curl -sfL https://get.k3s.io | sh -

# 确认 K3s 正常运行
sudo k3s kubectl get nodes
```

#### 2.3 获取代码

```bash
git clone https://github.com/Fruit-Guardians/HnuCTF.git
cd HnuCTF
```

### 3. 配置

#### 3.1 配置文件 (`config.yaml`)

复制示例配置文件并根据环境修改：

```bash
cp config.example.yaml config.yaml
```

**关键配置项修改建议 (**`vi config.yaml`**)**:

1.  **System**:
    *   `gin-host`: 保持 `0.0.0.0`
    *   `baseURL`: 修改为您服务器的公网 IP 或域名 (例如 `http://1.2.3.4:8082` 或 `https://ctf.example.com`)
2.  **Postgres**:
    *   `port`: 注意 `docker-compose.yml` 中 Postgres 映射的端口。默认配置中 Postgres 映射为 `5433:5432`。由于 App 使用 host 网络模式，请将此处改为 **5433**，并在 `host` 处填写 `127.0.0.1`或`localhost`。
    *   `user`/`password`: 如果修改了 `docker-compose.yml` 中的数据库密码，请同步修改此处。默认用户/密码为 `postgres/postgres`。
    *   `dbname`: 默认为 `a1ctf`。
3.  **Redis**:
    *   `address`: `localhost:6379` (Docker Host 模式下可用)
    *   `password`: 默认为空，如有修改请同步。
4.  **K8s**:
    *   `k8s-config-file`: 默认为 `k8sconfig.yaml`。
    *   `node-ip-map`: 必须配置节点 IP，用于题目容器端口映射。

```yaml
node-ip-map:
  - { name: "您的主机名(运行 hostname 查看)", "address": "服务器公网IP" }
```

    *   `pull-secret-names`: 如果题目镜像在私有仓库，需要配置 image pull secret。

#### 3.2 Kubernetes 配置 (`k8sconfig.yaml`)

平台需要通过 kubeconfig 文件连接 K3s 集群。

```bash
# 复制 K3s 的配置文件
sudo cp /etc/rancher/k3s/k3s.yaml ./k8sconfig.yaml

# 修改权限使得当前用户/容器可读 (重要！)
sudo chown $(id -u):$(id -g) k8sconfig.yaml
sudo chmod 644 k8sconfig.yaml
```

**注意**: App 默认在 `docker-compose.yml` 中以 `network_mode: "host"` 运行，因此 `k8sconfig.yaml` 中的 `server: https://127.0.0.1:6443` 通常可以直接工作。如果遇到连接问题，尝试将其改为宿主机 IP (例如 `172.17.0.1` 或局域网 IP)。

### 4. 启动服务

使用 Docker Compose 构建并启动服务：

```bash
# 构建镜像并后台启动
sudo docker compose up -d --build
```

查看日志确认运行正常：

```bash
sudo docker compose logs -f app
```

### 5. 后续操作

1.  **访问平台**: 浏览器访问 `http://<服务器IP>:8082` (默认端口)。
2.  **管理员账号**: 首次注册用户即为 root。
3.  **题目管理**: 登录后台添加题目，配置题目镜像和端口。

### 6. 常见问题

*   **Database Connection Failed**:
    *   检查 `config.yaml` 中的 Postgres 端口是否为 `5433` (对应 `docker-compose.yml`)。
    *   检查 `postgres` 容器是否健康 (`docker ps`)。
*   **K8s Cluster Connect Failed**:
    *   检查 `k8sconfig.yaml` 是否存在且有读取权限。
    *   检查 K3s 服务状态: `systemctl status k3s`。
*   **题目容器无法访问**:
    *   检查服务器防火墙 (UFW/Security Group) 是否放行了 NodePort 范围 (默认 30000-32767)。
    *   检查 `config.yaml` 中 `node-ip-map` 是否配置了正确的公网 IP。

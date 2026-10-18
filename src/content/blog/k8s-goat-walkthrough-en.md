---
title: "Kubernetes Goat Lab: From Secret Leakage to Container Escape"
description: "Hands-on Kubernetes Goat scenarios, including secret leakage, DIND, Metadata Secrets, and container escape."
date: 2026-02-19T00:00:00.000Z
tags:
  - "Kubernetes"
  - "K8s Goat"
  - "Container Security"
  - "Penetration Testing"
authors:
  - "bx-云安全"
draft: false
slug: "k8s-goat-walkthrough-en"
lang: "en"
translationKey: "k8s-goat-walkthrough"
---

# Kubernetes Goat Lab: Hands-on Notes

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771508931551-5b306c56-a2b6-4e10-84fc-4b928f32c6c0.png)

I've been taking on the Kubernetes Goat lab over the past few days. The overall difficulty is substantial, but it covers many practical container and cluster security issues.

## Lab and References

- Project repository: [madhuakula/kubernetes-goat](https://github.com/madhuakula/kubernetes-goat.git)
- Official documentation: [Kubernetes Goat Docs](https://madhuakula.com/kubernetes-goat/docs/)

## Part 1 - Sensitive keys in codebases

### CI / CD background

Common CI (Continuous Integration) workflow:

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

Common CD (Continuous Delivery / Deployment) workflow:

```text
构建成功
  ↓
打包 Docker 镜像
  ↓
推送镜像仓库
  ↓
部署到服务器 / Kubernetes / 云
```

### Finding leaked `.git` and tracing commit history

Start by gathering information about the site; we found that `.git` had been exposed.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503852819-68f5ab7d-0cb6-45a9-9404-7480d9abb035.png)

After cloning the repository, inspect its commit history:

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

You can also use `git show` / `git diff` to compare suspicious commits.

### Extracting sensitive information

A sensitive-information leak was found in the history:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503873357-282a75fb-6994-4aa3-be85-9a9997cd9f59.png)

```diff
+[build-code-aws]
+aws_access_key_id = AKIVSHD6243H22G1KIDC
+aws_secret_access_key = cgGn4+gDgnriogn4g+34ig4bg34g44gg4Dox7c1M
+k8s_goat_flag = k8s-goat-51bc78332065561b0c99280f62510bcc
```

## Part 2 - DIND

DIND (Docker-in-Docker) means running a Docker daemon inside a container, then starting other containers within it.

```text
宿主机 Docker
  ↓
容器 A（运行 docker daemon）
  ↓
容器 B / C / D ...
```

This is common in CI scenarios:

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

Back in the lab, first gain execution capability through command concatenation, then enumerate.

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771504314290-3b3fed83-e755-490f-8f42-03406a461e25.png)

Check the mounts:

```bash
mount
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771504792096-41e46934-5e34-4086-8ac7-a1c114053ef3.png)

We found `custom/containerd/containerd.sock`; consider using runtime tools to investigate further.

```bash
wget https://github.com/kubernetes-sigs/cri-tools/releases/download/v1.35.0/crictl-v1.35.0-linux-amd64.tar.gz -O /tmp/crictl.tar.gz
```

`crictl` is used to interact directly with the Kubernetes container runtime.

| Comparison | `kubectl` | `crictl` |
| --- | --- | --- |
| Operational layer | Kubernetes | Container runtime |
| Communicates with | API Server | containerd / CRI-O |
| Resources operated on | Pod, Deployment, Service | Container, image, Sandbox |
| Cluster required? | Yes | No (node is enough) |
| Cross-node? | Yes | Current node only |

Related project: <https://github.com/kubernetes-sigs/cri-tools>

> The following `crictl` operation example is not shown in full because the lab environment could not access GitHub.

## Part 3 - Metadata Secrets

> The Goal:
> To complete this scenario you need to obtain the `k8s-goat-FLAG` flag value in the metadata secrets.

The goal is to obtain `k8s-goat-FLAG` in the metadata secrets.

Try accessing the internal endpoint:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503885123-d83329fa-51bf-45db-b5d4-e54bcb23ffbc.png)

Found `http://metadata-db/`:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503893008-f608f573-ddb9-4787-b930-b65a77ba9181.png)

Continue by accessing `http://metadata-db/latest/`:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503900352-29a2c1e1-5ffb-421c-b215-afecfae7cbc2.png)

Finally, obtain the flag:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771503911311-53ab8658-b4b3-4512-805a-206581b4244d.png)

```text
{"metadata": "static-metadata", "data": "azhzLWdvYXQtY2E5MGVmODVkYjdhNWFlZjAxOThkMDJmYjBkZjljYWI="}

k8s-goat-ca90ef85db7a5aef0198d02fb0df9cab
```

## Part 4 - Container Escape to the Host System

The main attack path in this scenario is as follows:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771507314125-5204ec9d-5c08-494a-b47e-760f52a970ce.png)

### Capability enumeration

Commands can be executed in the monitoring Pod. First, inspect the capability bits:

```bash
capsh --print
```

> `capsh` is used to view and manage Linux capabilities, splitting traditional root privileges into finer-grained permission sets.

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

Pay special attention to `Bounding set`, which represents the maximum capabilities available to the current process and its children. Multiple high-risk capabilities appear here, indicating excessive container privileges:

- `cap_sys_admin` (high risk; involves mounts, namespaces, etc.)
- `cap_sys_module` (can load kernel modules)
- `cap_sys_rawio` (raw I/O)
- `cap_net_admin` (network configuration capability)
- `cap_sys_ptrace` (can ptrace other processes)
- `cap_bpf` / `cap_perfmon` (low-level kernel and performance capabilities)

`secure-*` are all `no`, and the identity is `uid=0(root)`, indicating that there has been almost no privilege reduction or capability confinement.

### HostPath and switching to the host

Continue checking mount information (there are many entries; only a screenshot is shown here):

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506336068-c9d3e5f4-eea8-467b-9229-f6e1b49b2818.png)

The `/host-system` directory appears. Further enumeration suggests it is a mapping of the host filesystem:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506454482-a4f223a3-371c-4f4b-a738-30d33800027d.png)

```bash
chroot /host-system bash
```

This means switching the current process root directory to `/host-system` and starting `bash`.

Continue exploring laterally after the switch:

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506589114-62a617e4-1c41-405a-80b5-b4a60d3cba43.png)

```bash
cat /etc/kubernetes/admin.conf
```

![](https://cdn.nlark.com/yuque/0/2026/png/42994824/1771506736455-5b7ad99a-38f4-41eb-899d-010078fdf185.png)

This step means sensitive configuration on the host/control plane is now accessible. In a real environment, `admin.conf` often contains high-privilege credentials or certificates for accessing the API Server, which presents an extremely high risk.

## Summary

1. The core principle is still Least Privilege.
2. `privileged` containers typically have capabilities close to those of the host.
3. HostPath essentially exposes the host filesystem to a container and must be strictly controlled.

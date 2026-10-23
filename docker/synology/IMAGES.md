# Angel Code 镜像包（离线导入）

本目录的 `images/` 下是**已构建好的镜像 tar**，不需要 Docker 环境、不需要联网、
不需要在群晖上编译，直接 `docker load` 导入即可。

| 文件 | 适用机型 | 大小 |
|---|---|---|
| `images/angel-code-amd64.tar` | x86_64 群晖（DS920+、DS1520+、DS1821+…） | 68 MB |
| `images/angel-code-arm64.tar` | ARM 群晖（DS223、DS124、DS423…） | 65 MB |

镜像内已包含：alpine 3.20 rootfs、`picoclaw` 网关、`picoclaw-launcher` 控制台
（内含 Angel Code 前端）、`su-exec`、入口脚本、`picoclaw` 用户。

## 一、确认机型架构

在群晖 SSH 里执行：

```sh
uname -m
```

- `x86_64` → 用 `amd64`
- `aarch64` → 用 `arm64`

## 二、上传镜像

用 File Station 或 SCP 把对应 tar 传到群晖，例如：

```
/volume1/docker/angel-code/angel-code-amd64.tar
```

## 三、导入镜像

```sh
cd /volume1/docker/angel-code

# 导入
sudo docker load -i angel-code-amd64.tar

# 确认镜像存在（标签带架构后缀）
sudo docker images | grep angel-code
# angel-code   latest-amd64    ...
```

> 导入后的标签是 `angel-code:latest-amd64` / `angel-code:latest-arm64`。
> 若想统一成 `latest`，执行：
> ```sh
> sudo docker tag angel-code:latest-amd64 angel-code:latest
> ```

## 四、启动容器

```sh
sudo docker run -d \
  --name angel-code \
  --restart unless-stopped \
  -p 18800:18800 \
  -p 18790:18790 \
  -e TZ=Asia/Shanghai \
  -e PICOCLAW_GATEWAY_HOST=0.0.0.0 \
  -v /volume1/docker/angel-code/data:/data \
  angel-code:latest
```

或在 Container Manager 图形界面里：
- 映像 → 选择 `angel-code` → 启动
- 端口：`18800`（Web 控制台）、`18790`（网关）
- 存储空间：把容器内 `/data` 映射到 `/volume1/docker/angel-code/data`

## 五、首次访问

浏览器打开 `http://<群晖IP>:18800`，会跳到设置页让你创建控制台密码，
之后登录即可使用。

## 数据持久化

所有数据都在挂载的 `/data` 目录：

```
data/
├── config.json            # 主配置（模型、频道）
├── launcher-config.json   # 控制台端口/白名单
├── launcher-auth.db       # 控制台密码（bcrypt）
├── .security.yml          # API Key、Bot Token
├── workspace/             # Agent 工作区、记忆、技能
└── sessions/              # 会话历史
```

备份整个 `data` 目录即可。升级镜像时重新 `docker load` 新包、重建容器，数据不受影响。

## 常见问题

**Q：`docker load` 报 "invalid tar header"**
传输过程中文件损坏。用 sha256 核对：

| 文件 | SHA256 |
|---|---|
| angel-code-amd64.tar | `fb0e7cd0bc7c22c42ad20baecbb23f61e4bc319a0051af53ccf80eb0f2ccbb6c` |
| angel-code-arm64.tar | `a7c04a9bb75c960492459f867603708dc26e5834688519e1ae8ac54f5919c358` |

群晖上执行 `sha256sum angel-code-amd64.tar` 比对。

**Q：容器启动后立即退出**
查看日志：`sudo docker logs angel-code`。
最常见原因是 `/data` 目录权限异常，或宿主机启用了特殊的 ACL 限制。

**Q：ARM 机型报 exec format error**
用错了架构的包。`uname -m` 为 `aarch64` 时必须导入 `angel-code-arm64.tar`。

**Q：访问 18800 提示拒绝连接**
检查 `sudo docker ps` 容器是否运行，以及群晖防火墙是否放行 18800。

**Q：频道保存后不生效**
频道配置保存后需要重启网关，在界面左下角点「热加载」。

## 重新构建镜像包

在装有 Go 和 Python 3 的机器上（无需 Docker）：

```sh
cd docker/synology

# 1. 交叉编译 Linux 二进制
cd ../..
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags goolm,stdjson -ldflags "-s -w" \
  -o docker/synology/bin/linux-amd64/picoclaw ./cmd/picoclaw
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags goolm,stdjson -ldflags "-s -w" \
  -o docker/synology/bin/linux-amd64/picoclaw-launcher ./web/backend/

# 2. 生成镜像 tar
cd docker/synology
python build_image.py --arch amd64
python build_image.py --arch arm64
```

`build_image.py` 会从阿里云镜像站拉取 alpine minirootfs 与 su-exec，
组装成符合 Docker 规范的镜像 tar。

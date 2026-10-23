# Angel Code 源码包 · 构建说明

本包是完整源码（不含依赖与构建产物），在有 Docker 的机器上执行一条命令即可产出镜像。

## 前置条件

- Docker 20.10+（或 Docker Desktop / 群晖 Container Manager）
- 至少 4 GB 可用磁盘
- 能访问 Docker Hub（拉取 `node:24-alpine`、`golang:1.25-alpine`、`alpine:3.20`）

> 若构建机无法访问 Docker Hub，可先配置镜像加速器，或把基础镜像预先 `docker pull` 下来。

## 构建镜像

```sh
# 解压
tar -xzf angel-code-src.tar.gz
cd picoclaw

# 构建（推荐：三阶段构建，前端 + Go 全部在容器内完成）
docker build -f docker/Dockerfile.launcher -t angel-code:latest .

# 查看结果
docker images | grep angel-code
```

构建内容：
1. `node:24-alpine` 阶段 —— pnpm 安装依赖、构建前端，输出到 `web/backend/dist`
2. `golang:1.25-alpine` 阶段 —— 编译 `picoclaw` 与 `picoclaw-launcher`，前端产物通过 `go:embed` 打进二进制
3. `alpine:3.20` 阶段 —— 最终运行镜像，含两个二进制与健康检查

## 导出镜像包（用于离线部署到群晖）

```sh
docker save angel-code:latest -o angel-code.tar
```

把 `angel-code.tar` 传到群晖后：

```sh
sudo docker load -i angel-code.tar
```

## 运行

```sh
docker run -d \
  --name angel-code \
  --restart unless-stopped \
  -p 18800:18800 \
  -p 18790:18790 \
  -e TZ=Asia/Shanghai \
  -e PICOCLAW_GATEWAY_HOST=0.0.0.0 \
  -v /volume1/docker/angel-code/data:/data \
  angel-code:latest
```

浏览器打开 `http://<IP>:18800`，首次访问会要求设置控制台密码。

## 多架构构建

群晖 ARM 机型需要 arm64 镜像：

```sh
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/Dockerfile.launcher \
  -t angel-code:latest \
  --load .
```

> `--load` 只能导出单一架构到本地。要同时产出两个架构，需推送到 registry
> 或用 `--output type=oci,dest=angel-code-oci.tar`。

## 备选：极简镜像（用预编译二进制）

若不想在构建机上跑 Node + Go，可使用 `docker/synology/Dockerfile`。
但该 Dockerfile 需要 `docker/synology/bin/linux-<arch>/` 下的预编译二进制，
本源码包**不包含**这些二进制（已在打包时排除）。需要另行提供，或改用上面的完整构建。

## 目录说明

```
picoclaw/
├── cmd/picoclaw/           # 网关主程序
├── pkg/                    # 核心逻辑（config、providers、channels…）
├── web/
│   ├── backend/            # Launcher 后端（REST API + 内嵌前端）
│   └── frontend/           # Angel Code 前端（React + Vite）
├── docker/
│   ├── Dockerfile.launcher # ← 构建用这个
│   ├── Dockerfile          # 纯网关镜像
│   └── synology/           # 群晖部署配置与构建脚本
└── workspace/              # Agent 默认工作区模板（会被 embed）
```

## 前端单独开发

```sh
cd web/frontend
pnpm install
pnpm dev            # 开发服务器（需另起后端，或改 vite proxy 指向 18800）
pnpm build:backend  # 构建前端到 web/backend/dist
pnpm build:preview  # 生成离线单文件预览（web/preview-dist/preview.html）
```

## 常见问题

**构建时 `pnpm install --frozen-lockfile` 失败**
`pnpm-lock.yaml` 与 `package.json` 不一致。改用 `pnpm install --no-frozen-lockfile`，
或确认解压完整。

**`make build` 报 `scripts/copydir.go` 找不到仓库根**
该脚本依赖 `LICENSE` 与 `.github/` 作为根目录锚点。确认它们存在于解压后的目录根部。

**Go 编译报 `libolm` 相关错误**
需要 `-tags goolm,stdjson`（`Makefile` 与 Dockerfile 已默认带上）。

**容器启动后立刻退出**
`docker logs angel-code` 查看原因。常见是 `/data` 挂载目录权限问题。

**频道配置保存后不生效**
需要在界面左下角点「热加载」重启网关。

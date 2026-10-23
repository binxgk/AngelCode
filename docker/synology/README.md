# 群晖部署说明

镜像里已包含构建好的 Angel Code Web 控制台，**不需要在群晖上编译 Go 或前端**。

## 目录结构

```
angel-code/
├── Dockerfile                  # 预编译镜像，秒级构建
├── docker-compose.yml
├── .dockerignore
├── bin/
│   ├── linux-amd64/            # x86 群晖（DS920+、DS1520+、DS1821+ 等）
│   │   ├── picoclaw
│   │   └── picoclaw-launcher
│   └── linux-arm64/            # ARM 群晖（DS223、DS124、DS423 等）
│       ├── picoclaw
│       └── picoclaw-launcher
└── data/                       # 首次启动自动创建，存放全部持久化数据
```

## 部署步骤

1. **确认机型架构**

   群晖 SSH 里执行：
   ```sh
   uname -m
   ```
   - 输出 `x86_64` → 用 `amd64`
   - 输出 `aarch64` → 用 `arm64`

2. **上传目录**

   把整个 `docker/synology/` 目录上传到群晖，例如 `/volume1/docker/angel-code/`。

3. **改架构（仅 ARM 机型）**

   编辑 `docker-compose.yml`：
   ```yaml
   args:
     TARGETARCH: arm64
   ```

4. **构建并启动**

   ```sh
   cd /volume1/docker/angel-code
   docker compose up -d --build
   ```

5. **首次访问**

   浏览器打开 `http://<群晖IP>:18800`，会跳到 `/launcher-setup` 让你设置控制台密码，然后登录即可。

## 端口说明

| 端口 | 用途 | 是否必须暴露 |
|---|---|---|
| 18800 | Web 控制台（Angel Code 界面） | 是 |
| 18790 | 网关 API、频道回调、健康检查 | 视频道而定 |

Telegram / Discord / 飞书等频道使用**出站长连接**，不需要映射 18790。只有需要外部回调的频道（如某些 Webhook 模式）才要暴露。

## 数据持久化

所有内容都在 `./data`（对应容器内 `/data`）：

```
data/
├── config.json           # 主配置（模型、频道等）
├── launcher-config.json  # 控制台端口/白名单
├── launcher-auth.db      # 控制台密码（bcrypt）
├── .security.yml         # API Key、Bot Token 等敏感字段
├── workspace/            # Agent 工作区、记忆、技能
└── sessions/             # 会话历史
```

备份只需备份整个 `data` 目录。升级镜像时 `docker compose up -d --build` 即可，数据不受影响。

## 常见问题

**Q：访问 18800 提示拒绝连接**
检查容器状态 `docker ps`，以及群晖防火墙是否放行 18800。

**Q：能打开页面但接口 401**
这是控制台密码会话过期，重新访问 `http://<IP>:18800/launcher-login` 登录。

**Q：从局域网其他设备访问被拒绝**
控制台默认允许 localhost 绕过、并绑定 `0.0.0.0`。若你在「设置 → 配置」里填过「允许访问网段」，需要把所在网段加进去（例如 `192.168.1.0/24`）。

**Q：频道保存后不生效**
频道配置保存后需要重启网关。在界面左下角点「热加载」即可。

**Q：ARM 机型构建报 `exec format error`**
说明 `TARGETARCH` 与机型不匹配，按第 3 步改成 `arm64` 后重新构建。

# ============================================================
# Angel Code / PicoClaw — Synology prebuilt image
#
# 该 Dockerfile 直接 COPY 预编译好的 Linux 二进制，不执行 Go / Node 构建，
# 因此在群晖（NAS）这类低配环境上构建只需几秒。
#
# 构建参数：
#   TARGETARCH=amd64 | arm64
#
# 预编译产物位于 bin/linux-${TARGETARCH}/
# ============================================================

FROM alpine:3.20

ARG TARGETARCH=amd64

RUN apk add --no-cache ca-certificates tzdata curl su-exec \
    && addgroup -g 1000 -S picoclaw \
    && adduser -u 1000 -S -G picoclaw -h /home/picoclaw picoclaw \
    && mkdir -p /data \
    && chown -R picoclaw:picoclaw /data /home/picoclaw

COPY bin/linux-${TARGETARCH}/picoclaw            /usr/local/bin/picoclaw
COPY bin/linux-${TARGETARCH}/picoclaw-launcher   /usr/local/bin/picoclaw-launcher
COPY entrypoint.sh                               /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/picoclaw \
             /usr/local/bin/picoclaw-launcher \
             /usr/local/bin/entrypoint.sh

# 所有配置、会话、工作区、登录数据库都落在 /data，便于群晖挂载
ENV PICOCLAW_HOME=/data
ENV TZ=Asia/Shanghai
ENV PICOCLAW_GATEWAY_HOST=0.0.0.0

WORKDIR /data

EXPOSE 18800 18790

# 控制台健康检查（launcher 端口）
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:18800/api/auth/status >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

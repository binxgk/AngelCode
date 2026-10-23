#!/bin/sh
# ============================================================
# Angel Code 容器入口
#
# 群晖挂载的 /data 属主通常是 root（或由 Container Manager 创建）。
# 这里先以 root 修正属主，再降权到 picoclaw 运行，避免
# "permission denied" 导致 onboard / 配置写入失败。
# ============================================================
set -e

DATA_DIR="${PICOCLAW_HOME:-/data}"

mkdir -p "$DATA_DIR"
chown -R picoclaw:picoclaw "$DATA_DIR" 2>/dev/null || true

# 清理上次异常退出残留的 PID 文件，否则网关可能拒绝启动
rm -f "$DATA_DIR/.picoclaw.pid" 2>/dev/null || true

exec su-exec picoclaw:picoclaw \
  picoclaw-launcher -console -public -no-browser "$@"

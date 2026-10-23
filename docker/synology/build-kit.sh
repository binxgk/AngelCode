#!/bin/sh
# 在任意有 Docker 的机器（含群晖）上构建镜像
# 用法: ./build-kit.sh [amd64|arm64]
set -e
ARCH="${1:-amd64}"
echo "Building angel-code:latest for linux/${ARCH} ..."
docker build --build-arg "TARGETARCH=${ARCH}" -t angel-code:latest .
echo "Done. 运行: docker compose up -d"

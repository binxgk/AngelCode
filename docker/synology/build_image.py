#!/usr/bin/env python3
"""
无需 Docker 即可生成 docker load 可直接导入的镜像 tar。

原理：
  镜像 tar = OCI/Docker 镜像布局（manifest.json + config json + layer tar）
  每个 layer 就是文件系统的 tar 快照。

  我们基于 alpine-minirootfs 打底，再叠加一层包含：
    /usr/local/bin/picoclaw
    /usr/local/bin/picoclaw-launcher
    /usr/local/bin/entrypoint.sh
    /etc/... 时区、用户、启动配置

用法：
  python build_image.py --arch amd64
  python build_image.py --arch arm64
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import shutil
import sys
import tarfile
import tempfile
import time
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
BIN_DIR = os.path.join(ROOT, "bin")
OUT_DIR = os.path.join(ROOT, "images")

ALPINE_VERSION = "3.20.3"
ALPINE_MIRROR = "https://mirrors.aliyun.com/alpine/v3.20/releases"
ALPINE_PKG_MIRROR = "https://mirrors.aliyun.com/alpine/v3.20/main"
SU_EXEC_VERSION = "0.2-r3"
ALPINE_ARCH = {"amd64": "x86_64", "arm64": "aarch64"}

IMAGE_REPO = "angel-code"
IMAGE_TAG = "latest"

ENTRYPOINT = """#!/bin/sh
set -e

DATA_DIR="${PICOCLAW_HOME:-/data}"

mkdir -p "$DATA_DIR"
chown -R picoclaw:picoclaw "$DATA_DIR" 2>/dev/null || true
rm -f "$DATA_DIR/.picoclaw.pid" 2>/dev/null || true

exec su-exec picoclaw:picoclaw \\
  picoclaw-launcher -console -public -no-browser "$@"
"""

# Alpine 的 /etc/passwd、/etc/group 追加应用用户
PASSWD_APPEND = "picoclaw:x:1000:1000:picoclaw:/home/picoclaw:/sbin/nologin\n"
GROUP_APPEND = "picoclaw:x:1000:\n"


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def download_rootfs(arch: str, dest: str) -> None:
    alpine_arch = ALPINE_ARCH[arch]
    url = (
        f"{ALPINE_MIRROR}/{alpine_arch}/"
        f"alpine-minirootfs-{ALPINE_VERSION}-{alpine_arch}.tar.gz"
    )
    if os.path.exists(dest):
        print(f"  rootfs 已存在，跳过下载: {dest}")
        return
    print(f"  下载 {url}")
    urllib.request.urlretrieve(url, dest)


def fetch_su_exec(arch: str, dest: str) -> None:
    """下载并解出 su-exec（入口脚本降权用）。"""
    if os.path.exists(dest):
        return
    alpine_arch = ALPINE_ARCH[arch]
    url = f"{ALPINE_PKG_MIRROR}/{alpine_arch}/su-exec-{SU_EXEC_VERSION}.apk"
    apk_path = dest + ".apk"
    print(f"  下载 su-exec: {url}")
    urllib.request.urlretrieve(url, apk_path)
    with tarfile.open(apk_path, "r:gz") as tf:
        member = tf.getmember("sbin/su-exec")
        with open(dest, "wb") as out:
            out.write(tf.extractfile(member).read())
    os.remove(apk_path)


def extract_rootfs(rootfs: str, dest_dir: str) -> None:
    print("  解压 alpine rootfs")
    with tarfile.open(rootfs, "r:gz") as tf:
        tf.extractall(dest_dir)


def add_layer_tar(
    base_dir: str,
    layer_path: str,
    additions: list[tuple[str, bytes, int]],
    deletes: list[str] | None = None,
) -> str:
    """
    以 base_dir 为根生成 layer tar，并追加/覆盖 additions。
    additions: [(容器内绝对路径, 内容, 权限)]
    返回 layer 的 sha256。
    """
    entries: dict[str, bytes] = {}
    for rel in (deletes or []):
        pass

    with tarfile.open(layer_path, "w") as tf:
        for abs_path, content, mode in additions:
            info = tarfile.TarInfo(name=abs_path.lstrip("/"))
            info.size = len(content)
            info.mode = mode
            info.mtime = int(time.time())
            info.uid = 0
            info.gid = 0
            info.uname = "root"
            info.gname = "root"
            tf.addfile(info, io.BytesIO(content))

    return sha256_file(layer_path)


def build_layer(arch: str, work: str) -> str:
    """构建应用层，返回 layer tar 路径。"""
    bin_dir = os.path.join(BIN_DIR, f"linux-{arch}")
    layer_path = os.path.join(work, "app-layer.tar")

    additions: list[tuple[str, bytes, int]] = []

    for name in ("picoclaw", "picoclaw-launcher"):
        src = os.path.join(bin_dir, name)
        if not os.path.exists(src):
            sys.exit(f"缺少二进制: {src}")
        with open(src, "rb") as f:
            additions.append((f"/usr/local/bin/{name}", f.read(), 0o755))

    additions.append(("/usr/local/bin/entrypoint.sh", ENTRYPOINT.encode(), 0o755))

    su_exec_path = os.path.join(work, "su-exec")
    fetch_su_exec(arch, su_exec_path)
    with open(su_exec_path, "rb") as f:
        additions.append(("/sbin/su-exec", f.read(), 0o755))

    # 追加用户与组
    with open(os.path.join(work, "rootfs", "etc", "passwd"), "rb") as f:
        passwd = f.read()
    with open(os.path.join(work, "rootfs", "etc", "group"), "rb") as f:
        group = f.read()
    if b"picoclaw" not in passwd:
        additions.append(("/etc/passwd", passwd + PASSWD_APPEND.encode(), 0o644))
    if b"picoclaw" not in group:
        additions.append(("/etc/group", group + GROUP_APPEND.encode(), 0o644))

    # 目录占位
    for d in ("/data", "/home/picoclaw"):
        info_path = os.path.join(work, "dirs")
        os.makedirs(info_path, exist_ok=True)
        additions.append((f"{d}/.keep", b"", 0o644))

    with tarfile.open(layer_path, "w") as tf:
        added_dirs: set[str] = set()
        for abs_path, content, mode in additions:
            parts = abs_path.strip("/").split("/")
            # 逐级补目录项，保证 docker load 后目录存在且有正确权限
            for i in range(1, len(parts)):
                dir_path = "/".join(parts[:i])
                if dir_path in added_dirs:
                    continue
                added_dirs.add(dir_path)
                dinfo = tarfile.TarInfo(name=dir_path)
                dinfo.type = tarfile.DIRTYPE
                dinfo.mode = 0o755
                dinfo.mtime = int(time.time())
                dinfo.uid = 0
                dinfo.gid = 0
                tf.addfile(dinfo)

            info = tarfile.TarInfo(name=abs_path.lstrip("/"))
            info.size = len(content)
            info.mode = mode
            info.mtime = int(time.time())
            info.uid = 0
            info.gid = 0
            tf.addfile(info, io.BytesIO(content))

    return layer_path


def build_image(arch: str) -> str:
    os.makedirs(OUT_DIR, exist_ok=True)
    work = tempfile.mkdtemp(prefix=f"angel-code-{arch}-")
    try:
        rootfs_tgz = os.path.join(work, "rootfs.tar.gz")
        rootfs_dir = os.path.join(work, "rootfs")
        os.makedirs(rootfs_dir)

        download_rootfs(arch, rootfs_tgz)
        extract_rootfs(rootfs_tgz, rootfs_dir)

        print("  构建应用层")
        app_layer = build_layer(arch, work)

        base_layer = os.path.join(work, "base-layer.tar")
        shutil.move(rootfs_tgz, base_layer)  # alpine rootfs 本身可作为 layer

        # Docker 接受 gzip 压缩的 layer
        layers = [
            (base_layer, sha256_file(base_layer), os.path.getsize(base_layer)),
            (app_layer, sha256_file(app_layer), os.path.getsize(app_layer)),
        ]

        print("  生成镜像配置")
        image_id = hashlib.sha256(
            "".join(l[1] for l in layers).encode() + arch.encode()
        ).hexdigest()

        config = {
            "architecture": arch,
            "os": "linux",
            "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "config": {
                "Env": [
                    "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                    "PICOCLAW_HOME=/data",
                    "TZ=Asia/Shanghai",
                    "PICOCLAW_GATEWAY_HOST=0.0.0.0",
                ],
                "Entrypoint": ["/usr/local/bin/entrypoint.sh"],
                "ExposedPorts": {"18800/tcp": {}, "18790/tcp": {}},
                "WorkingDir": "/data",
                "User": "0:0",
            },
            "history": [
                {
                    "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "created_by": f"alpine {ALPINE_VERSION} minirootfs",
                },
                {
                    "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "created_by": "angel-code binaries",
                },
            ],
            "rootfs": {
                "type": "layers",
                "diff_ids": [f"sha256:{l[1]}" for l in layers],
            },
        }

        config_bytes = json.dumps(config, indent=2).encode()
        config_digest = sha256_bytes(config_bytes)
        config_path = os.path.join(work, f"{config_digest}.json")
        with open(config_path, "wb") as f:
            f.write(config_bytes)

        manifest = [
            {
                "Config": f"{config_digest}.json",
                "RepoTags": [f"{IMAGE_REPO}:{IMAGE_TAG}-{arch}"],
                "Layers": [f"{l[1]}/layer.tar" for l in layers],
            }
        ]
        manifest_bytes = json.dumps(manifest, indent=2).encode()

        out_path = os.path.join(OUT_DIR, f"angel-code-{arch}.tar")
        print(f"  打包 {out_path}")
        with tarfile.open(out_path, "w") as tf:
            def add_file(arcname: str, src: str) -> None:
                tf.add(src, arcname=arcname, recursive=False)

            for idx, (path, digest, _size) in enumerate(layers):
                dir_name = digest
                # 目录项
                dinfo = tarfile.TarInfo(name=dir_name)
                dinfo.type = tarfile.DIRTYPE
                dinfo.mode = 0o755
                dinfo.mtime = int(time.time())
                tf.addfile(dinfo)
                add_file(f"{dir_name}/layer.tar", path)
                # VERSION 文件（兼容旧 docker）
                vinfo = tarfile.TarInfo(name=f"{dir_name}/VERSION")
                vinfo.size = 3
                vinfo.mtime = int(time.time())
                tf.addfile(vinfo, io.BytesIO(b"1.0"))

            add_file(f"{config_digest}.json", config_path)

            minfo = tarfile.TarInfo(name="manifest.json")
            minfo.size = len(manifest_bytes)
            minfo.mtime = int(time.time())
            tf.addfile(minfo, io.BytesIO(manifest_bytes))

            # repositories（旧格式兼容）
            repos = {f"{IMAGE_REPO}": {f"{IMAGE_TAG}-{arch}": layers[-1][1]}}
            rbytes = json.dumps(repos, indent=2).encode()
            rinfo = tarfile.TarInfo(name="repositories")
            rinfo.size = len(rbytes)
            rinfo.mtime = int(time.time())
            tf.addfile(rinfo, io.BytesIO(rbytes))

        size_mb = os.path.getsize(out_path) / 1024 / 1024
        print(f"  完成: {out_path} ({size_mb:.1f} MB)")
        return out_path
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--arch", choices=["amd64", "arm64"], required=True)
    args = parser.parse_args()
    print(f"构建 angel-code:{IMAGE_TAG}-{args.arch}")
    build_image(args.arch)


if __name__ == "__main__":
    main()

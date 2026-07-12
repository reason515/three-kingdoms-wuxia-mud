#!/usr/bin/env python3
"""Reliable local server for the playable Web slice."""
from __future__ import annotations

import argparse
import http.server
import os
import socket
import sys
import threading
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GAME_PATH = "/docs/game.html"
MARKER = "汉末江湖录".encode("utf-8")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        sys.stderr.write("  %s\n" % (args[0] if args else format))


class ExclusiveThreadingHTTPServer(http.server.ThreadingHTTPServer):
    """Avoid accidentally starting multiple servers on the same Windows port."""

    daemon_threads = True
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def game_is_already_running(port: int) -> bool:
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(f"http://127.0.0.1:{port}{GAME_PATH}", timeout=2) as response:
            return response.status == 200 and MARKER in response.read(8192)
    except Exception:
        return False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="启动《汉末江湖录》本地 Web 服务")
    parser.add_argument("--port", type=int, default=8080, help="监听端口，默认 8080")
    parser.add_argument("--no-open", action="store_true", help="不自动打开浏览器")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    os.chdir(ROOT)
    local_url = f"http://127.0.0.1:{args.port}{GAME_PATH}"
    localhost_url = f"http://localhost:{args.port}{GAME_PATH}"

    if game_is_already_running(args.port):
        print(f"游戏服务已经在运行：{local_url}", flush=True)
        if not args.no_open:
            webbrowser.open(local_url)
        return 0

    try:
        server = ExclusiveThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    except OSError as exc:
        if game_is_already_running(args.port):
            print(f"游戏服务已经在运行：{local_url}", flush=True)
            if not args.no_open:
                webbrowser.open(local_url)
            return 0
        print(f"无法启动：端口 {args.port} 已被其他程序占用。", file=sys.stderr)
        print(f"可尝试：python serve.py --port {args.port + 1}", file=sys.stderr)
        print(f"系统错误：{exc}", file=sys.stderr)
        return 1

    print("汉末江湖录 · 本地开发服务器", flush=True)
    print(f"推荐访问：{local_url}", flush=True)
    print(f"备用地址：{localhost_url}", flush=True)
    print("如果使用代理软件，请把 localhost 和 127.0.0.1 加入直连/绕过列表。", flush=True)
    print("按 Ctrl+C 停止。", flush=True)

    if not args.no_open:
        threading.Timer(0.5, lambda: webbrowser.open(local_url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。", flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

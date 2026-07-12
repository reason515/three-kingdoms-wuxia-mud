"""E2E smoke test: starts serve.py, fetches critical resources, verifies they load.

Usage: python tools/e2e_smoke.py
"""
from __future__ import annotations

import http.server
import json
import os
import sys
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        pass  # suppress logs


NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def fetch(url: str) -> tuple[int, bytes]:
    try:
        with NO_PROXY_OPENER.open(url, timeout=5) as resp:
            return resp.status, resp.read()
    except Exception as e:
        return 0, str(e).encode()


def main() -> int:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.3)

    base = f"http://127.0.0.1:{server.server_port}"
    resources = [
        ("游戏页面", f"{base}/docs/game.html", "text/html", "汉末江湖录".encode()),
        ("MUD规则模块", f"{base}/docs/mud-engine.js", "text/javascript", b"MUD_LOCATIONS"),
        ("杜缄内容包", f"{base}/content/changan/du_jian/route.json", "application/json", b'"bundleId"'),
        ("任朔内容包", f"{base}/content/changan/ren_shuo/route.json", "application/json", b'"bundleId"'),
    ]

    failed = 0
    for name, url, expected_ct, marker in resources:
        status, body = fetch(url)
        ok = status == 200 and marker in body
        status_text = f"HTTP {status}" if status else f"错误: {body[:60].decode('utf-8', errors='replace')}"
        print(f"  {'PASS' if ok else 'FAIL'}  {name}: {status_text}  ({len(body)} bytes)")
        if not ok:
            failed += 1

    # Also validate JSON structure for both bundles
    for char in ("du_jian", "ren_shuo"):
        status, body = fetch(f"{base}/content/changan/{char}/route.json")
        if status == 200:
            try:
                bundle = json.loads(body)
                events = len(bundle.get("events", []))
                choices = sum(len(e.get("choices", [])) for e in bundle.get("events", []))
                endings = len(bundle.get("endings", []))
                print(f"  PASS  {char}: {events} 事件, {choices} 选项, {endings} 结局")
            except json.JSONDecodeError as e:
                print(f"  FAIL  {char}: JSON 解析失败: {e}")
                failed += 1
        else:
            print(f"  FAIL  {char}: HTTP {status}")
            failed += 1

    server.shutdown()
    server.server_close()
    print(f"\n{'='*50}\n{'全部通过' if not failed else f'失败 {failed} 项'}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

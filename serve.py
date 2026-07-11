#!/usr/bin/env python3
"""Minimal static server for the game HTML. Run from project root."""
import http.server
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

PORT = 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        sys.stderr.write("  %s\n" % (args[0] if args else format))


print(f"汉末江湖录 · 本地开发服务器")
print(f"打开浏览器访问: http://localhost:{PORT}/docs/game.html")
print(f"按 Ctrl+C 停止")
print()

http.server.HTTPServer(("", PORT), Handler).serve_forever()

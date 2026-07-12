"""Run all validation suites: content schema, regression routes, E2E smoke.

Usage: python tools/validate_all.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"

STEPS = [
    ("内容结构校验", [sys.executable, str(TOOLS / "validate_content.py")]),
    ("沉浸叙事校验", [sys.executable, str(TOOLS / "validate_immersion.py")]),
    ("杜缄回归测试", [sys.executable, str(TOOLS / "validate_du_jian_routes.py")]),
    ("任朔回归测试", [sys.executable, str(TOOLS / "validate_ren_shuo_routes.py")]),
    ("跨人物接口校验", [sys.executable, str(TOOLS / "validate_cross_character.py")]),
    ("E2E资源冒烟测试", [sys.executable, str(TOOLS / "e2e_smoke.py")]),
    ("E2E浏览器交互测试", [sys.executable, str(TOOLS / "e2e_browser.py")]),
]


def main() -> int:
    failed = 0
    for name, cmd in STEPS:
        print(f"\n{'─'*50}\n  {name}\n{'─'*50}")
        result = subprocess.run(cmd, cwd=str(ROOT),
                                env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"},
                                capture_output=True, encoding="utf-8", errors="replace")
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        if result.returncode != 0:
            failed += 1
            print(f"  >>> FAIL: {name} (exit {result.returncode})")
    print(f"\n{'='*50}")
    print(f"通过: {len(STEPS)-failed}/{len(STEPS)}  (失败: {failed})")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

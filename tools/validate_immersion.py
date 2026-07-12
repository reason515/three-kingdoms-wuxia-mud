"""Narrative immersion quality gates for the Chang'an MVP bundles."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLES = list((ROOT / "content/changan").glob("*/route.json"))
FORBIDDEN_INTENT = re.compile(r"设置|进入\s*[DR]\d|结局|解锁|领悟\s*[+＋]|获得\s*[`\w]")


def main() -> int:
    errors: list[str] = []
    total_resolutions = 0
    for path in BUNDLES:
        data = json.loads(path.read_text(encoding="utf-8"))
        texts = data["texts"]
        if data.get("contentVersion") != "0.2.0":
            errors.append(f"{path}: contentVersion must be 0.2.0")
        if not any(c["id"] == "character.a_he" for c in data["characters"]):
            errors.append(f"{path}: named civilian anchor character.a_he missing")
        for event in data["events"]:
            for choice in event["choices"]:
                intent = texts.get(choice["intentKey"], "")
                if FORBIDDEN_INTENT.search(intent):
                    errors.append(f"{choice['id']}: system-facing intent remains: {intent}")
                for index, resolution in enumerate(choice["resolutions"]):
                    total_resolutions += 1
                    key = resolution.get("resultTextKey")
                    result = texts.get(key, "") if key else ""
                    if not key or len(result) < 8:
                        errors.append(f"{choice['id']}[{index}]: missing meaningful result text")
                    aluo_fate = [e.get("fate") for e in resolution["effects"] if e.get("op") == "setCharacterFate" and e.get("characterId") == "character.aluo"]
                    ahe_fate = [e.get("fate") for e in resolution["effects"] if e.get("op") == "setCharacterFate" and e.get("characterId") == "character.a_he"]
                    if aluo_fate and ahe_fate != aluo_fate:
                        errors.append(f"{choice['id']}[{index}]: 阿禾命运未与阿萝连续")
        aftermath = [e for e in data["events"] if e["stage"] == "stage.changan.aftermath"]
        if not aftermath or not all(e.get("textVariants") for e in aftermath):
            errors.append(f"{path}: aftermath must provide conditional text variants")
        if not all(e.get("summaryVariants") for e in data["endings"]):
            errors.append(f"{path}: every ending needs conditional summary variants")

    if errors:
        print("沉浸叙事校验失败：")
        for error in errors:
            print("  -", error)
        return 1
    print(f"PASS {len(BUNDLES)} 个内容包：{total_resolutions} 条即时结果、条件尾声、阿禾命运连续、选项提示去系统化")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

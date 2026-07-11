"""Replay representative Ren Shuo routes from the real content bundle."""
from __future__ import annotations
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from content_runtime import ContentRuntime

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = json.loads((ROOT / "content" / "changan" / "ren_shuo" / "route.json").read_text(encoding="utf-8"))
P = "choice.changan.renshuo."


def run(choices: list[str]) -> ContentRuntime:
    rt = ContentRuntime(BUNDLE)
    for choice in choices:
        rt.choose(P + choice)
    assert rt.ending is not None
    return rt


ROUTES = {
    "破阵突围": [
        "r01.accept", "r02.copy_names", "r03.show_token", "r04.listen",
        "r05.acquiesce", "r06_armor.keep_light", "r06_medicine.give_old",
        "r07.breaker", "r08.with_wei", "r09a.fight", "r09b.breaker",
        "r09c.leave_chaos", "r10.leave",
    ],
    "护军保人": [
        "r01.accept", "r02.trace_sword", "r03.help", "r04.listen",
        "r05.stop_quietly", "r06_armor.distribute", "r06_medicine.give_old",
        "r07.protector", "r08.civilians_first", "r09a.demand_free",
        "r09b.protector", "r09c.break_saber", "r10.protect",
    ],
    "军法受缚": [
        "r01.accept", "r02.copy_names", "r03.help", "r04.listen",
        "r05.acquiesce", "r06_armor.wear_full", "r06_medicine.give_old",
        "r07.skip", "r08.civilians_first", "r09a.fight",
        "r09b.armor_block", "r09c.let_go", "r10.prison",
    ],
}
EXPECTED = {
    "破阵突围": "ending.changan.renshuo.breakthrough",
    "护军保人": "ending.changan.renshuo.protect_ren",
    "军法受缚": "ending.changan.renshuo.prison_ren",
}
INJ = ["无伤", "轻伤", "重伤", "濒危", "死亡"]
HEAT = ["平静", "起疑", "暴露", "缉拿"]
FREE = {"free": "自由", "captured": "落网", "imprisoned": "收押", "escaped": "脱逃", "coerced": "被迫效力"}

if __name__ == "__main__":
    print("任朔真实内容代表路线验证")
    print("=" * 82)
    for name, choices in ROUTES.items():
        rt = run(choices)
        assert rt.ending == EXPECTED[name], (name, rt.ending)
        s = rt.state
        print(
            f"PASS  {name:<8} 结局={rt.ending.rsplit('.', 1)[-1]:<14} "
            f"余时={s['resources']['time']} 内息={s['resources']['breath']} "
            f"伤势={INJ[s['injury']]} 风声={HEAT[s['heat']]} "
            f"自由={FREE[s['freedom']]} 选择={len(rt.log)}"
        )
    print("=== 全部通过 ===")

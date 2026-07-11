"""Validate cross-character state interfaces between Du Jian and Ren Shuo routes.

For each documented cross-character interface, run the source route to the point
where it produces the state, then inject that state into the target route and
verify the previously-zero-hit options become available.
"""
from __future__ import annotations

import json, sys
from pathlib import Path
from copy import deepcopy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from content_runtime import ContentRuntime

ROOT = Path(__file__).resolve().parents[1]

DU_BUNDLE = json.loads((ROOT / "content/changan/du_jian/route.json").read_text(encoding="utf-8"))
RE_BUNDLE = json.loads((ROOT / "content/changan/ren_shuo/route.json").read_text(encoding="utf-8"))


def run_path(bundle: dict, choices: list[str]) -> ContentRuntime:
    rt = ContentRuntime(bundle)
    for cid in choices:
        rt.choose(cid)
    return rt


def inject_flags(source: ContentRuntime, target_bundle: dict, flags: list[str]) -> ContentRuntime:
    """Create a new runtime for target_bundle with cross-character flags from source."""
    rt = ContentRuntime(target_bundle)
    for flag in flags:
        if flag in source.state["flags"]:
            rt.state["flags"].add(flag)
    # Also inject knowledge
    for k in ("claim.zhao.left_shoulder",):
        if k in source.state["knowledge"]:
            rt.state["knowledge"].add(k)
    # Inject fates for cross-character NPCs
    fate_map = {
        "character.zhao_heng": source.state.get("fates", {}).get("character.zhao_heng"),
    }
    for cid, fate in fate_map.items():
        if fate and cid in rt.state["fates"]:
            rt.state["fates"][cid] = fate
    return rt


def check_option_available(rt: ContentRuntime, event_id: str, choice_slug: str) -> bool:
    """Navigate to event and check if the given choice is available."""
    rt.current = event_id
    event = rt.events.get(event_id)
    if not event:
        return False
    for c in event["choices"]:
        if c["id"].endswith("." + choice_slug):
            return rt.check(c["availability"])
    return False


def test_interface(name: str, du_path: list[str], re_path: list[str],
                   flags: list[str], target_event: str, target_choice: str) -> bool:
    """Test one cross-character interface.

    du_path: Du Jian choices to set the cross-character state
    re_path: Ren Shuo choices (without cross-char state) that build context
    flags: cross-character flags to inject
    target_event: event ID in Ren Shuo where the unlocked option lives
    target_choice: slug of the option that should become available
    """
    print(f"\n── {name} ──")

    # 1. Verify option is locked without cross-char state
    rt_before = run_path(RE_BUNDLE, re_path[:3])  # run a few steps for context
    locked_before = not check_option_available(rt_before, target_event, target_choice)
    print(f"  无交叉状态: {'锁定' if locked_before else '可用'} (预期锁定)")

    # 2. Run Du Jian path to set cross-character state
    rt_du = run_path(DU_BUNDLE, du_path)

    # 3. Run Ren Shuo with injected flags
    rt_re = inject_flags(rt_du, RE_BUNDLE, flags)
    for cid in re_path[:3]:  # run context steps
        rt_re.choose(cid)

    available = check_option_available(rt_re, target_event, target_choice)
    print(f"  注入交叉状态: {'可用' if available else '锁定'} (预期可用)")

    if not available:
        print(f"  FAIL: {target_choice} 在注入 {flags} 后仍不可用")
        return False
    print("  PASS")
    return True


def main() -> int:
    print("双人物交叉状态接口验证")
    print("=" * 70)

    results: list[bool] = []

    # 1. Du Jian D04B save attacker → Ren Shuo R02 interrogate
    results.append(test_interface(
        "杜缄救持卷者 → 任朔逼问",
        du_path=[
            "choice.changan.dujian.d01.accept",
            "choice.changan.dujian.d02.chase_archer",
            "choice.changan.dujian.d03.chase",
            "choice.changan.dujian.d04b.save_attacker",
        ],
        re_path=["choice.changan.renshuo.r01.accept"],
        flags=["crossrun.attacker_saved"],
        target_event="event.changan.renshuo.r02",
        target_choice="interrogate",
    ))

    # 2. Du Jian leave armor → Ren Shuo R02 scavenge
    results.append(test_interface(
        "杜缄留甲 → 任朔翻废墟",
        du_path=[
            "choice.changan.dujian.d01.accept",
            "choice.changan.dujian.d02.guard_xu",
            "choice.changan.dujian.d03.stay",
            "choice.changan.dujian.d03_treat.use_medicine",
            "choice.changan.dujian.d04a.take_leaf",
            "choice.changan.dujian.d05.take_all",
            "choice.changan.dujian.d06_armor.leave",
        ],
        re_path=["choice.changan.renshuo.r01.accept"],
        flags=["crossrun.armor_left"],
        target_event="event.changan.renshuo.r02",
        target_choice="scavenge",
    ))

    # 3. Ren Shuo find shoulder → Du Jian D11a shoulder
    # Run Ren Shuo to produce zhao_shoulder_found, then inject into Du Jian
    print("\n── 任朔发现左肩旧伤 → 杜缄指出破绽 ──")
    rt_re_src = run_path(RE_BUNDLE, [
        "choice.changan.renshuo.r01.accept",
        "choice.changan.renshuo.r02.trace_sword",
    ])
    assert "zhao_shoulder_found" in rt_re_src.state["flags"]
    assert "claim.zhao.left_shoulder" in rt_re_src.state["knowledge"]

    # Verify locked without cross-char knowledge
    rt_du_before = run_path(DU_BUNDLE, [
        "choice.changan.dujian.d01.accept",
        "choice.changan.dujian.d02.guard_xu",
        "choice.changan.dujian.d03.stay",
        "choice.changan.dujian.d03_treat.use_medicine",
        "choice.changan.dujian.d04a.take_leaf",
        "choice.changan.dujian.d05.take_all",
        "choice.changan.dujian.d06_armor.stretcher",
        "choice.changan.dujian.d06_medicine.aluo_treats",
        "choice.changan.dujian.d07.guard",
        "choice.changan.dujian.d08.confront",
        "choice.changan.dujian.d09.guard",
        "choice.changan.dujian.d10.aluo_first",
    ])
    rt_du_before.current = "event.changan.dujian.d11a"
    locked = not check_option_available(rt_du_before, "event.changan.dujian.d11a", "shoulder")
    print(f"  无交叉知识: {'锁定' if locked else '可用'} (预期锁定)")

    # Create Du Jian runtime with injected knowledge
    rt_du_after = ContentRuntime(DU_BUNDLE)
    rt_du_after.state["knowledge"].add("claim.zhao.left_shoulder")
    rt_du_after.state["flags"].add("zhao_shoulder_found")
    # Run the same Du Jian path
    for cid in [
        "choice.changan.dujian.d01.accept",
        "choice.changan.dujian.d02.guard_xu",
        "choice.changan.dujian.d03.stay",
        "choice.changan.dujian.d03_treat.use_medicine",
        "choice.changan.dujian.d04a.take_leaf",
        "choice.changan.dujian.d05.take_all",
        "choice.changan.dujian.d06_armor.stretcher",
        "choice.changan.dujian.d06_medicine.aluo_treats",
        "choice.changan.dujian.d07.guard",
        "choice.changan.dujian.d08.confront",
        "choice.changan.dujian.d09.guard",
        "choice.changan.dujian.d10.aluo_first",
    ]:
        rt_du_after.choose(cid)
    available = check_option_available(rt_du_after, "event.changan.dujian.d11a", "shoulder")
    print(f"  注入交叉知识: {'可用' if available else '锁定'} (预期可用)")
    if available:
        print("  PASS")
        results.append(True)
    else:
        print("  FAIL")
        results.append(False)

    passed = sum(results)
    failed = len(results) - passed
    print(f"\n{'='*70}")
    print(f"通过: {passed}/{len(results)}  (失败: {failed})")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())

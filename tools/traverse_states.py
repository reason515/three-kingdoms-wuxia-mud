"""Bounded state-space traversal for content bundle validation.

BFS through reachable choices with per-event sampling caps.
Deduplicates by semantic state hash and reports coverage, dead ends, errors,
and ending distribution.
"""
from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from content_runtime import ContentRuntime

ROOT = Path(__file__).resolve().parents[1]

RESOURCE_FIELDS = ("breath", "time", "favor")
KEY_FLAGS = frozenset({
    "route.guard", "route.roam", "manual.carried", "manual.entrusted",
    "xu_safe", "aluo_with_player", "civilians_follow", "escort.intact",
    "zhao.opening", "zhao.promise", "order.fulfilled", "captured.by_zhao",
    "equipment.heavy_armor_equipped", "stretcher_armor",
    "leaf.held_by_xu", "aluo_knows_route", "evidence.saved",
    "zhao.confronted", "zhao.knows_location", "zhao.first_attack_weakened",
    "crossrun.attacker_saved", "crossrun.armor_left", "crossrun.shed_cut",
    "achievement.one_holds_alley", "achievement.wounded_rearguard",
    "achievement.disarmed_without_killing", "achievement.escape_changan",
    "fate.foster_mother_safe", "condition.hidden_internal_injury",
    "legacy.manual", "legacy.entrusted", "legacy.abandoned_blade", "legacy.prison_wall",
    "progression.technique_forfeited", "pursuit.misdirected",
    "ending.preference.protect", "ending.preference.record",
    "ending.preference.leave", "ending.preference.prison",
    "knowledge.aluo_is_witness", "manual.abandoned", "unlock.ren_route",
    "hazard.spilled_oil",
})
KEY_FATES = frozenset({
    "character.du_jian", "character.zhao_heng", "character.xu_jian",
    "character.aluo", "character.civilians", "character.elder",
})
KEY_ITEM_STATES = frozenset({
    "item_instance.du_jian.short_sword",
    "item_instance.du_jian.armor",
    "item_instance.du_jian.medicine",
    "item_instance.du_jian.firestarter",
    "item_instance.du_jian.manual",
    "item_instance.du_jian.sealed_document",
    "item_instance.du_jian.original_leaf",
    "item_instance.du_jian.altered_copy",
    "item_instance.du_jian.sword_seal",
    "item_instance.aluo.medicine",
})


def state_hash(rt: ContentRuntime) -> int:
    s = rt.state
    items = sorted(
        (iid, str(s["items"][iid].get("state")), str(s["items"][iid].get("holderId")),
         s["items"][iid].get("equipped", False))
        for iid in KEY_ITEM_STATES if iid in s["items"]
    )
    rels = sorted(
        (cid, int(rel.get("attitude", 0)),
         tuple(sorted(str(t) for t in rel.get("tags", set()))))
        for cid, rel in s.get("relationships", {}).items()
    )
    parts: tuple[Any, ...] = (
        rt.current,
        tuple(s["resources"][r] for r in RESOURCE_FIELDS),
        s["injury"], s["heat"], s["life"], s["freedom"],
        tuple(sorted(str(k) for k in s["flags"] if k in KEY_FLAGS)),
        tuple(sorted(str(c) for c in s["conduct"])),
        tuple(sorted(str(t) for t in s["techniques"])),
        tuple((str(k), int(s["insights"].get(k, 0))) for k in sorted(s["insights"]) if s["insights"].get(k)),
        tuple((str(cid), str(s["fates"].get(cid))) for cid in sorted(KEY_FATES) if cid in s["fates"]),
        tuple(items), tuple(rels),
    )
    return hash(parts)


def format_path(log: list[str]) -> str:
    return " → ".join(x.rsplit(".", 1)[-1] for x in log)


def main() -> int:
    path = ROOT / "content" / "changan" / "du_jian" / "route.json"
    if not path.exists():
        print(f"文件不存在: {path}", file=sys.stderr)
        return 1

    bundle = json.loads(path.read_text(encoding="utf-8"))
    events_map = {x["id"]: x for x in bundle["events"]}
    ending_map = {x["id"]: x for x in bundle["endings"]}
    all_choice_ids = {c["id"] for ev in bundle["events"] for c in ev["choices"]}

    MAX_STATES = int(sys.argv[1]) if len(sys.argv) > 1 else 120000
    MAX_PER_EVENT = int(sys.argv[2]) if len(sys.argv) > 2 else 5000

    root = ContentRuntime(bundle)
    queue: deque[ContentRuntime] = deque([root])
    visited: set[int] = set()
    event_hit: Counter[str] = Counter()
    choice_hit: Counter[str] = Counter()
    ending_hit: Counter[str] = Counter()
    dead_ends: list[tuple[str, str]] = []
    errors: list[str] = []
    paths_explored = 0
    step = 0

    while queue:
        step += 1
        if step % 5000 == 0:
            print(f"  step={step} queue={len(queue)} visited={len(visited)} paths={paths_explored}", file=sys.stderr)
        if len(visited) >= MAX_STATES:
            print(f"  达到状态上限 {MAX_STATES}", file=sys.stderr)
            break

        rt = queue.popleft()
        h = state_hash(rt)
        if h in visited:
            continue
        if event_hit[rt.current] >= MAX_PER_EVENT:
            continue
        visited.add(h)
        event_hit[rt.current] += 1

        event = events_map.get(rt.current)
        if event is None:
            dead_ends.append((format_path(rt.log), f"事件不存在: {rt.current}"))
            continue

        available = [c for c in event["choices"] if rt.check(c["availability"])]
        if not available:
            if rt.ending is None:
                dead_ends.append((format_path(rt.log), f"无可用选项且无结局: {rt.current}"))
            continue

        for choice in available:
            rt2 = rt.clone()
            choice_hit[choice["id"]] += 1
            try:
                rt2.choose(choice["id"])
                paths_explored += 1
            except (ValueError, AssertionError) as exc:
                errors.append(f"{format_path(rt.log)} → {choice['id'].rsplit('.',1)[-1]}: {exc}")
                continue
            if rt2.ending is not None:
                ending_hit[str(rt2.ending)] += 1
                continue
            queue.append(rt2)

    complete = len(visited) < MAX_STATES
    lines: list[str] = []
    lines.append("=" * 78)
    lines.append(f"状态空间遍历报告  ({"完整" if complete else f"采样上限 {MAX_STATES} / 每事件 {MAX_PER_EVENT}"})")
    lines.append("=" * 78)
    lines.append(f"探索路径数: {paths_explored}")
    lines.append(f"唯一状态数: {len(visited)}")
    lines.append(f"总选项数:   {len(all_choice_ids)}  已命中: {len(choice_hit)}")
    lines.append("")

    lines.append("── 事件访问 ──")
    for eid in sorted(event_hit):
        n_choices = len(events_map[eid]["choices"])
        lines.append(f"  {eid:55s}  状态 {event_hit[eid]:>6}  选项 {n_choices}")
    unreached = set(events_map) - set(event_hit)
    if unreached:
        lines.append(f"  未命中事件: {sorted(unreached)}")
    lines.append("")

    lines.append("── 结局分布 ──")
    for eid in sorted(ending_map, key=lambda x: ending_map[x]["priority"], reverse=True):
        title = bundle.get("texts", {}).get(ending_map[eid]["titleKey"], eid)
        lines.append(f"  {eid:50s}  {title:<16s}  到达 {ending_hit[eid]:>6}")
    unreached_ends = set(ending_map) - set(ending_hit)
    if unreached_ends:
        lines.append(f"  未到达结局: {sorted(unreached_ends)}")
    lines.append("")

    zero_hit = sorted(all_choice_ids - set(choice_hit))
    if zero_hit:
        lines.append(f"── 零命中选项: {len(zero_hit)} ──")
        for cid in zero_hit[:30]:
            lines.append(f"  {cid}")
        if len(zero_hit) > 30:
            lines.append(f"  ... 共 {len(zero_hit)} 个")
    else:
        lines.append("── 零命中选项: 无 ──")
    lines.append("")

    lines.append(f"── 死路: {len(dead_ends)} ──")
    for path, reason in dead_ends:
        lines.append(f"  {reason}")
        lines.append(f"    路径: {path}")
    lines.append("")

    lines.append(f"── 运行时错误: {len(errors)} ──")
    for err in errors[:20]:
        lines.append(f"  {err}")
    if len(errors) > 20:
        lines.append(f"  ... 共 {len(errors)} 个")
    lines.append("")

    lines.append("── 高频选项 (top 10) ──")
    for cid, n in choice_hit.most_common(10):
        lines.append(f"  {cid:55s}  {n:>6}")
    lines.append("")
    lines.append("=" * 78)
    total_issues = len(dead_ends) + len(errors) + len(unreached_ends)
    status = "通过" if total_issues == 0 else f"失败 ({total_issues} 项)"
    lines.append(f"死路: {len(dead_ends)}  错误: {len(errors)}  未达结局: {len(unreached_ends)}  →  {status}")
    print("\n".join(lines))
    return 1 if total_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())

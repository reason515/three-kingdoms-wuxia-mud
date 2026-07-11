"""Temporary deterministic paper-test harness for Du Jian's MVP routes.

This is not the production content engine. It makes the representative route
assumptions in docs/DU_JIAN_ROUTE.md executable before the YAML schema exists.
Run with: python tools/validate_du_jian_routes.py
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field


INJURY_NAMES = ["无伤", "轻伤", "重伤", "濒危", "死亡"]
HEAT_NAMES = ["平静", "起疑", "暴露", "缉拿"]
VALID_FREEDOM = {"自由", "落网", "收押", "脱逃", "被迫效力"}


@dataclass
class State:
    breath: int = 3
    time: int = 3
    favor: int = 1
    injury: int = 0
    heat: int = 1
    life: str = "生还"
    freedom: str = "自由"
    aluo_trust: int = 0
    zhao_attitude: int = 0
    guard_insight: int = 0
    roam_insight: int = 0
    flags: set[str] = field(default_factory=set)
    conduct: set[str] = field(default_factory=set)
    techniques: set[str] = field(default_factory=set)
    items: dict[str, str] = field(
        default_factory=lambda: {
            "short_sword": "equipped",
            "common_clothes": "equipped",
            "sword_seal": "carried",
            "du_medicine": "carried",
            "firestarter": "carried",
            "sealed_document": "carried",
        }
    )
    fates: dict[str, str] = field(
        default_factory=lambda: {
            "xu": "同行",
            "aluo": "未接触",
            "civilians": "未接触",
            "elder": "危重",
            "zhao": "生还",
        }
    )
    log: list[tuple[str, str, int, int, int, int, str]] = field(default_factory=list)

    def spend(self, resource: str, amount: int) -> None:
        value = getattr(self, resource)
        if value < amount:
            raise AssertionError(f"{resource}不足：需要{amount}，现有{value}")
        setattr(self, resource, value - amount)

    def harm(self, amount: int = 1, minimum: int | None = None) -> None:
        self.injury = min(4, self.injury + amount)
        if minimum is not None:
            self.injury = max(self.injury, minimum)
        if self.injury == 4:
            self.life = "死亡"

    def heat_at_least(self, value: int) -> None:
        self.heat = max(self.heat, value)

    def use_item(self, item: str, result: str = "used") -> None:
        if self.items.get(item) not in {"carried", "equipped"}:
            raise AssertionError(f"物品不可用：{item}={self.items.get(item)}")
        self.items[item] = result

    def confiscate_visible_items(self) -> None:
        for item in (
            "short_sword",
            "sword_seal",
            "manual",
            "original_leaf",
            "altered_copy",
            "burned_document",
            "sealed_document",
            "firestarter",
        ):
            if self.items.get(item) in {"carried", "equipped"}:
                self.items[item] = "confiscated"

    def lose_confiscated_items(self) -> None:
        for item, status in tuple(self.items.items()):
            if status == "confiscated":
                self.items[item] = "lost"

    def checkpoint(self, event: str, choice: str) -> None:
        self.validate(event)
        self.log.append(
            (
                event,
                choice,
                self.time,
                self.breath,
                self.injury,
                self.heat,
                self.freedom,
            )
        )

    def validate(self, event: str) -> None:
        assert 0 <= self.breath <= 4, (event, "内息越界", self.breath)
        assert 0 <= self.time <= 3, (event, "余时越界", self.time)
        assert 0 <= self.favor <= 2, (event, "人情越界", self.favor)
        assert 0 <= self.injury <= 4, (event, "伤势越界", self.injury)
        assert 0 <= self.heat <= 3, (event, "风声越界", self.heat)
        assert self.freedom in VALID_FREEDOM, (event, "自由状态非法", self.freedom)
        assert (self.injury == 4) == (self.life == "死亡"), (event, "生死与伤势冲突")
        assert not ({"guard_style", "roam_style"} <= self.flags), (event, "武学路线互斥冲突")
        assert not ({"manual_carried", "manual_entrusted"} <= self.flags), (event, "残谱去向冲突")
        if self.freedom in {"落网", "收押"}:
            assert self.time == 0, (event, "落网后余时未归零")


def ending_for(s: State) -> str:
    if s.freedom == "收押":
        return "囚剑长安"
    if "护弱" in s.conduct and (
        s.fates["aluo"] == "安全" or s.fates["civilians"] == "安全"
    ):
        return "负刃护人"
    if "evidence_saved" in s.flags:
        return "残剑留录"
    if "order_fulfilled" in s.flags:
        return "守诺成刃"
    return "城下无名"


def guard_route() -> State:
    s = State()
    s.zhao_attitude += 1
    s.checkpoint("D01", "接令")
    s.spend("breath", 1); s.guard_insight += 1
    s.checkpoint("D02", "横剑护许简")
    s.use_item("du_medicine"); s.flags.add("xu_safe")
    s.checkpoint("D03", "留下止血")
    s.items["original_leaf"] = "carried"; s.flags.add("xu_truth")
    s.checkpoint("D04A", "收下原始残页")
    s.spend("time", 1); s.flags.update({"aluo_with_player", "civilians_follow"})
    s.aluo_trust += 2; s.guard_insight += 1
    s.fates["aluo"] = s.fates["civilians"] = "同行"
    s.checkpoint("D05", "带所有伤者同行")
    s.guard_insight += 1; s.flags.add("stretcher_armor")
    s.items["aluo_medicine"] = "used"; s.fates["elder"] = "安全"
    s.flags.add("breathing_clue")
    s.checkpoint("D06", "札甲护担架；阿萝救老人")
    s.spend("time", 1); s.flags.update({"guard_style", "manual_carried"})
    s.techniques.add("guard_art"); s.items["manual"] = "carried"
    s.checkpoint("D07", "参悟守势")
    s.zhao_attitude = -2; s.heat_at_least(2)
    s.checkpoint("D08", "以残页质问")
    s.spend("breath", 1); s.harm(1); s.flags.add("escort_intact")
    s.checkpoint("D09", "横剑截流")
    s.time = 0; s.conduct.add("护弱")
    s.fates["aluo"] = s.fates["civilians"] = "安全"
    s.checkpoint("D10", "让阿萝与伤者先走")
    s.spend("breath", 1); s.harm(1, minimum=2); s.flags.add("zhao_opening")
    s.items["short_sword"] = "destroyed"
    s.checkpoint("D11", "守势拖敌后折剑止战")
    return s


def roam_route() -> State:
    s = State()
    s.flags.add("resealed_document_known")
    s.checkpoint("D01", "验看封泥")
    s.roam_insight += 1; s.flags.add("ren_trace"); s.fates["xu"] = "受伤"
    s.checkpoint("D02", "越箱追箭手")
    s.roam_insight += 1; s.items["altered_copy"] = "carried"
    s.checkpoint("D03", "追赶持卷者")
    s.spend("time", 1); s.flags.add("ren_trace")
    s.checkpoint("D04B", "救人并问箭路")
    s.aluo_trust += 1; s.roam_insight += 1; s.fates["aluo"] = "分路"
    s.fates["civilians"] = "留在院中"
    s.checkpoint("D05", "告知口令让阿萝自择")
    s.flags.add("armor_left"); s.items["du_medicine"] = "used"
    s.fates["elder"] = "安全"; s.aluo_trust += 1
    s.checkpoint("D06", "不取甲；自己的药给老人")
    s.spend("time", 1); s.flags.update({"roam_style", "manual_carried"})
    s.techniques.add("roam_art"); s.items["manual"] = "carried"
    s.checkpoint("D07", "参悟游剑")
    s.zhao_attitude = -2
    s.checkpoint("D08", "拔剑拒绝")
    s.heat_at_least(2); s.flags.add("escort_intact")
    s.fates["aluo"] = "同行"
    s.checkpoint("D09", "踏墙换位")
    s.use_item("sword_seal", "given"); s.fates["aluo"] = "安全"
    s.conduct.add("护弱")
    s.checkpoint("D10", "剑印交阿萝")
    s.spend("breath", 1); s.use_item("short_sword", "lost")
    s.checkpoint("D11", "踏墙开侧门后离开")
    return s


def duty_route() -> State:
    s = State()
    s.zhao_attitude += 1
    s.checkpoint("D01", "接令")
    s.heat_at_least(2)
    s.checkpoint("D02", "亮剑印喝问")
    s.use_item("du_medicine"); s.flags.add("xu_safe")
    s.checkpoint("D03", "留下止血")
    s.aluo_trust -= 1
    s.checkpoint("D04A", "不接残页")
    s.flags.add("aluo_with_player"); s.aluo_trust = -2; s.zhao_attitude = 2
    s.fates["aluo"] = "同行"
    s.checkpoint("D05", "强行带人")
    s.items["armor"] = "equipped"; s.items["common_clothes"] = "given"
    s.fates["elder"] = "死亡"; s.aluo_trust = -2
    s.checkpoint("D06", "穿甲；催促出发")
    s.flags.add("manual_abandoned")
    s.checkpoint("D07", "不停留")
    s.use_item("sealed_document", "given"); s.flags.add("order_fulfilled")
    s.fates["aluo"] = "被捕"
    s.checkpoint("D08", "交出阿萝和文书")
    return s


def captured_base() -> State:
    s = State()
    s.zhao_attitude += 1
    s.checkpoint("D01", "接令")
    s.spend("breath", 1); s.guard_insight += 1
    s.checkpoint("D02", "横剑护许简")
    s.use_item("du_medicine"); s.flags.add("xu_safe")
    s.checkpoint("D03", "留下止血")
    s.items["original_leaf"] = "carried"; s.flags.add("xu_truth")
    s.checkpoint("D04A", "收下原始残页")
    s.spend("time", 1); s.flags.update({"aluo_with_player", "civilians_follow"})
    s.aluo_trust = 2; s.guard_insight += 1
    s.fates["aluo"] = s.fates["civilians"] = "同行"
    s.checkpoint("D05", "带所有伤者同行")
    s.guard_insight += 1; s.flags.add("stretcher_armor")
    s.items["aluo_medicine"] = "used"; s.fates["elder"] = "安全"
    s.checkpoint("D06", "札甲护担架；阿萝救老人")
    s.spend("time", 1); s.flags.update({"guard_style", "manual_carried"})
    s.techniques.add("guard_art"); s.items["manual"] = "carried"
    s.checkpoint("D07", "参悟守势")
    s.flags.add("zhao_promise"); s.time = min(3, s.time + 1)
    s.checkpoint("D08", "承诺稍后交人")
    s.heat = 3; s.flags.add("escort_intact")
    s.checkpoint("D09", "以剑印喝止武吏")
    s.time = 0; s.freedom = "落网"; s.conduct.update({"护弱", "以自由换人"})
    s.fates["aluo"] = s.fates["civilians"] = "安全"
    s.confiscate_visible_items(); s.flags.discard("manual_carried")
    s.checkpoint("D10", "解剑归案换众人通行")
    return s


def prison_route() -> State:
    s = captured_base()
    s.freedom = "收押"; s.conduct.add("代人受过")
    s.checkpoint("D11C", "承认护送并揽责")
    return s


def escape_route() -> State:
    s = deepcopy(captured_base())
    assert s.items["firestarter"] == "confiscated"
    s.freedom = "脱逃"; s.lose_confiscated_items()
    s.checkpoint("D11C", "撞翻案桌取火折烧绳")
    return s


def boundary_tests() -> None:
    s = State(time=0)
    try:
        s.spend("time", 1)
    except AssertionError:
        pass
    else:
        raise AssertionError("余时为0时仍可支付参悟代价")

    s = State(injury=3)
    s.harm(1)
    s.checkpoint("BOUNDARY", "濒危后再受创")
    assert s.life == "死亡"

    s = State(heat=3, freedom="自由")
    s.checkpoint("BOUNDARY", "缉拿但未落网")
    assert s.freedom == "自由"

    s = State()
    s.flags.update({"guard_style", "roam_style"})
    try:
        s.checkpoint("BOUNDARY", "互斥路线")
    except AssertionError:
        pass
    else:
        raise AssertionError("守剑与游剑可同时成立")

    s = State()
    s.flags.update({"manual_carried", "manual_entrusted"})
    try:
        s.checkpoint("BOUNDARY", "残谱持有与托付互斥")
    except AssertionError:
        pass
    else:
        raise AssertionError("残谱可同时持有和托付")

    s = State(time=1, freedom="落网")
    try:
        s.checkpoint("BOUNDARY", "落网后仍有余时")
    except AssertionError:
        pass
    else:
        raise AssertionError("落网后余时未归零")

    s = State()
    s.items["short_sword"] = "confiscated"
    try:
        s.use_item("short_sword")
    except AssertionError:
        pass
    else:
        raise AssertionError("被没收短剑仍可使用")


def main() -> None:
    routes = {
        "守剑护人": guard_route(),
        "游剑留路": roam_route(),
        "守令": duty_route(),
        "收押": prison_route(),
        "脱逃": escape_route(),
    }
    boundary_tests()

    expected = {
        "守剑护人": "负刃护人",
        "游剑留路": "负刃护人",
        "守令": "守诺成刃",
        "收押": "囚剑长安",
        "脱逃": "负刃护人",
    }
    print("杜缄代表路线机制验证")
    print("=" * 72)
    for name, state in routes.items():
        ending = ending_for(state)
        assert ending == expected[name], (name, ending, expected[name])
        print(
            f"PASS  {name:<8} 结局={ending:<6} "
            f"余时={state.time} 内息={state.breath} "
            f"伤势={INJURY_NAMES[state.injury]} 风声={HEAT_NAMES[state.heat]} "
            f"自由={state.freedom} 节点={len(state.log)}"
        )
    print("PASS  边界状态  资源/死亡/缉拿/路线/残谱/落网/没收")
    print("=" * 72)
    print(f"全部通过：{len(routes)} 条代表路线 + 7 组自动边界检查")


if __name__ == "__main__":
    main()

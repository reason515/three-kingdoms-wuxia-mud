"""Validate authored content bundles without third-party dependencies.

JSON Schema validates the envelope when a supporting editor/library is present.
This script additionally validates operator operands, references and event graph
properties that ordinary JSON Schema cannot conveniently express.

Usage:
    python tools/validate_content.py
    python tools/validate_content.py content/examples/example.json
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict, deque
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
ID_RE = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$")
VERSION_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")

CONDITION_OPS = {
    "always",
    "all",
    "any",
    "not",
    "compare",
    "hasFlag",
    "hasConduct",
    "hasItem",
    "relationship",
    "techniqueKnown",
    "knows",
    "environmentHas",
    "characterFate",
}
EFFECT_OPS = {
    "spendResource",
    "changeResource",
    "setResource",
    "changeInjury",
    "setInjury",
    "setHeat",
    "setLife",
    "setFreedom",
    "addFlag",
    "removeFlag",
    "addConduct",
    "removeConduct",
    "changeRelationship",
    "setRelationship",
    "addRelationshipTag",
    "removeRelationshipTag",
    "setCharacterFate",
    "transferItem",
    "setItemState",
    "equipItem",
    "unequipItem",
    "consumeItem",
    "confiscateVisibleItems",
    "loseItemsByState",
    "learnTechnique",
    "addInsight",
    "addKnowledge",
    "scheduleEvent",
    "cancelEvent",
    "emitFeedback",
}
RESOURCE_NAMES = {"breath", "time", "favor"}
COMPARE_OPS = {"eq", "neq", "gte", "lte", "gt", "lt"}
COMPARE_PATH_RE = re.compile(
    r"^(abilities\.(martial|strategy|influence)|resources\.(breath|time|favor)|"
    r"injury|heat|life|freedom|insights\.[a-z0-9_-]+)$"
)
ITEM_SLOTS = {"weapon", "armor", "token", "consumable", "story", "none"}
EVENT_KINDS = {"scene", "choice", "combat", "growth", "capture", "ending"}
RISKS = {"none", "costly", "high", "lethal"}
LIFE_STATES = {"alive", "dead", "missing"}
FREEDOM_STATES = {"free", "captured", "imprisoned", "escaped", "coerced"}
CONFIDENCE_STATES = {"rumor", "sourced", "witnessed", "corroborated", "confirmed"}


class Validation:
    def __init__(self, path: Path, data: dict[str, Any]) -> None:
        self.path = path
        self.data = data
        self.errors: list[str] = []
        self.texts = data.get("texts", {})
        self.ids: dict[str, set[str]] = {}

    def error(self, where: str, message: str) -> None:
        self.errors.append(f"{where}: {message}")

    def require(self, obj: dict[str, Any], key: str, where: str, expected: type | tuple[type, ...]) -> Any:
        if key not in obj:
            self.error(where, f"缺少字段 {key}")
            return None
        value = obj[key]
        if not isinstance(value, expected):
            names = expected.__name__ if isinstance(expected, type) else "/".join(t.__name__ for t in expected)
            self.error(f"{where}.{key}", f"应为 {names}，实际为 {type(value).__name__}")
            return None
        return value

    def check_id(self, value: Any, where: str) -> None:
        if not isinstance(value, str) or not ID_RE.fullmatch(value):
            self.error(where, f"非法 ID：{value!r}")

    def check_text(self, key: Any, where: str) -> None:
        self.check_id(key, where)
        if isinstance(key, str) and key not in self.texts:
            self.error(where, f"文本 key 不存在：{key}")

    def collect_ids(self, collection: str) -> set[str]:
        values: set[str] = set()
        for index, obj in enumerate(self.data.get(collection, [])):
            where = f"{collection}[{index}]"
            if not isinstance(obj, dict):
                self.error(where, "必须是对象")
                continue
            object_id = obj.get("id")
            self.check_id(object_id, f"{where}.id")
            if isinstance(object_id, str):
                if object_id in values:
                    self.error(f"{where}.id", f"重复 ID：{object_id}")
                values.add(object_id)
        self.ids[collection] = values
        return values

    def reference(self, value: Any, collection: str, where: str) -> None:
        self.check_id(value, where)
        if isinstance(value, str) and value not in self.ids.get(collection, set()):
            self.error(where, f"引用不存在的 {collection}：{value}")

    def validate_root(self) -> None:
        required = {
            "schemaVersion",
            "contentVersion",
            "bundleId",
            "locale",
            "scenario",
            "initialState",
            "characters",
            "locations",
            "itemDefinitions",
            "itemInstances",
            "techniques",
            "claims",
            "events",
            "endings",
            "invariants",
            "texts",
        }
        allowed = required | {"$schema"}
        for key in sorted(required - self.data.keys()):
            self.error("root", f"缺少字段 {key}")
        for key in sorted(self.data.keys() - allowed):
            self.error("root", f"未知字段 {key}")
        for key in ("schemaVersion", "contentVersion"):
            value = self.data.get(key)
            if not isinstance(value, str) or not VERSION_RE.fullmatch(value):
                self.error(key, f"版本号必须为 x.y.z，实际为 {value!r}")
        self.check_id(self.data.get("bundleId"), "bundleId")
        if not isinstance(self.texts, dict) or any(not isinstance(v, str) for v in self.texts.values()):
            self.error("texts", "必须是字符串到字符串的对象")
            self.texts = {}
        for collection in (
            "characters",
            "locations",
            "itemDefinitions",
            "itemInstances",
            "techniques",
            "claims",
            "events",
            "endings",
        ):
            if not isinstance(self.data.get(collection), list):
                self.error(collection, "必须是数组")
                self.data[collection] = []
            self.collect_ids(collection)

        global_ids: dict[str, str] = {}
        for collection, values in self.ids.items():
            for value in values:
                previous = global_ids.get(value)
                if previous:
                    self.error(collection, f"ID {value} 已在 {previous} 中使用")
                global_ids[value] = collection

    def validate_scenario(self) -> None:
        scenario = self.data.get("scenario")
        if not isinstance(scenario, dict):
            self.error("scenario", "必须是对象")
            return
        self.check_id(scenario.get("id"), "scenario.id")
        self.check_text(scenario.get("titleKey"), "scenario.titleKey")
        self.reference(scenario.get("entryEventId"), "events", "scenario.entryEventId")
        stages = scenario.get("stages")
        if not isinstance(stages, list) or not stages:
            self.error("scenario.stages", "必须是非空数组")
            stages = []
        if len(stages) != len(set(stages)):
            self.error("scenario.stages", "阶段 ID 不得重复")
        for index, stage in enumerate(stages):
            self.check_id(stage, f"scenario.stages[{index}]")
        anchors = scenario.get("historicalAnchors")
        if not isinstance(anchors, list):
            self.error("scenario.historicalAnchors", "必须是数组")
            return
        seen: set[str] = set()
        for index, anchor in enumerate(anchors):
            where = f"scenario.historicalAnchors[{index}]"
            if not isinstance(anchor, dict):
                self.error(where, "必须是对象")
                continue
            anchor_id = anchor.get("id")
            self.check_id(anchor_id, f"{where}.id")
            if anchor_id in seen:
                self.error(f"{where}.id", f"重复锚点：{anchor_id}")
            seen.add(anchor_id)
            if anchor.get("stage") not in stages:
                self.error(f"{where}.stage", f"未知阶段：{anchor.get('stage')}")
            if anchor.get("immutable") is not True:
                self.error(f"{where}.immutable", "历史锚点必须不可变")

    def validate_initial_state(self) -> None:
        state = self.data.get("initialState")
        if not isinstance(state, dict):
            self.error("initialState", "必须是对象")
            return
        self.reference(state.get("playerCharacterId"), "characters", "initialState.playerCharacterId")
        abilities = state.get("abilities", {})
        for name in ("martial", "strategy", "influence"):
            value = abilities.get(name) if isinstance(abilities, dict) else None
            if not isinstance(value, int) or not 0 <= value <= 3:
                self.error(f"initialState.abilities.{name}", "必须是 0～3 的整数")
        resources = state.get("resources", {})
        limits = {"breath": (0, 4), "time": (0, 3), "favor": (0, 2)}
        for name, (low, high) in limits.items():
            value = resources.get(name) if isinstance(resources, dict) else None
            if not isinstance(value, int) or not low <= value <= high:
                self.error(f"initialState.resources.{name}", f"必须是 {low}～{high} 的整数")
        if state.get("injury") not in range(5):
            self.error("initialState.injury", "必须是 0～4")
        if state.get("heat") not in range(4):
            self.error("initialState.heat", "必须是 0～3")
        if state.get("life") not in LIFE_STATES:
            self.error("initialState.life", "非法生死状态")
        if state.get("freedom") not in FREEDOM_STATES:
            self.error("initialState.freedom", "非法自由状态")
        for key in ("conduct", "flags", "knowledge"):
            values = state.get(key)
            if not isinstance(values, list):
                self.error(f"initialState.{key}", "必须是数组")
                continue
            for index, value in enumerate(values):
                self.check_id(value, f"initialState.{key}[{index}]")
        relationships = state.get("relationships")
        if not isinstance(relationships, list):
            self.error("initialState.relationships", "必须是数组")
            return
        seen: set[str] = set()
        for index, relationship in enumerate(relationships):
            where = f"initialState.relationships[{index}]"
            if not isinstance(relationship, dict):
                self.error(where, "必须是对象")
                continue
            character_id = relationship.get("characterId")
            self.reference(character_id, "characters", f"{where}.characterId")
            if character_id in seen:
                self.error(where, f"人物关系重复：{character_id}")
            seen.add(character_id)
            attitude = relationship.get("attitude")
            if not isinstance(attitude, int) or not -2 <= attitude <= 2:
                self.error(f"{where}.attitude", "必须是 -2～2 的整数")
            for tag_index, tag in enumerate(relationship.get("tags", [])):
                self.check_id(tag, f"{where}.tags[{tag_index}]")

    def validate_registries(self) -> None:
        for index, character in enumerate(self.data["characters"]):
            where = f"characters[{index}]"
            self.check_text(character.get("nameKey"), f"{where}.nameKey")
            for field in ("factionIds", "tags"):
                values = character.get(field)
                if not isinstance(values, list):
                    self.error(f"{where}.{field}", "必须是数组")
                    continue
                for value_index, value in enumerate(values):
                    self.check_id(value, f"{where}.{field}[{value_index}]")
            self.check_id(character.get("defaultFate"), f"{where}.defaultFate")

        for index, location in enumerate(self.data["locations"]):
            where = f"locations[{index}]"
            self.check_text(location.get("nameKey"), f"{where}.nameKey")
            for tag_index, tag in enumerate(location.get("tags", [])):
                self.check_id(tag, f"{where}.tags[{tag_index}]")

        definitions = {obj["id"]: obj for obj in self.data["itemDefinitions"] if isinstance(obj, dict) and "id" in obj}
        for index, definition in enumerate(self.data["itemDefinitions"]):
            where = f"itemDefinitions[{index}]"
            self.check_text(definition.get("nameKey"), f"{where}.nameKey")
            if definition.get("slot") not in ITEM_SLOTS:
                self.error(f"{where}.slot", f"非法槽位：{definition.get('slot')}")
            states = definition.get("allowedStates")
            if not isinstance(states, list) or not states:
                self.error(f"{where}.allowedStates", "必须是非空数组")
            else:
                for state_index, state in enumerate(states):
                    self.check_id(state, f"{where}.allowedStates[{state_index}]")

        equipped_slots: dict[tuple[str, str], str] = {}
        valid_holders = self.ids["characters"] | self.ids["locations"]
        for index, instance in enumerate(self.data["itemInstances"]):
            where = f"itemInstances[{index}]"
            definition_id = instance.get("definitionId")
            self.reference(definition_id, "itemDefinitions", f"{where}.definitionId")
            holder_id = instance.get("holderId")
            self.check_id(holder_id, f"{where}.holderId")
            if holder_id not in valid_holders:
                self.error(f"{where}.holderId", f"持有者既非人物也非地点：{holder_id}")
            definition = definitions.get(definition_id, {})
            if instance.get("state") not in definition.get("allowedStates", []):
                self.error(f"{where}.state", f"状态不在物品定义允许范围：{instance.get('state')}")
            quantity = instance.get("quantity")
            if not isinstance(quantity, int) or quantity < 0:
                self.error(f"{where}.quantity", "必须是非负整数")
            if instance.get("equipped") is True:
                slot = definition.get("slot")
                if slot not in {"weapon", "armor", "token"}:
                    self.error(f"{where}.equipped", f"{slot} 槽物品不能装备")
                key = (holder_id, slot)
                if key in equipped_slots:
                    self.error(where, f"槽位冲突：{holder_id} 的 {slot} 已装备 {equipped_slots[key]}")
                equipped_slots[key] = instance.get("id", where)

        exclusive_groups: dict[str, list[str]] = defaultdict(list)
        for index, technique in enumerate(self.data["techniques"]):
            where = f"techniques[{index}]"
            self.check_text(technique.get("nameKey"), f"{where}.nameKey")
            self.check_id(technique.get("route"), f"{where}.route")
            tier = technique.get("tier")
            if not isinstance(tier, int) or not 0 <= tier <= 3:
                self.error(f"{where}.tier", "必须是 0～3 的整数")
            group = technique.get("exclusiveGroup")
            if group is not None:
                self.check_id(group, f"{where}.exclusiveGroup")
                exclusive_groups[group].append(technique.get("id", where))

        for index, claim in enumerate(self.data["claims"]):
            where = f"claims[{index}]"
            subject_id = claim.get("subjectId")
            valid_subjects = self.ids["characters"] | self.ids["itemDefinitions"]
            self.check_id(subject_id, f"{where}.subjectId")
            if subject_id not in valid_subjects:
                self.error(f"{where}.subjectId", f"未知说法主体：{subject_id}")
            self.check_text(claim.get("statementKey"), f"{where}.statementKey")
            if claim.get("defaultConfidence") not in CONFIDENCE_STATES:
                self.error(f"{where}.defaultConfidence", "非法可信度")
            for ref_index, ref in enumerate(claim.get("contradicts", [])):
                self.reference(ref, "claims", f"{where}.contradicts[{ref_index}]")

    def validate_condition(self, condition: Any, where: str) -> None:
        if not isinstance(condition, dict):
            self.error(where, "条件必须是对象")
            return
        op = condition.get("op")
        if op not in CONDITION_OPS:
            self.error(f"{where}.op", f"未知条件操作符：{op}")
            return
        if op in {"all", "any"}:
            conditions = condition.get("conditions")
            if not isinstance(conditions, list) or not conditions:
                self.error(f"{where}.conditions", "必须是非空数组")
                return
            for index, nested in enumerate(conditions):
                self.validate_condition(nested, f"{where}.conditions[{index}]")
        elif op == "not":
            self.validate_condition(condition.get("condition"), f"{where}.condition")
        elif op == "compare":
            path = condition.get("path")
            if not isinstance(path, str) or not COMPARE_PATH_RE.fullmatch(path):
                self.error(f"{where}.path", f"状态路径不在白名单：{path}")
            if condition.get("cmp") not in COMPARE_OPS:
                self.error(f"{where}.cmp", f"非法比较符：{condition.get('cmp')}")
            if "value" not in condition:
                self.error(where, "compare 缺少 value")
        elif op in {"hasFlag", "hasConduct"}:
            key = "flag" if op == "hasFlag" else "conduct"
            self.check_id(condition.get(key), f"{where}.{key}")
        elif op == "hasItem":
            instance_id = condition.get("itemInstanceId")
            self.reference(instance_id, "itemInstances", f"{where}.itemInstanceId")
            states = condition.get("states")
            if not isinstance(states, list) or not states:
                self.error(f"{where}.states", "必须是非空数组")
            else:
                instances = {obj.get("id"): obj for obj in self.data["itemInstances"] if isinstance(obj, dict)}
                definitions = {obj.get("id"): obj for obj in self.data["itemDefinitions"] if isinstance(obj, dict)}
                instance = instances.get(instance_id, {})
                allowed_states = definitions.get(instance.get("definitionId"), {}).get("allowedStates", [])
                for state_index, state in enumerate(states):
                    self.check_id(state, f"{where}.states[{state_index}]")
                    if allowed_states and state not in allowed_states:
                        self.error(f"{where}.states[{state_index}]", f"状态不适用于该物品：{state}")
            if "holderId" in condition:
                holder = condition.get("holderId")
                self.check_id(holder, f"{where}.holderId")
                if holder not in self.ids["characters"] | self.ids["locations"]:
                    self.error(f"{where}.holderId", f"未知持有者：{holder}")
            if "equipped" in condition and not isinstance(condition.get("equipped"), bool):
                self.error(f"{where}.equipped", "必须是布尔值")
        elif op == "relationship":
            self.reference(condition.get("characterId"), "characters", f"{where}.characterId")
            attitude = condition.get("attitude")
            has_attitude = isinstance(attitude, dict)
            has_tag = isinstance(condition.get("tag"), str)
            if not (has_attitude or has_tag):
                self.error(where, "relationship 至少需要 attitude 或 tag")
            if has_attitude:
                if len(attitude) != 1 or next(iter(attitude), None) not in COMPARE_OPS:
                    self.error(f"{where}.attitude", "必须包含一个合法比较符")
                elif not isinstance(next(iter(attitude.values())), int):
                    self.error(f"{where}.attitude", "态度阈值必须是整数")
            if has_tag:
                self.check_id(condition.get("tag"), f"{where}.tag")
        elif op == "techniqueKnown":
            self.reference(condition.get("techniqueId"), "techniques", f"{where}.techniqueId")
        elif op == "knows":
            self.reference(condition.get("claimId"), "claims", f"{where}.claimId")
        elif op == "environmentHas":
            self.check_id(condition.get("tag"), f"{where}.tag")
        elif op == "characterFate":
            self.reference(condition.get("characterId"), "characters", f"{where}.characterId")
            self.check_id(condition.get("fate"), f"{where}.fate")

    def validate_effect(self, effect: Any, where: str) -> None:
        if not isinstance(effect, dict):
            self.error(where, "效果必须是对象")
            return
        op = effect.get("op")
        if op not in EFFECT_OPS:
            self.error(f"{where}.op", f"未知效果操作符：{op}")
            return
        if op in {"spendResource", "changeResource", "setResource"}:
            if effect.get("resource") not in RESOURCE_NAMES:
                self.error(f"{where}.resource", f"非法资源：{effect.get('resource')}")
            field = "amount" if op == "spendResource" else ("delta" if op == "changeResource" else "value")
            value = effect.get(field)
            if not isinstance(value, int):
                self.error(f"{where}.{field}", "必须是整数")
            if op == "spendResource" and isinstance(value, int) and value <= 0:
                self.error(f"{where}.amount", "支付量必须大于 0")
            for clamp in ("min", "max"):
                if clamp in effect and not isinstance(effect.get(clamp), int):
                    self.error(f"{where}.{clamp}", "必须是整数")
        elif op in {"changeInjury", "setInjury", "setHeat"}:
            field = "delta" if op == "changeInjury" else "value"
            if not isinstance(effect.get(field), int):
                self.error(f"{where}.{field}", "必须是整数")
            for clamp in ("minimum", "maximum"):
                if clamp in effect and not isinstance(effect.get(clamp), int):
                    self.error(f"{where}.{clamp}", "必须是整数")
        elif op == "setLife" and effect.get("value") not in LIFE_STATES:
            self.error(f"{where}.value", "非法生死状态")
        elif op == "setFreedom" and effect.get("value") not in FREEDOM_STATES:
            self.error(f"{where}.value", "非法自由状态")
        elif op in {"addFlag", "removeFlag", "addConduct", "removeConduct"}:
            key = "flag" if op.endswith("Flag") else "conduct"
            self.check_id(effect.get(key), f"{where}.{key}")
        elif op in {"changeRelationship", "setRelationship", "addRelationshipTag", "removeRelationshipTag", "setCharacterFate"}:
            self.reference(effect.get("characterId"), "characters", f"{where}.characterId")
            if op == "changeRelationship" and not isinstance(effect.get("delta"), int):
                self.error(f"{where}.delta", "必须是整数")
            if op == "setRelationship" and (not isinstance(effect.get("value"), int) or not -2 <= effect.get("value", 99) <= 2):
                self.error(f"{where}.value", "必须是 -2～2 的整数")
            if op in {"addRelationshipTag", "removeRelationshipTag"}:
                self.check_id(effect.get("tag"), f"{where}.tag")
            if op == "setCharacterFate":
                self.check_id(effect.get("fate"), f"{where}.fate")
        elif op in {"transferItem", "setItemState", "equipItem", "unequipItem", "consumeItem"}:
            self.reference(effect.get("itemInstanceId"), "itemInstances", f"{where}.itemInstanceId")
            if op == "transferItem":
                holder = effect.get("holderId")
                self.check_id(holder, f"{where}.holderId")
                if holder not in self.ids["characters"] | self.ids["locations"]:
                    self.error(f"{where}.holderId", f"未知持有者：{holder}")
            if op == "setItemState":
                state = effect.get("state")
                self.check_id(state, f"{where}.state")
                instances = {obj.get("id"): obj for obj in self.data["itemInstances"] if isinstance(obj, dict)}
                definitions = {obj.get("id"): obj for obj in self.data["itemDefinitions"] if isinstance(obj, dict)}
                instance = instances.get(effect.get("itemInstanceId"), {})
                allowed_states = definitions.get(instance.get("definitionId"), {}).get("allowedStates", [])
                if allowed_states and state not in allowed_states:
                    self.error(f"{where}.state", f"状态不适用于该物品：{state}")
            if op == "consumeItem" and (not isinstance(effect.get("amount"), int) or effect.get("amount", 0) <= 0):
                self.error(f"{where}.amount", "消耗量必须是正整数")
        elif op == "confiscateVisibleItems":
            self.reference(effect.get("holderId"), "characters", f"{where}.holderId")
        elif op == "loseItemsByState":
            self.check_id(effect.get("state"), f"{where}.state")
        elif op == "learnTechnique":
            self.reference(effect.get("techniqueId"), "techniques", f"{where}.techniqueId")
        elif op == "addInsight":
            self.check_id(effect.get("route"), f"{where}.route")
            if not isinstance(effect.get("amount"), int) or effect.get("amount", 0) <= 0:
                self.error(f"{where}.amount", "领悟增量必须是正整数")
        elif op == "addKnowledge":
            self.reference(effect.get("claimId"), "claims", f"{where}.claimId")
            source = effect.get("sourceId")
            if source not in self.ids["characters"] | self.ids["itemInstances"]:
                self.error(f"{where}.sourceId", f"未知知识来源：{source}")
            if effect.get("confidence") not in CONFIDENCE_STATES:
                self.error(f"{where}.confidence", "非法可信度")
        elif op in {"scheduleEvent", "cancelEvent"}:
            self.reference(effect.get("eventId"), "events", f"{where}.eventId")
        elif op == "emitFeedback":
            self.check_text(effect.get("textKey"), f"{where}.textKey")

    def validate_next(self, next_value: Any, where: str, graph: dict[str, set[str]], event_id: str) -> bool:
        if not isinstance(next_value, dict):
            self.error(where, "next 必须是对象")
            return False
        next_type = next_value.get("type")
        if next_type == "event":
            target = next_value.get("eventId")
            self.reference(target, "events", f"{where}.eventId")
            if isinstance(target, str):
                graph[event_id].add(target)
            return False
        if next_type in {"resolveEnding", "end"}:
            return True
        self.error(f"{where}.type", f"非法跳转类型：{next_type}")
        return False

    def validate_events_and_endings(self) -> None:
        stages = set(self.data.get("scenario", {}).get("stages", []))
        graph: dict[str, set[str]] = defaultdict(set)
        terminal_events: set[str] = set()
        choice_ids: set[str] = set()

        for index, event in enumerate(self.data["events"]):
            where = f"events[{index}]"
            event_id = event.get("id", where)
            if event.get("kind") not in EVENT_KINDS:
                self.error(f"{where}.kind", f"非法事件类型：{event.get('kind')}")
            if event.get("stage") not in stages:
                self.error(f"{where}.stage", f"未知阶段：{event.get('stage')}")
            self.reference(event.get("locationId"), "locations", f"{where}.locationId")
            self.check_text(event.get("textKey"), f"{where}.textKey")
            for variant_index, variant in enumerate(event.get("textVariants", [])):
                variant_where = f"{where}.textVariants[{variant_index}]"
                self.validate_condition(variant.get("when"), f"{variant_where}.when")
                self.check_text(variant.get("textKey"), f"{variant_where}.textKey")
            for actor_index, actor in enumerate(event.get("actorIds", [])):
                self.reference(actor, "characters", f"{where}.actorIds[{actor_index}]")
            choices = event.get("choices")
            if not isinstance(choices, list) or not 1 <= len(choices) <= 6:
                self.error(f"{where}.choices", "必须包含 1～6 个选项")
                continue
            for choice_index, choice in enumerate(choices):
                choice_where = f"{where}.choices[{choice_index}]"
                if not isinstance(choice, dict):
                    self.error(choice_where, "必须是对象")
                    continue
                choice_id = choice.get("id")
                self.check_id(choice_id, f"{choice_where}.id")
                if choice_id in choice_ids:
                    self.error(f"{choice_where}.id", f"重复选项 ID：{choice_id}")
                choice_ids.add(choice_id)
                self.check_text(choice.get("labelKey"), f"{choice_where}.labelKey")
                self.check_text(choice.get("intentKey"), f"{choice_where}.intentKey")
                if "lockedReasonKey" in choice:
                    self.check_text(choice["lockedReasonKey"], f"{choice_where}.lockedReasonKey")
                if choice.get("risk") not in RISKS:
                    self.error(f"{choice_where}.risk", f"非法风险：{choice.get('risk')}")
                self.validate_condition(choice.get("availability"), f"{choice_where}.availability")
                costs = choice.get("costs")
                if not isinstance(costs, list):
                    self.error(f"{choice_where}.costs", "必须是数组")
                else:
                    for cost_index, cost in enumerate(costs):
                        self.validate_effect(cost, f"{choice_where}.costs[{cost_index}]")
                        if isinstance(cost, dict) and cost.get("op") not in {"spendResource", "consumeItem"}:
                            self.error(f"{choice_where}.costs[{cost_index}]", "costs 只能包含显式支付操作")
                resolutions = choice.get("resolutions")
                if not isinstance(resolutions, list) or not resolutions:
                    self.error(f"{choice_where}.resolutions", "必须是非空数组")
                    continue
                defaults = [i for i, resolution in enumerate(resolutions) if isinstance(resolution, dict) and resolution.get("default") is True]
                if defaults != [len(resolutions) - 1]:
                    self.error(f"{choice_where}.resolutions", "必须且只能在最后提供一个 default: true")
                for resolution_index, resolution in enumerate(resolutions):
                    resolution_where = f"{choice_where}.resolutions[{resolution_index}]"
                    if not isinstance(resolution, dict):
                        self.error(resolution_where, "必须是对象")
                        continue
                    if "when" in resolution:
                        self.validate_condition(resolution["when"], f"{resolution_where}.when")
                    if "resultTextKey" in resolution:
                        self.check_text(resolution["resultTextKey"], f"{resolution_where}.resultTextKey")
                    effects = resolution.get("effects")
                    if not isinstance(effects, list):
                        self.error(f"{resolution_where}.effects", "必须是数组")
                    else:
                        for effect_index, effect in enumerate(effects):
                            self.validate_effect(effect, f"{resolution_where}.effects[{effect_index}]")
                    if self.validate_next(resolution.get("next"), f"{resolution_where}.next", graph, event_id):
                        terminal_events.add(event_id)

        priorities: dict[int, str] = {}
        for index, ending in enumerate(self.data["endings"]):
            where = f"endings[{index}]"
            self.check_id(ending.get("family"), f"{where}.family")
            priority = ending.get("priority")
            if not isinstance(priority, int):
                self.error(f"{where}.priority", "必须是整数")
            elif priority in priorities:
                self.error(f"{where}.priority", f"与 {priorities[priority]} 重复；优先级必须唯一")
            else:
                priorities[priority] = ending.get("id", where)
            self.check_text(ending.get("titleKey"), f"{where}.titleKey")
            self.check_text(ending.get("summaryKey"), f"{where}.summaryKey")
            for variant_index, variant in enumerate(ending.get("summaryVariants", [])):
                variant_where = f"{where}.summaryVariants[{variant_index}]"
                self.validate_condition(variant.get("when"), f"{variant_where}.when")
                self.check_text(variant.get("textKey"), f"{variant_where}.textKey")
            self.validate_condition(ending.get("when"), f"{where}.when")
            if ending.get("excludeWhen") is not None:
                self.validate_condition(ending["excludeWhen"], f"{where}.excludeWhen")
            costs = ending.get("requiredCosts")
            if not isinstance(costs, list):
                self.error(f"{where}.requiredCosts", "必须是数组")
            else:
                for cost_index, cost in enumerate(costs):
                    self.check_id(cost, f"{where}.requiredCosts[{cost_index}]")

        entry = self.data.get("scenario", {}).get("entryEventId")
        reachable: set[str] = set()
        if entry in self.ids["events"]:
            queue = deque([entry])
            while queue:
                event_id = queue.popleft()
                if event_id in reachable:
                    continue
                reachable.add(event_id)
                queue.extend(graph[event_id] - reachable)
        unreachable = self.ids["events"] - reachable
        for event_id in sorted(unreachable):
            self.error("events", f"入口不可达事件：{event_id}")

        can_finish = set(terminal_events)
        changed = True
        while changed:
            changed = False
            for source, targets in graph.items():
                if source not in can_finish and any(target in can_finish for target in targets):
                    can_finish.add(source)
                    changed = True
        for event_id in sorted(reachable - can_finish):
            self.error("events", f"不存在通往结局检查或结束的路径：{event_id}")

    def validate_invariants(self) -> None:
        invariants = self.data.get("invariants")
        if not isinstance(invariants, dict):
            self.error("invariants", "必须是对象")
            return
        groups = invariants.get("mutuallyExclusiveFlags")
        if not isinstance(groups, list):
            self.error("invariants.mutuallyExclusiveFlags", "必须是数组")
        else:
            for group_index, group in enumerate(groups):
                where = f"invariants.mutuallyExclusiveFlags[{group_index}]"
                if not isinstance(group, list) or len(group) < 2:
                    self.error(where, "每组至少包含两个标记")
                    continue
                for flag_index, flag in enumerate(group):
                    self.check_id(flag, f"{where}[{flag_index}]")
        depth = invariants.get("maxCaptureContinuationDepth")
        if depth not in {0, 1}:
            self.error("invariants.maxCaptureContinuationDepth", "MVP 只能是 0 或 1")

    def run(self) -> list[str]:
        self.validate_root()
        self.validate_scenario()
        self.validate_initial_state()
        self.validate_registries()
        self.validate_events_and_endings()
        self.validate_invariants()
        return self.errors


def load_json(path: Path) -> dict[str, Any] | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"FAIL {path}: {exc}")
        return None
    if not isinstance(data, dict):
        print(f"FAIL {path}: 根节点必须是对象")
        return None
    return data


def discover_paths(arguments: Iterable[str]) -> list[Path]:
    args = list(arguments)
    if args:
        return [Path(arg).resolve() for arg in args]
    return sorted((ROOT / "content").glob("**/*.json"))


def main() -> int:
    paths = discover_paths(sys.argv[1:])
    if not paths:
        print("FAIL 未找到 content/**/*.json")
        return 1
    failed = 0
    for path in paths:
        data = load_json(path)
        if data is None:
            failed += 1
            continue
        errors = Validation(path, data).run()
        if errors:
            failed += 1
            print(f"FAIL {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")
            for error in errors:
                print(f"  - {error}")
        else:
            event_count = len(data.get("events", []))
            choice_count = sum(len(event.get("choices", [])) for event in data.get("events", []))
            print(
                f"PASS {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path} "
                f"({event_count} events, {choice_count} choices)"
            )
    if failed:
        print(f"校验失败：{failed}/{len(paths)} 个内容包")
        return 1
    print(f"全部通过：{len(paths)} 个内容包")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

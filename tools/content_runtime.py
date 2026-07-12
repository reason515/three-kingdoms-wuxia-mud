"""Minimal deterministic content interpreter used by validation tools.

It implements the v0.1 condition/effect subset, not presentation, saves or UI.
"""
from __future__ import annotations
from copy import deepcopy
from typing import Any


class ContentRuntime:
    def __init__(self, bundle: dict[str, Any]) -> None:
        self.bundle = bundle
        self.events = {x["id"]: x for x in bundle["events"]}
        self.endings = sorted(bundle["endings"], key=lambda x: -x["priority"])
        self.definitions = {x["id"]: x for x in bundle["itemDefinitions"]}
        initial = bundle["initialState"]
        self.state: dict[str, Any] = {
            "abilities": deepcopy(initial["abilities"]),
            "resources": deepcopy(initial["resources"]),
            "injury": initial["injury"], "heat": initial["heat"],
            "life": initial["life"], "freedom": initial["freedom"],
            "flags": set(initial["flags"]), "conduct": set(initial["conduct"]),
            "knowledge": set(initial["knowledge"]), "insights": deepcopy(initial["insights"]),
            "relationships": {x["characterId"]: {"attitude": x["attitude"], "tags": set(x["tags"])} for x in initial["relationships"]},
            "fates": {x["id"]: x["defaultFate"] for x in bundle["characters"]},
            "items": {x["id"]: deepcopy(x) for x in bundle["itemInstances"]},
            "techniques": set(), "scheduled": set(),
        }
        self.player = initial["playerCharacterId"]
        self.current = bundle["scenario"]["entryEventId"]
        self.ending: str | None = None
        self.last_result_text_key: str | None = None
        self.log: list[str] = []

    def get_path(self, path: str) -> Any:
        value: Any = self.state
        for part in path.split("."):
            value = value[part]
        return value

    @staticmethod
    def compare(left: Any, op: str, right: Any) -> bool:
        return {"eq": left == right, "neq": left != right, "gte": left >= right,
                "lte": left <= right, "gt": left > right, "lt": left < right}[op]

    def check(self, c: dict[str, Any]) -> bool:
        op = c["op"]
        if op == "always": return True
        if op == "all": return all(self.check(x) for x in c["conditions"])
        if op == "any": return any(self.check(x) for x in c["conditions"])
        if op == "not": return not self.check(c["condition"])
        if op == "compare": return self.compare(self.get_path(c["path"]), c["cmp"], c["value"])
        if op == "hasFlag": return c["flag"] in self.state["flags"]
        if op == "hasConduct": return c["conduct"] in self.state["conduct"]
        if op == "hasItem":
            item = self.state["items"][c["itemInstanceId"]]
            return (item["quantity"] > 0 and ("states" not in c or item["state"] in c["states"])
                    and ("holderId" not in c or item["holderId"] == c["holderId"])
                    and ("equipped" not in c or item["equipped"] == c["equipped"]))
        if op == "relationship":
            rel = self.state["relationships"].setdefault(c["characterId"], {"attitude": 0, "tags": set()})
            attitude_ok = True
            if "attitude" in c:
                cmp_op, value = next(iter(c["attitude"].items()))
                attitude_ok = self.compare(rel["attitude"], cmp_op, value)
            return attitude_ok and ("tag" not in c or c["tag"] in rel["tags"])
        if op == "techniqueKnown": return c["techniqueId"] in self.state["techniques"]
        if op == "knows": return c["claimId"] in self.state["knowledge"]
        if op == "environmentHas": return c["tag"] in self.events[self.current]["environmentTags"]
        if op == "characterFate": return self.state["fates"][c["characterId"]] == c["fate"]
        raise ValueError(f"unsupported condition {op}")

    def effect(self, e: dict[str, Any]) -> None:
        op = e["op"]
        if op in {"spendResource", "changeResource", "setResource"}:
            name = e["resource"]
            if op == "spendResource":
                if self.state["resources"][name] < e["amount"]: raise ValueError(f"insufficient {name}")
                self.state["resources"][name] -= e["amount"]
            elif op == "changeResource": self.state["resources"][name] += e["delta"]
            else: self.state["resources"][name] = e["value"]
            if "min" in e: self.state["resources"][name] = max(e["min"], self.state["resources"][name])
            if "max" in e: self.state["resources"][name] = min(e["max"], self.state["resources"][name])
        elif op == "changeInjury":
            self.state["injury"] += e["delta"]
            self.state["injury"] = max(e.get("minimum", 0), min(e.get("maximum", 4), self.state["injury"]))
        elif op == "setInjury": self.state["injury"] = e["value"]
        elif op == "setHeat": self.state["heat"] = e["value"]
        elif op == "setLife": self.state["life"] = e["value"]
        elif op == "setFreedom": self.state["freedom"] = e["value"]
        elif op in {"addFlag", "removeFlag"}:
            getattr(self.state["flags"], "add" if op == "addFlag" else "discard")(e["flag"])
        elif op in {"addConduct", "removeConduct"}:
            getattr(self.state["conduct"], "add" if op == "addConduct" else "discard")(e["conduct"])
        elif op in {"changeRelationship", "setRelationship"}:
            rel = self.state["relationships"].setdefault(e["characterId"], {"attitude": 0, "tags": set()})
            rel["attitude"] = e["value"] if op == "setRelationship" else rel["attitude"] + e["delta"]
            rel["attitude"] = max(e.get("min", -2), min(e.get("max", 2), rel["attitude"]))
        elif op in {"addRelationshipTag", "removeRelationshipTag"}:
            tags = self.state["relationships"].setdefault(e["characterId"], {"attitude": 0, "tags": set()})["tags"]
            getattr(tags, "add" if op == "addRelationshipTag" else "discard")(e["tag"])
        elif op == "setCharacterFate": self.state["fates"][e["characterId"]] = e["fate"]
        elif op == "transferItem": self.state["items"][e["itemInstanceId"]]["holderId"] = e["holderId"]
        elif op == "setItemState": self.state["items"][e["itemInstanceId"]]["state"] = e["state"]
        elif op == "equipItem": self.state["items"][e["itemInstanceId"]]["equipped"] = True
        elif op == "unequipItem": self.state["items"][e["itemInstanceId"]]["equipped"] = False
        elif op == "consumeItem": self.state["items"][e["itemInstanceId"]]["quantity"] -= e["amount"]
        elif op == "confiscateVisibleItems":
            for item in self.state["items"].values():
                definition = self.definitions[item["definitionId"]]
                if item["holderId"] == self.player and "item.visible" in definition["tags"] and item["state"] not in {"state.lost", "state.destroyed", "state.used"}:
                    item.update(holderId=e["holderId"], state="state.confiscated", equipped=False)
        elif op == "loseItemsByState":
            for item in self.state["items"].values():
                if item["state"] == e["state"]: item.update(state="state.lost", equipped=False)
        elif op == "learnTechnique": self.state["techniques"].add(e["techniqueId"])
        elif op == "addInsight": self.state["insights"][e["route"]] = self.state["insights"].get(e["route"], 0) + e["amount"]
        elif op == "addKnowledge": self.state["knowledge"].add(e["claimId"])
        elif op == "scheduleEvent": self.state["scheduled"].add(e["eventId"])
        elif op == "cancelEvent": self.state["scheduled"].discard(e["eventId"])
        elif op == "emitFeedback": pass
        else: raise ValueError(f"unsupported effect {op}")

    def normalize(self) -> None:
        for name, high in {"breath": 4, "time": 3, "favor": 2}.items():
            value = self.state["resources"][name]
            if not 0 <= value <= high: raise AssertionError(f"{name} out of range: {value}")
        self.state["injury"] = max(0, min(4, self.state["injury"]))
        self.state["heat"] = max(0, min(3, self.state["heat"]))
        if self.state["injury"] == 4: self.state["life"] = "dead"
        if self.state["freedom"] in {"captured", "imprisoned"}: self.state["resources"]["time"] = 0
        if {"route.guard", "route.roam"} <= self.state["flags"]: raise AssertionError("exclusive routes coexist")
        if {"manual.carried", "manual.entrusted"} <= self.state["flags"]: raise AssertionError("manual states coexist")

    def choose(self, choice_id: str) -> str | None:
        event = self.events[self.current]
        choice = next((x for x in event["choices"] if x["id"] == choice_id), None)
        if choice is None: raise AssertionError(f"{choice_id} not in {self.current}")
        if not self.check(choice["availability"]): raise AssertionError(f"locked choice: {choice_id}")
        for cost in choice["costs"]: self.effect(cost)
        resolution = next((x for x in choice["resolutions"] if x.get("default") or self.check(x["when"])), None)
        if resolution is None: raise AssertionError(f"no resolution: {choice_id}")
        for effect in resolution["effects"]: self.effect(effect)
        self.normalize(); self.log.append(choice_id)
        self.last_result_text_key = resolution.get("resultTextKey")
        destination = resolution["next"]
        if destination["type"] == "event": self.current = destination["eventId"]
        elif destination["type"] == "resolveEnding": self.ending = self.resolve_ending()
        else: self.ending = "end"
        return self.last_result_text_key

    def clone(self) -> "ContentRuntime":
        """Lightweight copy that shares immutable bundle / event refs."""
        c = ContentRuntime.__new__(ContentRuntime)
        c.bundle = self.bundle
        c.events = self.events
        c.endings = self.endings
        c.definitions = self.definitions
        c.player = self.player
        c.current = self.current
        c.ending = self.ending
        c.last_result_text_key = self.last_result_text_key
        s = self.state
        c.state = {
            "abilities": dict(s["abilities"]),
            "resources": dict(s["resources"]),
            "injury": s["injury"],
            "heat": s["heat"],
            "life": s["life"],
            "freedom": s["freedom"],
            "flags": set(s["flags"]),
            "conduct": set(s["conduct"]),
            "knowledge": set(s["knowledge"]),
            "insights": dict(s["insights"]),
            "relationships": {
                cid: {"attitude": rel["attitude"], "tags": set(rel["tags"])}
                for cid, rel in s["relationships"].items()
            },
            "fates": dict(s["fates"]),
            "items": {iid: dict(item) for iid, item in s["items"].items()},
            "techniques": set(s["techniques"]),
            "scheduled": set(s["scheduled"]),
        }
        c.log = list(self.log)
        return c

    def resolve_ending(self) -> str:
        for ending in self.endings:
            if self.check(ending["when"]) and (ending.get("excludeWhen") is None or not self.check(ending["excludeWhen"])):
                return ending["id"]
        raise AssertionError("no ending")

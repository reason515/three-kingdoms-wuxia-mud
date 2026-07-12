"""Real browser E2E tests for the playable Web vertical slice.

Covers JavaScript execution, both character routes, choice-result interludes,
state display, save/continue, endings, responsive layout and browser errors.

Usage: python tools/e2e_browser.py
Requires: pip install playwright && playwright install chromium
"""
from __future__ import annotations

import http.server
import sys
import threading
import traceback
from pathlib import Path
from typing import Any

try:
    from playwright.sync_api import Page, sync_playwright
except ImportError:
    print("FAIL Playwright 未安装：pip install playwright && playwright install chromium")
    raise SystemExit(2)

ROOT = Path(__file__).resolve().parents[1]

DU_GUARD = [
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
    "choice.changan.dujian.d11a.fight",
    "choice.changan.dujian.d11b.guard",
    "choice.changan.dujian.d11c.break_sword",
    "choice.changan.dujian.d12.protect",
]

REN_PROTECTOR = [
    "choice.changan.renshuo.r01.accept",
    "choice.changan.renshuo.r02.trace_sword",
    "choice.changan.renshuo.r03.help",
    "choice.changan.renshuo.r04.listen",
    "choice.changan.renshuo.r05.stop_quietly",
    "choice.changan.renshuo.r06_armor.distribute",
    "choice.changan.renshuo.r06_medicine.give_old",
    "choice.changan.renshuo.r07.protector",
    "choice.changan.renshuo.r08.civilians_first",
    "choice.changan.renshuo.r09a.demand_free",
    "choice.changan.renshuo.r09b.protector",
    "choice.changan.renshuo.r09c.break_saber",
    "choice.changan.renshuo.r10.protect",
]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args: Any) -> None:
        pass


def attach_error_capture(page: Page) -> list[str]:
    errors: list[str] = []
    page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
    page.on("console", lambda msg: errors.append(f"console.{msg.type}: {msg.text}") if msg.type == "error" else None)
    page.on("requestfailed", lambda req: errors.append(f"requestfailed: {req.url} {req.failure}"))
    page.on("response", lambda resp: errors.append(f"HTTP {resp.status}: {resp.url}") if resp.status >= 400 else None)
    return errors


def finish_scene_reveal(page: Page) -> None:
    skip = page.locator("#reveal-skip")
    if skip.is_visible():
        skip.click()
    page.wait_for_selector(".action")


def complete_narrative_overlay(page: Page, kind: str, verify_progress: bool = False) -> None:
    overlay = page.locator(f'[data-overlay="{kind}"]')
    overlay.wait_for(state="visible")
    start = overlay.locator("#intro-start")
    assert start.is_disabled()
    if verify_progress:
        page.wait_for_timeout(180)
        shown = overlay.locator(".intro-text .reveal-unit.is-shown").count()
        total = overlay.locator(".intro-text .reveal-unit").count()
        assert 1 <= shown < total, {"kind": kind, "shown": shown, "total": total}
    assert overlay.locator(".entity-person").count() >= 1, f"person highlighting missing: {kind}"
    if kind == "prologue":
        assert overlay.locator(".entity-place").count() >= 1
    overlay.locator("#intro-reveal").click()
    assert not start.is_disabled()
    start.click()
    overlay.wait_for(state="detached")


def open_game(page: Page, base: str, character: str) -> None:
    page.goto(f"{base}/docs/game.html", wait_until="networkidle")
    page.locator(f"button[onclick=\"startNew('{character}')\"]").click()
    complete_narrative_overlay(page, "prologue", verify_progress=True)
    complete_narrative_overlay(page, "character", verify_progress=True)
    page.wait_for_selector("#reveal-skip", state="visible")
    assert not page.locator(".action").first.is_visible()
    finish_scene_reveal(page)
    assert "/" in page.locator("#st-hp").inner_text()
    assert "/" in page.locator("#st-stamina").inner_text()
    assert page.locator("#st-breath").inner_text().strip().isdigit()
    assert page.locator("#st-gate").inner_text().strip()


def entity_types(page: Page) -> set[str]:
    return {kind for kind in ("person", "item", "place", "technique", "history") if page.locator(f".entity-{kind}").count()}


def choose(page: Page, choice_id: str) -> set[str]:
    finish_scene_reveal(page)
    seen = entity_types(page)
    selector = f'[data-choice-id="{choice_id}"]'
    button = page.locator(selector)
    button.wait_for(state="visible")
    assert button.get_attribute("aria-disabled") == "false", f"locked choice: {choice_id}"
    button.click()
    page.wait_for_selector(".timeline-entry.latest")
    assert not page.locator(".actions .action").first.is_visible(), f"story choices remain active during result: {choice_id}"
    result = page.locator(".timeline-entry.latest .timeline-body").inner_text().strip()
    seen |= entity_types(page)
    assert len(result) >= 8, f"result too short: {choice_id}"
    assert page.locator(".timeline-continue").evaluate("el => el === document.activeElement"), f"result focus missing: {choice_id}"
    page.locator(".timeline-continue").click()
    page.wait_for_selector(".timeline-continue", state="detached")
    if page.evaluate("Boolean(mud && mud.storyCombat && mud.combat)"):
        for _ in range(8):
            if not page.evaluate("Boolean(mud.combat)"):
                break
            command = "attack" if page.evaluate("mud.stamina >= 2") else "defend"
            mud_action(page, command)
        assert not page.evaluate("Boolean(mud.combat)"), f"story combat did not resolve: {choice_id}"
        page.locator('[data-inline-command="continue story"]').click()
        page.wait_for_function("id => document.querySelector('#screen-game').dataset.eventId !== id", arg="event.changan.dujian.d02")
    return seen


def assert_layout(page: Page) -> None:
    metrics = page.evaluate("""() => ({
      viewport: innerWidth,
      doc: document.documentElement.scrollWidth,
      actions: [...document.querySelectorAll('.action')].map(x => x.getBoundingClientRect().height),
      hp: document.querySelector('#st-hp')?.textContent,
      stamina: document.querySelector('#st-stamina')?.textContent,
      breath: document.querySelector('#st-breath')?.textContent,
      gate: document.querySelector('#st-gate')?.textContent
    })""")
    assert metrics["doc"] <= metrics["viewport"] + 1, metrics
    assert metrics["actions"] and min(metrics["actions"]) >= 44, metrics
    assert "/" in str(metrics["hp"]) and "/" in str(metrics["stamina"]), metrics
    assert str(metrics["breath"]).strip().isdigit() and str(metrics["gate"]).strip(), metrics


def play_route(browser: Any, base: str, character: str, route: list[str], expected_title: str) -> None:
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    errors = attach_error_capture(page)
    open_game(page, base, character)
    assert_layout(page)
    seen_entities: set[str] = set()
    for choice_id in route:
        seen_entities |= choose(page, choice_id)
    page.wait_for_selector(".ending-card")
    seen_entities |= entity_types(page)
    assert {"person", "item", "place", "technique"} <= seen_entities, seen_entities
    assert expected_title in page.locator(".ending-title").inner_text()
    assert page.locator(".ending-summary").inner_text().strip()
    assert not errors, "\n".join(errors)
    context.close()


def test_save_continue(browser: Any, base: str) -> None:
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    errors = attach_error_capture(page)
    open_game(page, base, "du_jian")
    button = page.locator('[data-choice-id="choice.changan.dujian.d01.ask"]')
    button.click();page.wait_for_selector(".timeline-entry.latest")
    assert "城门进度向前推进" in page.locator(".timeline-deltas").inner_text()
    page.locator(".timeline-continue").click();page.wait_for_selector(".timeline-entry", state="detached")
    assert page.locator("#screen-game").get_attribute("data-event-id") == "event.changan.dujian.d02"
    page.reload(wait_until="networkidle")
    page.locator("#btn-continue").wait_for(state="visible")
    page.locator("#btn-continue").click()
    page.wait_for_selector("#reveal-skip", state="visible")
    finish_scene_reveal(page)
    assert page.locator("#screen-game").get_attribute("data-event-id") == "event.changan.dujian.d02"
    assert not errors, "\n".join(errors)
    context.close()


def mud_action(page: Page, command: str) -> None:
    button = page.locator(f'[data-inline-command="{command}"]')
    button.wait_for(state="visible")
    button.click()


def test_mud_mechanics(browser: Any, base: str) -> None:
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    errors = attach_error_capture(page)
    open_game(page, base, "du_jian")
    assert "赵衡交付的任务" in page.locator("#mission-card").inner_text()
    choose(page, "choice.changan.dujian.d01.accept")
    assert page.locator("#screen-game").get_attribute("data-event-id") == "event.changan.dujian.d02"
    assert "西市伏击" in page.locator("#mission-card").inner_text()

    # Search and bounded practice happen in the same story screen and append downward.
    mud_action(page, "search")
    mud_action(page, "practice")
    mud_action(page, "practice")
    prof_after_two = page.evaluate("mud.proficiency.short_sword")
    mud_action(page, "practice")
    assert page.evaluate("mud.proficiency.short_sword") == prof_after_two
    assert "已经练尽" in page.evaluate("mud.logs[mud.logs.length-1].text")

    # Recover, commit to an opening tactic, then enter the story-bound combat.
    mud_action(page, "rest")
    button = page.locator('[data-choice-id="choice.changan.dujian.d02.guard_xu"]')
    button.click();page.wait_for_selector(".timeline-continue");page.locator(".timeline-continue").click()
    page.wait_for_function("() => Boolean(mud.combat)")
    assert page.evaluate("mud.combat.id === 'west_market_ambushers'")
    assert not page.locator(".actions .action").first.is_visible()
    mud_action(page, "tech wrist")
    for _ in range(6):
        if not page.evaluate("Boolean(mud.combat)"):
            break
        mud_action(page, "attack" if page.evaluate("mud.stamina >= 2") else "defend")
    assert page.evaluate("mud.combat === null && mud.storyCombat.outcome === 'victory'")
    assert page.evaluate("mud.level") == 2
    assert page.evaluate("mud.defeated.includes('west_market_ambushers')")
    assert page.evaluate("JSON.parse(localStorage.getItem('mud_meta_du_jian')).techniques.includes('mud.quick_draw')")

    # Status explanations and typed commands share the same unified page.
    page.locator("#inline-command").evaluate("el => el.open = true")
    page.locator("#inline-command-input").fill("skills")
    page.locator("#inline-command form button").click()
    page.wait_for_selector("#state-drawer.open")
    assert "兵器熟练" in page.locator("#state-guide-content").inner_text()
    page.locator("#state-drawer header button").click()
    timeline_labels = page.locator(".timeline-label").all_inner_texts()
    assert timeline_labels and timeline_labels[-1].startswith("地点行动")
    saved = page.evaluate("JSON.parse(localStorage.getItem('save_du_jian')).mud")
    assert saved["level"] == 2 and "west_market_ambushers" in saved["defeated"]
    page.reload(wait_until="networkidle")
    page.locator("#btn-continue").click()
    page.wait_for_selector("#screen-game.active")
    assert page.locator("#screen-game").get_attribute("data-event-id") == "event.changan.dujian.d02"
    assert page.evaluate("mud.level") == 2 and "west_market_ambushers" in page.evaluate("mud.defeated")
    assert page.evaluate("runtime.state.flags.has('combat.west_market.victory')")
    page.locator('[data-inline-command="continue story"]').click()
    page.wait_for_function("() => document.querySelector('#screen-game').dataset.eventId === 'event.changan.dujian.d03'")
    finish_scene_reveal(page)
    assert "兵刃撞上砖地" in page.locator("#story-area").inner_text()
    assert not errors, "\n".join(errors)
    context.close()


def test_story_combat_retreat(browser: Any, base: str) -> None:
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    errors = attach_error_capture(page)
    open_game(page, base, "du_jian")
    choose(page, "choice.changan.dujian.d01.accept")
    page.locator('[data-choice-id="choice.changan.dujian.d02.guard_xu"]').click()
    page.wait_for_selector(".timeline-continue");page.locator(".timeline-continue").click()
    page.wait_for_function("() => Boolean(mud.combat)")
    mud_action(page, "flee")
    assert page.evaluate("mud.storyCombat.outcome === 'retreat'")
    assert page.evaluate("runtime.state.flags.has('combat.west_market.retreat')")
    assert page.evaluate("runtime.state.fates['character.xu_jian'] === 'fate.wounded'")
    page.locator('[data-inline-command="continue story"]').click()
    page.wait_for_function("() => document.querySelector('#screen-game').dataset.eventId === 'event.changan.dujian.d03'")
    finish_scene_reveal(page)
    assert "撤出交锋保住了性命" in page.locator("#story-area").inner_text()
    assert not errors, "\n".join(errors)
    context.close()


def test_desktop_frame(browser: Any, base: str) -> None:
    context = browser.new_context(viewport={"width": 1280, "height": 960})
    page = context.new_page()
    errors = attach_error_capture(page)
    open_game(page, base, "ren_shuo")
    assert_layout(page)
    frame = page.locator("#app").bounding_box()
    assert frame and 420 <= frame["width"] <= 440, frame
    assert not errors, "\n".join(errors)
    context.close()


def main() -> int:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    failures: list[str] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-proxy-server"])
            cases = [
                ("杜缄守剑完整路线", lambda: play_route(browser, base, "du_jian", DU_GUARD, "负刃护人")),
                ("任朔护军完整路线", lambda: play_route(browser, base, "ren_shuo", REN_PROTECTOR, "负刀护列")),
                ("存档与继续", lambda: test_save_continue(browser, base)),
                ("MUD探索训练战斗与永久解锁", lambda: test_mud_mechanics(browser, base)),
                ("剧情战斗撤退后果", lambda: test_story_combat_retreat(browser, base)),
                ("桌面设备框与响应式", lambda: test_desktop_frame(browser, base)),
            ]
            for name, case in cases:
                try:
                    case()
                    print(f"  PASS  {name}")
                except Exception as exc:
                    detail=traceback.format_exc();failures.append(f"{name}: {detail}")
                    print(f"  FAIL  {name}: {exc}\n{detail}")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print(f"\n{'='*50}\n{'全部通过' if not failures else f'失败 {len(failures)} 项'}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

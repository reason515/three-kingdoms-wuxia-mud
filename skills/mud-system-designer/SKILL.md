---
name: mud-system-designer
description: Designs rule-driven text RPG systems for the mobile-first, choice-driven, run-based Three Kingdoms wuxia game. Use whenever planning scenario loops, contextual choices, locations, world state, scarce resources, NPC interaction, replay systems, evidence, endings, persistence, challenge modes, combat flow, or how to preserve MUD depth without command input.
---

# MUD System Designer

## Purpose

Preserve the systemic, spatial and textual strengths of MUDs while making the game playable through 2–5 contextual choices on a phone.

## Core loop

```text
read situation → choose action → pay cost → update world state
→ receive narrative feedback → open and close future possibilities
→ reach ending → reveal evidence and fates → start another run
```

## Design priorities

1. **Meaningful choice first**: each action changes state, knowledge, relationships or future availability.
2. **Mobile-first interaction**: the complete core loop works without typed commands.
3. **Persistent world logic**: locations, NPCs, items, injuries, factions and events exist as rule-controlled state.
4. **Finite content, combinatorial replay**: use conditional events, identities, routes and state combinations rather than filler generation.
5. **Data-driven content**: scenarios, events, choices, conditions, effects and text should be content data where practical.
6. **Readable feedback**: prose carries atmosphere; compact state feedback supports decisions.
7. **Small vertical slice** before a large world or live service.

## Choice rule

A valid choice should do at least one of the following:

- consume or gain a scarce resource;
- change a relationship or faction stance;
- reveal information or commit the player to an interpretation;
- increase exposure or injury;
- open or close a route;
- schedule a delayed consequence.

Ordinary scenes should offer 2–3 choices, complex dilemmas 3–4, and rare finales no more than 5. Do not add options merely to reach a target count.

## Default run state

Use a small set unless the scenario proves it needs more:

- `time`: expiring opportunities and mutually exclusive objectives;
- `injury`: limits forceful actions and affects later combat;
- `heat`（风声）: outside attention and pursuit pressure, progressing through 平静、起疑、暴露、缉拿;
- `favor`: limited ability to call on relationships;
- `intel`: known claims, sources, confidence and possible contradictions;
- `relationships`: trust, debt, fear and allegiance;
- `flags`: irreversible commitments and delayed consequences.

## Preserve MUD qualities through

- concrete locations and routes;
- NPC schedules and persistent reactions;
- inventory and abilities that unlock verbs;
- stateful descriptions that change after events;
- tactical text combat;
- action logs and world-consistent feedback.

Do not preserve MUD identity through command memorization, repetitive travel, grinding or oversized inventories.

## Standard deliverables

When designing a system, provide:

1. Player-facing experience.
2. Core state and transitions.
3. Choice conditions, costs and effects.
4. Narrative feedback requirements.
5. Replay and persistence implications.
6. Data model implications.
7. Edge cases and unreachable-state risks.
8. MVP scope versus later expansion.

## Feasibility guidance

Prefer deterministic and testable mechanics for the vertical slice. Delay multiplayer, procedural prose, complex economies, open-ended AI actions and formal leaderboards until the choice-and-consequence loop is demonstrably replayable.

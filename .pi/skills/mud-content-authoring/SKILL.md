---
name: mud-content-authoring
description: Creates, modifies, validates, or reviews YAML game content for the Three Kingdoms MUD project. Use this skill whenever adding or changing rooms, map exits, NPCs, monsters, skills, items, drops, quests, dialogue, encounters, factions, or other data-driven gameplay content—even if the user only asks for a small text or balance adjustment. Enforces stable IDs, schema/reference validation, gameplay consistency, and targeted browser E2E coverage.
---

# MUD Content Authoring

Treat content as executable gameplay data. A room, NPC, quest, skill, or item is not complete merely because its YAML parses: its references, state changes, player presentation, and reachable gameplay path must also be valid.

## 1. Read design constraints first

Before editing content, read:

1. `docs/RECONSTRUCTION.md` — MVP content scope, historical setting, system behavior, and excluded features;
2. `docs/DEVELOPMENT_PLAN.md` — current milestone and requirement mapping;
3. `docs/DEV_WORKFLOW.md` — content package layout, validation rules, E2E policy, and commit scopes;
4. the relevant Zod schema and nearby existing YAML files once the new monorepo exists.

Keep all MVP content inside the confirmed boundary: initial-era Chang'an, 1–10 levels, 20–30 rooms, two routes, and the planned skill/task counts. Flag scope expansion rather than silently adding systems such as crafting, PVP, or cross-state travel.

## 2. Preserve data integrity

Apply these rules to every YAML change:

- Use stable, lowercase dotted IDs, such as `changan.west_market` or `npc.iron_smith_zhang`.
- Do not rename an existing ID without updating every reference and adding a migration/compatibility note when saved player data may contain it.
- Every room exit must target an existing room; normal map exits must have a matching reverse exit.
- Every NPC, monster, skill, item, drop, quest, dialogue, and faction reference must resolve to a defined ID.
- Keep numeric values inside schema limits and documented MVP ranges.
- Use deterministic tables or fixed test seeds for random encounters, drops, and branching content so tests can reproduce outcomes.
- Make room text mobile-readable: establish one concrete scene detail, expose meaningful exits/NPCs/actions, and avoid long unbroken paragraphs.
- Do not use content data to embed arbitrary TypeScript or one-off runtime code; extend the generic schema/engine only when the mechanic is reusable.

## 3. Content-specific design checks

### Rooms and routes

- Each room needs a clear purpose: transit, NPC interaction, training, combat, resource, shop, quest, or atmosphere with a later hook.
- Avoid dead-end rooms without intentional reward, encounter, or narrative purpose.
- Validate entry/exit reachability from the starting inn.
- A path segment must declare travel time, valid encounter table, and access restriction where relevant.

### NPCs and monsters

- NPCs need a role, location/schedule, dialogue or interaction purpose, and valid referenced rewards/quests.
- Monsters need level, combat configuration, respawn policy, drops, and a justified placement.
- Do not create an unbounded safe experience farm; respect limited spawn, stamina, and idle-risk design.

### Skills and items

- Skills need prerequisites, acquisition source, cost, progression effect, and at least one later practical use.
- Items need an unambiguous use/equipment slot and valid numeric effects.
- Every important item should create a player choice or change a tactic, not only add a number.

### Quests and dialogue

- Every step must have a reachable target and an explicit completion/reward state.
- Branch choices must change state, reward, faction, future availability, or player knowledge; do not add fake choices.
- Test the happy path and at least one blocked/alternate condition for multi-step quests.

## 4. Required validation and testing

After a content change:

1. Run schema and reference validation: `pnpm validate`.
2. Add/adjust content tests for rules that are not already generically enforced—for example, a new restricted route, a quest reward boundary, or a skill prerequisite.
3. Add/adjust the smallest relevant E2E:
   - room/path change → `room.spec.ts`;
   - skill/item behavior → `skill.spec.ts` or `combat.spec.ts`;
   - NPC dialogue/quest → `quest.spec.ts`;
   - idle gathering/patrol content → `idle.spec.ts`.
4. Run that domain E2E and then Smoke. Do not run full E2E merely because one YAML file changed.

Use test fixtures to create the player, location, skills, seed, and world state needed by the case. Do not require an E2E test to grind through unrelated content to reach its assertion.

## 5. Commit and final response

Use `content: <description>` for data-only changes. If the change adds engine behavior, use the engine scope as primary and mention the content package in the summary.

Report:

```text
Requirement/milestone: <Rxx or Wxx>
Content changed: <IDs and files>
Integrity checks: <schema/reference checks>
Gameplay coverage: <targeted E2E and expected path>
Verified: <commands actually run and result>
Follow-up: <none or explicit balance/content task>
```

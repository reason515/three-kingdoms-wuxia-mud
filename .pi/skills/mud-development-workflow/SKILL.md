---
name: mud-development-workflow
description: Implements, fixes, refactors, or reviews any code/configuration/test change for the Three Kingdoms MUD project. Use this skill whenever working on server, gateway, PWA, database, game engine, WebSocket protocol, CI, test tooling, or project configuration—even if the user only asks for a small bug fix. Enforces the project requirement-to-code-to-test workflow, targeted E2E coverage, and smoke-test quality gate.
---

# MUD Development Workflow

Use this skill to make each change independently verifiable. The project is a single-developer, direct-to-`main` TypeScript monorepo; speed comes from narrow, deterministic tests, not from skipping validation.

## 1. Read the source of truth

Before changing code, read the applicable documents in this order:

1. `docs/DEVELOPMENT_PLAN.md` — locate the relevant requirement ID (`R01`–`R10`) and milestone;
2. `docs/DEV_WORKFLOW.md` — identify package, commit scope, required test layers, and commands;
3. `docs/RECONSTRUCTION.md` — confirm gameplay and architecture boundaries.

If a requested feature has no requirement, add a concise requirement or backlog entry to the plan before implementation. Do not silently expand MVP scope.

## 2. Classify the change

Assign one primary scope:

| Scope | Typical paths | Required targeted E2E |
|---|---|---|
| `combat` | `packages/server/src/engine/combat.*` | `combat.spec.ts` |
| `skill` | skill/training engine | `skill.spec.ts` |
| `idle` | idle engine or offline settlement | `idle.spec.ts` |
| `room` | room engine, map movement | `room.spec.ts` |
| `quest` | quest/dialogue engine | `quest.spec.ts` |
| `faction` | reputation/teachers | faction E2E when available |
| `content` | YAML rooms/NPCs/skills/items/quests | corresponding content/room/quest E2E |
| `gateway` | authentication, sessions, WebSocket transport | gateway integration test + Smoke |
| `web` | visible PWA interaction | relevant UI E2E + Smoke |
| `server` | cross-engine changes | every affected domain E2E + Smoke |
| `fix` / `chore` | uncategorized bug or tooling | affected tests + Smoke |

Use the scope in the commit message: `scope: concise change description`.

## 3. Implement as a vertical slice

For each change, complete these in the same working session:

1. Implement the smallest behavior that satisfies the requirement.
2. Add or update focused unit tests next to or alongside the changed module.
3. Add integration coverage when an engine boundary, WebSocket event, database write, or content loader is involved.
4. For player-visible behavior, add or update a **targeted E2E test**. Test the changed behavior only; do not run or create a full-suite E2E for a narrow change.
5. Add stable `data-testid` selectors for UI assertions. Do not rely on CSS structure, arbitrary timing, or full narrative text as the sole selector.
6. Keep tests deterministic: use test-only fixtures, isolated SQLite databases, fake clocks, fixed random seeds, and explicit tick advancement where supported.

For YAML content changes, load `/skill:mud-content-authoring` or follow its rules before editing data.

## 4. Run the right checks

Inspect the actual root `package.json` before running commands; do not invent scripts that the repository has not implemented yet.

Once the planned scripts exist, run this order:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm validate                 # when content/schema is affected
pnpm test:e2e -- <scope>      # when the scope has a player-visible E2E
pnpm test:e2e                 # Smoke after every code/configuration change
```

Rules:

- Run only the changed domain's E2E plus Smoke. Run `pnpm test:all` only before a milestone, release, or explicitly requested full regression.
- A documentation-only change does not require E2E.
- If a required command does not exist because the project is in bootstrap, implement the smallest missing test harness work first; never report an unrun test as passed.
- Never leave `test.only`, permanent `test.skip`, disabled assertions, or test-only production endpoints enabled outside `NODE_ENV=test`.

## 5. Definition of done

A code or content change is complete only when:

- its linked requirement is identified or added;
- focused unit/integration tests cover the new rule or regression;
- content validation passes when applicable;
- the targeted E2E covers the changed player behavior when applicable;
- Smoke passes for code/configuration changes;
- the final report lists changed files, commands actually run, and any intentionally deferred work;
- the commit message follows `scope: description` and is small enough to revert safely on `main`.

## 6. Final response format

Report concisely:

```text
Requirement: Rxx — <name>
Scope: <scope>
Changed: <key files>
Added/updated tests: <unit / integration / E2E>
Verified: <commands actually run and result>
Deferred: <none or explicit follow-up>
```

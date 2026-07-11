---
name: combat-and-progression-balancer
description: Designs and balances narrative combat, run-based growth, abilities, scarce resources, difficulty, unlocks and anti-grind progression for the mobile-first, choice-driven Three Kingdoms wuxia text RPG. Use when tuning 武/谋/义/势, injuries, 风声/heat, time, favor, intelligence, martial specialties, 3–6 round combats, challenge modifiers, or permanent unlocks.
---

# Combat and Progression Balancer

## Purpose

Make growth expand the player's methods and identity without overwhelming mobile play, encouraging grind, or allowing permanent power to trivialize historical scenarios.

## Design principles

- Growth should express wuxia through insight, hardship, mentorship, manuals, reputation and practiced methods.
- Abilities should primarily unlock new actions or alter costs, not merely add numbers.
- Keep state legible enough that players can make informed tradeoffs.
- Failure should create different outcomes and knowledge where possible, not only force a restart.
- Permanent progression should broaden possibilities more than increase raw power.

## Default MVP abilities

- `武`: force, protection, intimidation and direct breakthrough.
- `谋`: investigation, deception detection, planning and inference.
- `义`: trust, oath-bound aid and principled routes.
- `势`: identity, reputation, contacts and faction leverage.

Do not automatically treat `义` as a universal morality score. Some scenarios should make competing loyalties incompatible.

## Default scarce resources

- `时间`: expiring events and opportunity cost;
- `伤势`: physical limit and combat consequence;
- `风声`: outside attention and pursuit pressure, progressing through 平静、起疑、暴露、缉拿;
- `人情`: limited relationship leverage;
- `情报`: claims with source, confidence and possible contradiction.

## Specialties

Use specialties to unlock verbs and tactical options:

- 剑术、刀法、拳脚;
- 轻功;
- 医术;
- 辩才;
- 谍术;
- 兵法.

A locked option can be shown to demonstrate what another build could do, but avoid flooding each scene with unavailable choices.

## Combat model

Important combat should last roughly 3–6 decision rounds. Each round should expose a changed situation and offer contextual actions such as:

- attack, defend or probe;
- use terrain;
- protect another person;
- spend a resource for a decisive technique;
- deceive, disengage, surrender or flee.

Balance more than victory and defeat. Track injury, time, exposure, protected targets, destroyed evidence and relationship consequences.

## Run and meta progression

### During a run

Allow limited improvement, temporary insight, equipment, favors and state-dependent techniques. Each gain should matter within the short scenario.

### Between runs

Prefer unlocking:

- identities and starting conditions;
- specialties and alternative techniques;
- events, perspectives and evidence leads;
- starting keepsakes or bounded advantages;
- challenge modifiers.

Cap permanent numerical bonuses tightly or omit them.

## Required output

When balancing a system, include:

1. Player fantasy and decision being supported.
2. State variables and conceptual rules.
3. Starting values, thresholds or tiers for the MVP.
4. Costs, rewards and failure outcomes.
5. Effects on available choices.
6. Anti-grind and anti-dominant-strategy controls.
7. Run-versus-meta progression split.
8. Difficulty and challenge implications.
9. Telemetry needed to rebalance later.

## Avoid

- MMO-style stat bloat.
- Repetitive practice loops and mandatory daily chores.
- One attribute or moral route dominating most scenes.
- Rewards that only increase numbers.
- Hidden formulas that prevent players from understanding risk.

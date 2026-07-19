import { describe, expect, it } from 'vitest';

import { calculateDamage, processCombatRound, startCombat, type CombatState } from '../../src/engine/combat.js';

const thug = { id: 'mob.street_thug', name: '闲汉', hp: 30, atk: 10, def: 5 };

describe('combat formulas', () => {
  it('calculates damage with strength, skill, and target defense', () => {
    const damage = calculateDamage(8, 20, 30, 5, 10);
    expect(damage).toBeGreaterThanOrEqual(1);
    expect(damage).toBeLessThanOrEqual(30);
  });

  it('clamps damage to at least 1', () => {
    expect(calculateDamage(1, 0, 0, 100, 30)).toBe(1);
  });
});

describe('combat rounds', () => {
  it('produces victory against a weak enemy after several rounds', () => {
    let state = startCombat('char-1', thug, 100) as CombatState;
    expect(state.log).toHaveLength(1);

    // Run up to 10 rounds or until victory
    for (let i = 0; i < 10 && !state.result; i++) state = processCombatRound(state!, 25, 50)!;
    expect(state.result).toBe('victory');
    expect(state.log.at(-1)?.message).toContain('击败');

    // Processing after result should return null
    expect(processCombatRound(state!, 25, 50)).toBeNull();
  });

  it('enemy deals damage each round', () => {
    let state = startCombat('char-2', { ...thug, hp: 200, atk: 20 }, 100) as CombatState;
    state = processCombatRound(state!, 10, 0)!;
    const enemyEntries = state.log.filter((entry) => entry.attacker === 'enemy');
    expect(enemyEntries.length).toBeGreaterThanOrEqual(1);
    for (const entry of enemyEntries) expect(entry.damage).toBeGreaterThan(0);
  });
});

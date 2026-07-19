import type { Skill } from '@hanmo/content';
import { describe, expect, it } from 'vitest';

import { calculateTrainingGain, canTrain } from '../../src/engine/skill.js';

const breathing: Skill = { id: 'skill.basic_breathing', name: '基础吐纳', category: 'internal', maxProficiency: 100, baseTrainingGain: 3, prerequisites: [] };
const sword: Skill = { id: 'skill.basic_sword', name: '基础剑法', category: 'sword', maxProficiency: 100, baseTrainingGain: 2, prerequisites: [{ skillId: 'skill.basic_breathing', minProficiency: 10 }] };

describe('skill progression', () => {
  it('enforces prerequisites and proficiency caps', () => {
    expect(canTrain(sword, [])).toMatchObject({ allowed: false });
    expect(canTrain(sword, [{ skillId: breathing.id, proficiency: 10 }])).toEqual({ allowed: true });
    expect(canTrain(breathing, [{ skillId: breathing.id, proficiency: 100 }])).toMatchObject({ allowed: false });
  });

  it('calculates intelligence-scaled training gain without exceeding the cap', () => {
    expect(calculateTrainingGain(breathing, 20, 0)).toBe(3);
    expect(calculateTrainingGain(sword, 50, 0)).toBe(3);
    expect(calculateTrainingGain(breathing, 20, 98)).toBe(2);
  });
});

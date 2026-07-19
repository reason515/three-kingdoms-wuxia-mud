import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadSkills } from '../src/loaders/skills.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('basic skill content', () => {
  it('loads breathing, sword, and blade skills with valid prerequisite references', async () => {
    const skills = await loadSkills(resolve(packageRoot, 'skills/basic'));
    const ids = new Set(skills.map((skill) => skill.id));
    expect(ids).toEqual(new Set(['skill.basic_blade', 'skill.basic_breathing', 'skill.basic_sword']));
    for (const skill of skills) {
      for (const prerequisite of skill.prerequisites) expect(ids).toContain(prerequisite.skillId);
    }
  });
});

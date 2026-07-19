import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

import { SkillSchema, type Skill } from '../schema/skill.js';

export async function loadSkills(skillDirectory: string): Promise<Skill[]> {
  const files = (await readdir(skillDirectory)).filter((file) => file.endsWith('.yml')).sort();
  return Promise.all(files.map(async (file) => SkillSchema.parse(parse(await readFile(resolve(skillDirectory, file), 'utf8')))));
}

export function loadBundledSkills(): Promise<Skill[]> {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  return loadSkills(resolve(packageRoot, 'skills/basic'));
}

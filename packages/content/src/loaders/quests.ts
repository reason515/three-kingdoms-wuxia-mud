import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

import { QuestSchema, type Quest } from '../schema/quest.js';

export async function loadQuests(questDirectory: string): Promise<Quest[]> {
  const files = (await readdir(questDirectory)).filter((file) => file.endsWith('.yml')).sort();
  return Promise.all(files.map(async (file) => QuestSchema.parse(parse(await readFile(resolve(questDirectory, file), 'utf8')))));
}

export function loadBundledQuests(): Promise<Quest[]> {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  return loadQuests(resolve(packageRoot, 'quests'));
}

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

import { NpcSchema, type Npc } from '../schema/npc.js';

export async function loadNpcs(npcDirectory: string): Promise<Npc[]> {
  const files = (await readdir(npcDirectory)).filter((file) => file.endsWith('.yml')).sort();
  return Promise.all(files.map(async (file) => NpcSchema.parse(parse(await readFile(resolve(npcDirectory, file), 'utf8')))));
}

export function loadBundledNpcs(): Promise<Npc[]> {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  return loadNpcs(resolve(packageRoot, 'npcs/changan'));
}

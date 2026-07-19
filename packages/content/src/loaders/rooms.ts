import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

import { RoomSchema, type Room } from '../schema/room.js';

export async function loadRooms(roomDirectory: string): Promise<Room[]> {
  const files = (await readdir(roomDirectory)).filter((file) => file.endsWith('.yml')).sort();
  return Promise.all(
    files.map(async (file) => RoomSchema.parse(parse(await readFile(resolve(roomDirectory, file), 'utf8')))),
  );
}

export function loadBundledRooms(): Promise<Room[]> {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  return loadRooms(resolve(packageRoot, 'rooms/changan'));
}

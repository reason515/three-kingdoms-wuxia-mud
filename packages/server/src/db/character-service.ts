import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { eq } from 'drizzle-orm';

import { characters, characterSkills, innateAttrs, players } from './schema.js';
import type { GameDatabase } from './client.js';
import type { Direction, RoomEngine, RoomState } from '../engine/room.js';

const scrypt = promisify(scryptCallback);
const USERNAME = /^[a-z][a-z0-9_]{2,19}$/;
const CHARACTER_NAME = /^[\p{Script=Han}A-Za-z]{2,12}$/u;
export type InnateAttributes = { strength: number; intelligence: number; dexterity: number; constitution: number };
export type CharacterProfile = { id: string; name: string; locationRoomId: string; stamina: number; maxStamina: number; attributes: InnateAttributes };

export class AccountError extends Error {}

function validateRegistration(username: string, password: string): void {
  if (!USERNAME.test(username)) throw new AccountError('账号须为 3–20 位小写字母、数字或下划线，并以字母开头。');
  if (password.length < 8 || password.length > 72) throw new AccountError('口令须为 8–72 位。');
}

function validateCharacter(name: string, attributes: InnateAttributes): void {
  if (!CHARACTER_NAME.test(name)) throw new AccountError('角色名须为 2–12 个汉字或字母。');
  for (const [label, value] of Object.entries(attributes)) {
    if (!Number.isInteger(value) || value < 3 || value > 30) throw new AccountError(`${label} 须为 3–30 的整数。`);
  }
}

async function hashPassword(password: string, salt = randomBytes(16).toString('hex')): Promise<string> {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

async function passwordMatches(password: string, encoded: string): Promise<boolean> {
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected) return false;
  const actual = await hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(actual), Buffer.from(encoded));
}

export function rollAttributes(random: () => number = Math.random): InnateAttributes {
  const roll = () => Array.from({ length: 3 }, () => Math.floor(random() * 10) + 1).reduce((sum, die) => sum + die, 0);
  return { strength: roll(), intelligence: roll(), dexterity: roll(), constitution: roll() };
}

export async function registerAccount(db: GameDatabase, username: string, password: string): Promise<string> {
  validateRegistration(username, password);
  const now = new Date();
  const playerId = randomUUID();
  try {
    await db.insert(players).values({ id: playerId, username, passwordHash: await hashPassword(password), createdAt: now, lastLogin: now });
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) throw new AccountError('此账号已被占用。');
    throw error;
  }
  return playerId;
}

export async function createCharacter(
  db: GameDatabase,
  playerId: string,
  name: string,
  attributes: InnateAttributes,
): Promise<CharacterProfile> {
  validateCharacter(name, attributes);
  const characterId = randomUUID();
  const createdAt = new Date();
  await db.insert(characters).values({ id: characterId, playerId, name, locationRoomId: 'changan.inn', createdAt });
  await db.insert(innateAttrs).values({ characterId, ...attributes });
  await db.insert(characterSkills).values({ characterId, skillId: 'skill.basic_breathing', proficiency: 0 });
  return { id: characterId, name, locationRoomId: 'changan.inn', stamina: 100, maxStamina: 100, attributes };
}

export async function moveCharacter(db: GameDatabase, rooms: RoomEngine, characterId: string, direction: Direction): Promise<RoomState> {
  const character = await db.select().from(characters).where(eq(characters.id, characterId)).get();
  if (!character) throw new AccountError('角色不存在。');
  const destination = rooms.move(character.locationRoomId, direction);
  await db.update(characters).set({ locationRoomId: destination.id }).where(eq(characters.id, characterId));
  return destination;
}

export async function login(db: GameDatabase, username: string, password: string): Promise<CharacterProfile | null> {
  const player = await db.select().from(players).where(eq(players.username, username)).get();
  if (!player || !(await passwordMatches(password, player.passwordHash))) throw new AccountError('账号或口令不正确。');
  await db.update(players).set({ lastLogin: new Date() }).where(eq(players.id, player.id));
  const character = await db.select().from(characters).where(eq(characters.playerId, player.id)).get();
  if (!character) return null;
  const attributes = await db.select().from(innateAttrs).where(eq(innateAttrs.characterId, character.id)).get();
  if (!attributes) throw new Error(`Character ${character.id} has no innate attributes.`);
  return {
    id: character.id,
    name: character.name,
    locationRoomId: character.locationRoomId,
    stamina: character.stamina,
    maxStamina: character.maxStamina,
    attributes: {
      strength: attributes.strength,
      intelligence: attributes.intelligence,
      dexterity: attributes.dexterity,
      constitution: attributes.constitution,
    },
  };
}

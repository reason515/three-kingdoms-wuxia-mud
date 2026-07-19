import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { loadNpcs } from '../loaders/npcs.js';
import { loadQuests } from '../loaders/quests.js';
import { loadRooms } from '../loaders/rooms.js';
import { loadSkills } from '../loaders/skills.js';

const opposite: Record<string, string> = { north: 'south', south: 'north', east: 'west', west: 'east', up: 'down', down: 'up' };
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const rooms = await loadRooms(resolve(packageRoot, 'rooms/changan'));
const npcs = await loadNpcs(resolve(packageRoot, 'npcs/changan'));
const skills = await loadSkills(resolve(packageRoot, 'skills/basic'));
const quests = await loadQuests(resolve(packageRoot, 'quests'));
const byRoomId = new Map(rooms.map((room) => [room.id, room]));
const byNpcId = new Map(npcs.map((npc) => [npc.id, npc]));
const bySkillId = new Map(skills.map((skill) => [skill.id, skill]));
if (byRoomId.size !== rooms.length) throw new Error('Duplicate room ID detected.');
if (byNpcId.size !== npcs.length) throw new Error('Duplicate NPC ID detected.');
if (bySkillId.size !== skills.length) throw new Error('Duplicate skill ID detected.');

for (const room of rooms) {
  for (const [direction, targetId] of Object.entries(room.exits)) {
    const target = byRoomId.get(targetId);
    if (!target) throw new Error(`${room.id}: ${direction} exit references missing room ${targetId}`);
    const reverse = opposite[direction];
    if (target.exits[reverse as keyof typeof target.exits] !== room.id) throw new Error(`${room.id}: ${direction} → ${targetId} lacks reverse ${reverse} exit`);
  }
  for (const npcId of room.npcs) {
    const npc = byNpcId.get(npcId);
    if (!npc) throw new Error(`${room.id}: references missing NPC ${npcId}`);
    if (npc.location !== room.id) throw new Error(`${room.id}: NPC ${npcId} declares location ${npc.location}`);
  }
}
for (const npc of npcs) {
  if (!byRoomId.has(npc.location)) throw new Error(`${npc.id}: location ${npc.location} does not exist`);
}
for (const skill of skills) {
  for (const prerequisite of skill.prerequisites) {
    if (!bySkillId.has(prerequisite.skillId)) throw new Error(`${skill.id}: missing prerequisite ${prerequisite.skillId}`);
    if (prerequisite.skillId === skill.id) throw new Error(`${skill.id}: cannot require itself`);
  }
}

const reached = new Set<string>(['changan.inn']);
for (const roomId of reached) for (const target of Object.values(byRoomId.get(roomId)?.exits ?? {})) reached.add(target);
if (reached.size !== rooms.length) throw new Error(`Unreachable Chang’an rooms: ${rooms.filter((room) => !reached.has(room.id)).map((room) => room.id).join(', ')}`);

for (const quest of quests) {
  for (const step of quest.steps) {
    if (step.type === 'talk' && !byNpcId.has(step.target)) throw new Error(`${quest.id} step ${step.id}: NPC ${step.target} not found`);
    if (step.type === 'goto' && !byRoomId.has(step.target)) throw new Error(`${quest.id} step ${step.id}: room ${step.target} not found`);
  }
  for (const skillId of Object.keys(quest.rewards.skillProficiency ?? {})) {
    if (!bySkillId.has(skillId)) throw new Error(`${quest.id}: reward references unknown skill ${skillId}`);
  }
}

console.info(`Content validation passed: ${rooms.length} room(s), ${npcs.length} NPC(s), ${skills.length} skill(s), ${quests.length} quest(s), and all references verified.`);

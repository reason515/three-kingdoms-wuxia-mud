import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  lastLogin: integer('last_login', { mode: 'timestamp_ms' }).notNull(),
});

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull().unique().references(() => players.id),
  name: text('name').notNull(),
  locationRoomId: text('location_room_id').notNull().default('changan.inn'),
  stamina: integer('stamina').notNull().default(100),
  maxStamina: integer('max_stamina').notNull().default(100),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const innateAttrs = sqliteTable('innate_attrs', {
  characterId: text('character_id').primaryKey().references(() => characters.id),
  strength: integer('strength').notNull(),
  intelligence: integer('intelligence').notNull(),
  dexterity: integer('dexterity').notNull(),
  constitution: integer('constitution').notNull(),
});

export const characterSkills = sqliteTable('character_skills', {
  characterId: text('character_id').notNull().references(() => characters.id),
  skillId: text('skill_id').notNull(),
  proficiency: integer('proficiency').notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.characterId, table.skillId] }),
]);

export const characterQuests = sqliteTable('character_quests', {
  characterId: text('character_id').notNull().references(() => characters.id),
  questId: text('quest_id').notNull(),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
}, (table) => [
  primaryKey({ columns: [table.characterId, table.questId] }),
]);

export const trainingStates = sqliteTable('training_states', {
  characterId: text('character_id').primaryKey().references(() => characters.id),
  skillId: text('skill_id').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  stoppedAt: integer('stopped_at', { mode: 'timestamp_ms' }),
});

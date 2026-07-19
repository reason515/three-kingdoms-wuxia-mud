import type { Skill } from '@hanmo/content';
import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createCharacter, registerAccount } from '../../src/db/character-service.js';
import { createDatabase, migrate } from '../../src/db/client.js';
import { characters, characterSkills } from '../../src/db/schema.js';
import { TrainingEngine } from '../../src/engine/training.js';
import { FakeClock, WorldTick } from '../../src/tick.js';

const breathing: Skill = { id: 'skill.basic_breathing', name: '基础吐纳', category: 'internal', maxProficiency: 100, baseTrainingGain: 3, prerequisites: [] };
const blade: Skill = { id: 'skill.basic_blade', name: '基础刀法', category: 'blade', maxProficiency: 100, baseTrainingGain: 2, prerequisites: [{ skillId: breathing.id, minProficiency: 10 }] };

describe('TrainingEngine', () => {
  it('persists tick-based proficiency gains and stops settlement explicitly', async () => {
    const { client, db } = await createDatabase();
    await migrate(client);
    const playerId = await registerAccount(db, 'train_test', 'stable-password');
    const character = await createCharacter(db, playerId, '杜缄', { strength: 18, intelligence: 20, dexterity: 14, constitution: 15 });
    const clock = new FakeClock(10_000);
    const world = new WorldTick(clock);
    const training = new TrainingEngine(db, [breathing]);
    world.register(training);

    await training.start(character.id, breathing.id, clock.now());
    clock.advance(1_000);
    await world.tick();
    await expect(db.select().from(characterSkills).where(eq(characterSkills.characterId, character.id)).get()).resolves.toMatchObject({ proficiency: 3 });

    await training.stop(character.id);
    clock.advance(1_000);
    await world.tick();
    await expect(db.select().from(characterSkills).where(eq(characterSkills.characterId, character.id)).get()).resolves.toMatchObject({ proficiency: 3 });
    expect(training.status(character.id)).toBeUndefined();
    client.close();
  });

  it('settles offline breathing gains for an hour with 50% efficiency', async () => {
    const { client, db } = await createDatabase();
    await migrate(client);
    const playerId = await registerAccount(db, 'offline_test', 'stable-password');
    const character = await createCharacter(db, playerId, '杜缄', { strength: 18, intelligence: 20, dexterity: 14, constitution: 15 });
    const clock = new FakeClock(10_000);
    const world = new WorldTick(clock);
    const training = new TrainingEngine(db, [breathing]);
    world.register(training);

    await training.start(character.id, breathing.id, clock.now());
    clock.advance(1_000);
    await world.tick();
    await training.stop(character.id, clock.now());

    const settled = await training.settleOffline(character.id, clock.now() + 3_600_000);
    expect(settled).toBeDefined();
    expect(settled!.gain).toBeGreaterThan(0);
    expect(settled!.hours).toBeCloseTo(1, 1);
    expect(training.status(character.id)).toBeUndefined();
    client.close();
  });

  it('drains stamina per tick for blade practice and stops on stamina exhaustion', async () => {
    const { client, db } = await createDatabase();
    await migrate(client);
    const playerId = await registerAccount(db, 'stamina_test', 'stable-password');
    const character = await createCharacter(db, playerId, '杜缄', { strength: 18, intelligence: 20, dexterity: 14, constitution: 15 });
    await db.update(characterSkills).set({ proficiency: 10 }).where(and(eq(characterSkills.characterId, character.id), eq(characterSkills.skillId, breathing.id)));
    await db.insert(characterSkills).values({ characterId: character.id, skillId: blade.id, proficiency: 0 });
    const clock = new FakeClock(10_000);
    const world = new WorldTick(clock);
    const training = new TrainingEngine(db, [breathing, blade]);
    world.register(training);

    // Set stamina to 1 so 1 tick gains proficiency and 2nd sees empty tank
    await db.update(characters).set({ stamina: 1 }).where(eq(characters.id, character.id));
    await training.start(character.id, blade.id, clock.now());

    clock.advance(1_000); await world.tick();
    expect(training.status(character.id)).toBeDefined();
    clock.advance(1_000); await world.tick();
    const progress = await db.select({ proficiency: characterSkills.proficiency }).from(characterSkills).where(and(eq(characterSkills.characterId, character.id), eq(characterSkills.skillId, blade.id))).get();
    expect(progress?.proficiency).toBeGreaterThanOrEqual(2);
    expect(training.status(character.id)).toBeUndefined();
    client.close();
  });
});

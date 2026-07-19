import type { Skill } from '@hanmo/content';
import { and, eq, isNull } from 'drizzle-orm';

import type { GameDatabase } from '../db/client.js';
import { characterSkills, characters, innateAttrs, trainingStates } from '../db/schema.js';
import type { ITickable } from '../tick.js';
import { calculateTrainingGain, canTrain } from './skill.js';

export type TrainingStatus = { characterId: string; skillId: string; startedAt: number };
export type SkillProgress = { skillId: string; name: string; proficiency: number };
export type TrainingSnapshot = { active: TrainingStatus | undefined; skills: SkillProgress[]; stamina: number; maxStamina: number; offlineSettled?: { gain: number; hours: number } };

export class TrainingEngine implements ITickable {
  private readonly skills: ReadonlyMap<string, Skill>;
  private readonly active = new Map<string, TrainingStatus>();
  static readonly OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
  static readonly OFFLINE_EFFICIENCY = 0.5;

  constructor(private readonly db: GameDatabase, skills: readonly Skill[]) {
    this.skills = new Map(skills.map((skill) => [skill.id, skill]));
  }

  async hydrate(): Promise<void> {
    const states = await this.db.select().from(trainingStates).where(isNull(trainingStates.stoppedAt));
    states.forEach((state) => this.active.set(state.characterId, { characterId: state.characterId, skillId: state.skillId, startedAt: state.startedAt.getTime() }));
  }

  async start(characterId: string, skillId: string, startedAt = Date.now()): Promise<TrainingStatus> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Unknown skill: ${skillId}`);
    const known = await this.db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId));
    const eligibility = canTrain(skill, known);
    if (!eligibility.allowed) throw new Error(eligibility.reason);
    await this.db.delete(trainingStates).where(eq(trainingStates.characterId, characterId));
    await this.db.insert(trainingStates).values({ characterId, skillId, startedAt: new Date(startedAt) });
    const status = { characterId, skillId, startedAt };
    this.active.set(characterId, status);
    return status;
  }

  async stop(characterId: string, stoppedAt = Date.now()): Promise<void> {
    this.active.delete(characterId);
    await this.db.update(trainingStates).set({ stoppedAt: new Date(stoppedAt) }).where(and(eq(trainingStates.characterId, characterId), isNull(trainingStates.stoppedAt)));
  }

  status(characterId: string): TrainingStatus | undefined {
    return this.active.get(characterId);
  }

  async progress(characterId: string): Promise<TrainingSnapshot> {
    const offlineSettled = await this.settleOffline(characterId);
    const [skills, char] = await Promise.all([
      this.db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId)),
      this.db.select({ stamina: characters.stamina, maxStamina: characters.maxStamina }).from(characters).where(eq(characters.id, characterId)).get(),
    ]);
    return {
      active: this.status(characterId),
      skills: skills.map((row) => ({ skillId: row.skillId, name: this.skills.get(row.skillId)?.name ?? row.skillId, proficiency: row.proficiency })),
      stamina: char?.stamina ?? 0,
      maxStamina: char?.maxStamina ?? 100,
      offlineSettled,
    };
  }

  async settleOffline(characterId: string, now = Date.now()): Promise<{ gain: number; hours: number } | undefined> {
    const state = await this.db.select().from(trainingStates).where(eq(trainingStates.characterId, characterId)).get();
    if (!state?.stoppedAt) return undefined;
    const skill = this.skills.get(state.skillId);
    const attribute = await this.db.select().from(innateAttrs).where(eq(innateAttrs.characterId, characterId)).get();
    const characterSkill = await this.db.select().from(characterSkills).where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillId, state.skillId))).get();
    if (!skill || !attribute || !characterSkill) { await this.db.delete(trainingStates).where(eq(trainingStates.characterId, characterId)); return undefined; }

    const elapsed = Math.max(0, now - state.stoppedAt.getTime());
    const capped = Math.min(elapsed, TrainingEngine.OFFLINE_CAP_MS);
    const ticks = Math.floor(capped / 1_000);
    const perTickGain = calculateTrainingGain(skill, attribute.intelligence, characterSkill.proficiency);
    const rawGain = ticks * perTickGain;
    const gain = Math.max(0, Math.floor(rawGain * TrainingEngine.OFFLINE_EFFICIENCY));
    const cappedGain = Math.min(gain, skill.maxProficiency - characterSkill.proficiency);

    if (cappedGain > 0) {
      await this.db.update(characterSkills).set({ proficiency: characterSkill.proficiency + cappedGain }).where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillId, state.skillId)));
    }
    await this.db.delete(trainingStates).where(eq(trainingStates.characterId, characterId));
    return { gain: cappedGain, hours: Math.round((capped / 3_600_000) * 100) / 100 };
  }

  async onTick(): Promise<void> {
    for (const training of this.active.values()) {
      const skill = this.skills.get(training.skillId);
      const [attribute, characterSkill, char] = await Promise.all([
        this.db.select().from(innateAttrs).where(eq(innateAttrs.characterId, training.characterId)).get(),
        this.db.select().from(characterSkills).where(and(eq(characterSkills.characterId, training.characterId), eq(characterSkills.skillId, training.skillId))).get(),
        this.db.select({ stamina: characters.stamina }).from(characters).where(eq(characters.id, training.characterId)).get(),
      ]);
      if (!skill || !attribute || !characterSkill || !char) {
        await this.stop(training.characterId);
        continue;
      }
      const costsStamina = skill.category !== 'internal';
      if (costsStamina && char.stamina <= 0) {
        await this.stop(training.characterId);
        continue;
      }
      const gain = calculateTrainingGain(skill, attribute.intelligence, characterSkill.proficiency);
      if (gain === 0) {
        await this.stop(training.characterId);
        continue;
      }
      await this.db.update(characterSkills).set({ proficiency: characterSkill.proficiency + gain }).where(and(eq(characterSkills.characterId, training.characterId), eq(characterSkills.skillId, training.skillId)));
      if (costsStamina) await this.db.update(characters).set({ stamina: Math.max(0, char.stamina - 1) }).where(eq(characters.id, training.characterId));
    }
  }
}

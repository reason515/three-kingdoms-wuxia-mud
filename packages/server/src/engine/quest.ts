import type { Quest, Skill } from '@hanmo/content';
import { and, eq } from 'drizzle-orm';

import type { GameDatabase } from '../db/client.js';
import { characterQuests, characterSkills } from '../db/schema.js';

export type QuestProgress = { questId: string; questName: string; stepIndex: number; stepCount: number; stepDescription: string; completed: boolean };
export type QuestActionResult = { questId: string; stepIndex: number; completed: boolean; message: string };

export class QuestEngine {
  private readonly quests: ReadonlyMap<string, Quest>;
  private readonly skillNames: ReadonlyMap<string, string>;

  constructor(quests: readonly Quest[], private readonly db: GameDatabase, skills: readonly Skill[] = []) {
    this.quests = new Map(quests.map((quest) => [quest.id, quest]));
    this.skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
  }

  async accept(characterId: string, questId: string): Promise<QuestProgress | null> {
    const quest = this.quests.get(questId);
    if (!quest) throw new Error(`Unknown quest: ${questId}`);
    const existing = await this.db.select().from(characterQuests).where(and(eq(characterQuests.characterId, characterId), eq(characterQuests.questId, questId))).get();
    if (existing?.completed) return this.toProgress(quest, existing.currentStepIndex, true);
    await this.db.insert(characterQuests).values({ characterId, questId, currentStepIndex: 0 }).onConflictDoNothing();
    return this.toProgress(quest, 0, false) ?? null;
  }

  async reportAction(characterId: string, action: { type: 'talk' | 'goto' | 'kill'; target: string }): Promise<QuestActionResult | null> {
    const rows = await this.db.select().from(characterQuests).where(and(eq(characterQuests.characterId, characterId), eq(characterQuests.completed, false)));
    for (const row of rows) {
      const quest = this.quests.get(row.questId);
      if (!quest) continue;
      const step = quest.steps[row.currentStepIndex];
      if (!step) continue;
      if (step.type === action.type && step.target === action.target) {
        const nextIndex = row.currentStepIndex + 1;
        const completed = nextIndex >= quest.steps.length;
        await this.db.update(characterQuests).set({ currentStepIndex: nextIndex, completed, completedAt: completed ? new Date() : null }).where(and(eq(characterQuests.characterId, characterId), eq(characterQuests.questId, quest.id)));
        if (completed) {
          const rewardSummary = await this.applyRewards(characterId, quest);
          return { questId: quest.id, stepIndex: nextIndex, completed, message: `任务「${quest.name}」已完成。${rewardSummary ? `获得：${rewardSummary}` : ''}` };
        }
      }
    }
    return null;
  }

  async progress(characterId: string): Promise<QuestProgress[]> {
    const rows = await this.db.select().from(characterQuests).where(eq(characterQuests.characterId, characterId));
    return rows.map((row) => {
      const quest = this.quests.get(row.questId);
      return this.toProgress(quest, row.currentStepIndex, row.completed);
    }).filter((progress): progress is QuestProgress => progress !== null);
  }

  private toProgress(quest: Quest | undefined, index: number, completed: boolean): QuestProgress | null {
    if (!quest) return null;
    const step = quest.steps[Math.min(index, quest.steps.length - 1)];
    return { questId: quest.id, questName: quest.name, stepIndex: index, stepCount: quest.steps.length, stepDescription: step?.description ?? '', completed };
  }

  private async applyRewards(characterId: string, quest: Quest): Promise<string | null> {
    if (!quest.rewards.skillProficiency) return null;
    const parts: string[] = [];
    for (const [skillId, amount] of Object.entries(quest.rewards.skillProficiency)) {
      const existing = await this.db.select().from(characterSkills).where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillId, skillId))).get();
      if (existing) {
        await this.db.update(characterSkills).set({ proficiency: existing.proficiency + amount }).where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillId, skillId)));
        parts.push(`${this.skillNames.get(skillId) ?? skillId} +${amount}熟练度`);
      }
    }
    return parts.length > 0 ? parts.join('、') : null;
  }
}

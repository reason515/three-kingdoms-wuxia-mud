import type { Skill } from '@hanmo/content';

export type CharacterSkill = { skillId: string; proficiency: number };
export type TrainingEligibility = { allowed: true } | { allowed: false; reason: string };

export function canTrain(skill: Skill, knownSkills: readonly CharacterSkill[]): TrainingEligibility {
  if ((knownSkills.find((known) => known.skillId === skill.id)?.proficiency ?? 0) >= skill.maxProficiency) {
    return { allowed: false, reason: '此项武学已至当前上限。' };
  }
  for (const prerequisite of skill.prerequisites) {
    const proficiency = knownSkills.find((known) => known.skillId === prerequisite.skillId)?.proficiency ?? 0;
    if (proficiency < prerequisite.minProficiency) return { allowed: false, reason: `需先将 ${prerequisite.skillId} 修至 ${prerequisite.minProficiency}。` };
  }
  return { allowed: true };
}

export function calculateTrainingGain(skill: Skill, intelligence: number, currentProficiency: number): number {
  if (!Number.isInteger(intelligence) || intelligence < 0) throw new Error('Intelligence must be a non-negative integer.');
  const remaining = Math.max(0, skill.maxProficiency - currentProficiency);
  const rawGain = Math.max(1, Math.floor(skill.baseTrainingGain * (1 + intelligence / 100)));
  return Math.min(rawGain, remaining);
}

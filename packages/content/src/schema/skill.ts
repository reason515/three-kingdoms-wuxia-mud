import { z } from 'zod';

export const SkillSchema = z.object({
  id: z.string().regex(/^skill\.[a-z][a-z0-9_]*$/, 'Skill ID must use skill.<lowercase_name>'),
  name: z.string().min(2).max(20),
  category: z.enum(['internal', 'sword', 'blade']),
  maxProficiency: z.number().int().min(1).max(100),
  baseTrainingGain: z.number().int().min(1).max(10),
  prerequisites: z.array(z.object({ skillId: z.string().regex(/^skill\./), minProficiency: z.number().int().min(0).max(100) })).default([]),
});

export type Skill = z.infer<typeof SkillSchema>;

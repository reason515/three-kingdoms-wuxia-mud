import { z } from 'zod';

export const QuestStepSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().min(5).max(200),
  type: z.enum(['talk', 'goto', 'kill']),
  target: z.string(),
});

export const QuestSchema = z.object({
  id: z.string().regex(/^quest\.[a-z][a-z0-9_]*$/, 'Quest ID must use quest.<lowercase_name>'),
  name: z.string().min(2).max(40),
  type: z.enum(['guide', 'main', 'bounty', 'daily']),
  steps: z.array(QuestStepSchema).min(1).max(20),
  rewards: z.object({ skillProficiency: z.record(z.number().int().min(0)).optional() }).default({}),
});

export type Quest = z.infer<typeof QuestSchema>;
export type QuestStep = z.infer<typeof QuestStepSchema>;

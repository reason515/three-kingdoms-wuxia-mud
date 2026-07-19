import { z } from 'zod';

export const NpcSchema = z.object({
  id: z.string().regex(/^npc\.[a-z][a-z0-9_]*$/, 'NPC ID must use npc.<lowercase_name>'),
  name: z.string().min(2).max(20),
  role: z.string().min(2).max(30),
  location: z.string().regex(/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*)+$/),
});

export type Npc = z.infer<typeof NpcSchema>;

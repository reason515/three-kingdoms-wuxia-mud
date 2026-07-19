import { z } from 'zod';

export const RoomSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*)+$/, 'ID must be lowercase dotted notation'),
  name: z.string().min(2).max(40),
  description: z.string().min(20).max(1_000),
  exits: z.record(z.enum(['north', 'south', 'east', 'west', 'up', 'down']), z.string()).default({}),
  npcs: z.array(z.string().regex(/^npc\./)).default([]),
  features: z.array(z.enum(['safe', 'training_post'])).default([]),
});

export type Room = z.infer<typeof RoomSchema>;

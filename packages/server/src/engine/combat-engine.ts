import { and, eq } from 'drizzle-orm';

import type { GameDatabase } from '../db/client.js';
import { characterSkills, characters as charactersTable, innateAttrs } from '../db/schema.js';
import type { ITickable } from '../tick.js';
import { processCombatRound, startCombat as createCombat, type CombatState, type EnemyTemplate } from './combat.js';
import type { SkillProgress } from './training.js';

export type CombatSnapshot = { state: CombatState; proficiency: SkillProgress[] };

const enemyPool = new Map<string, EnemyTemplate>([
  ['mob.street_thug', { id: 'mob.street_thug', name: '街头闲汉', hp: 30, atk: 10, def: 5 }],
]);

export class CombatEngine implements ITickable {
  private readonly combats = new Map<string, CombatState>();
  private readonly listeners = new Map<string, Set<(state: CombatState) => void>>();
  private tickCounter = 0;

  constructor(private readonly db: GameDatabase) {}

  onCombatEvent(characterId: string, callback: (state: CombatState) => void): () => void {
    const set = this.listeners.get(characterId) ?? new Set();
    set.add(callback);
    this.listeners.set(characterId, set);
    return () => set.delete(callback);
  }

  async start(characterId: string, enemyId: string): Promise<CombatSnapshot> {
    if (this.combats.has(characterId)) throw new Error('你已在战斗中。');
    const enemy = enemyPool.get(enemyId);
    if (!enemy) throw new Error('此敌不见踪影。');
    const char = await this.db.select().from(charactersTable).where(eq(charactersTable.id, characterId)).get();
    const attrs = await this.db.select().from(innateAttrs).where(eq(innateAttrs.characterId, characterId)).get();
    if (!char || !attrs) throw new Error('角色不存在。');
    const maxHp = 80 + attrs.constitution * 2;
    const state = createCombat(characterId, enemy, maxHp);
    this.combats.set(characterId, state);
    const proficiency = await this.db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId));
    const snapshot: CombatSnapshot = { state, proficiency: proficiency.map((row) => ({ skillId: row.skillId, name: row.skillId, proficiency: row.proficiency })) };
    return snapshot;
  }

  status(characterId: string): CombatState | undefined {
    return this.combats.get(characterId);
  }

  async flee(characterId: string): Promise<void> {
    const state = this.combats.get(characterId);
    if (state && !state.result) {
      state.result = 'defeat';
      state.log.push({ round: state.round, type: 'result', attacker: 'player', damage: 0, message: '你仓皇逃出了战斗。' });
      this.combats.delete(characterId);
      this.notify(characterId, state);
    }
  }

  async onTick(): Promise<void> {
    this.tickCounter += 1;
    if (this.tickCounter % 2 !== 0) return;

    for (const [characterId, state] of this.combats) {
      if (state.result) { this.combats.delete(characterId); continue; }
      const char = await this.db.select().from(charactersTable).where(eq(charactersTable.id, characterId)).get();
      const skillRow = await this.db.select().from(characterSkills).where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillId, 'skill.basic_breathing'))).get();
      if (!char) { this.combats.delete(characterId); continue; }
      const attrs = await this.db.select().from(innateAttrs).where(eq(innateAttrs.characterId, characterId)).get();
      const str = attrs?.strength ?? 15;
      processCombatRound(state, str, skillRow?.proficiency ?? 0);
      if (state.result) this.combats.delete(characterId);
      this.notify(characterId, state);
    }
  }

  private notify(characterId: string, state: CombatState): void {
    this.listeners.get(characterId)?.forEach((callback) => callback(state));
  }
}

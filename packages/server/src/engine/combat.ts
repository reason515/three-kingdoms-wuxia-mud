export type EnemyTemplate = { id: string; name: string; hp: number; atk: number; def: number };

export type CombatState = {
  characterId: string;
  enemy: EnemyTemplate;
  enemyHp: number;
  playerHp: number;
  playerMaxHp: number;
  round: number;
  log: CombatLogEntry[];
  result?: 'victory' | 'defeat';
};

export type CombatLogEntry = { round: number; type: 'attack' | 'result'; attacker: 'player' | 'enemy'; damage: number; message: string };

function baseEnemyAtk(enemy: EnemyTemplate): number {
  return Math.max(1, Math.floor(enemy.atk * (0.8 + Math.random() * 0.4)));
}

export function calculateDamage(
  baseAtk: number,
  strength: number,
  skillProficiency: number,
  targetDef: number,
  constitution: number,
): number {
  const damage = baseAtk * (1 + strength / 100) * (1 + skillProficiency / 200) - targetDef * (1 + constitution / 100);
  return Math.max(1, Math.floor(damage));
}

export function startCombat(characterId: string, enemy: EnemyTemplate, playerMaxHp: number): CombatState {
  return {
    characterId,
    enemy,
    enemyHp: enemy.hp,
    playerHp: playerMaxHp,
    playerMaxHp,
    round: 0,
    log: [{ round: 0, type: 'result', attacker: 'player', damage: 0, message: `你向${enemy.name}发起挑战。` }],
  };
}

export function processCombatRound(
  state: CombatState,
  strength: number,
  skillProficiency: number,
): CombatState | null {
  if (state.result) return null;
  state.round += 1;
  const round = state.round;

  const playerDamage = calculateDamage(8, strength, skillProficiency, state.enemy.def, 10);
  state.enemyHp = Math.max(0, state.enemyHp - playerDamage);
  state.log.push({ round, type: 'attack', attacker: 'player', damage: playerDamage, message: `你造成 ${playerDamage} 点伤害。` });

  if (state.enemyHp <= 0) {
    state.result = 'victory';
    state.log.push({ round, type: 'result', attacker: 'player', damage: 0, message: `你击败了${state.enemy.name}。` });
    return state;
  }

  const enemyDamage = calculateDamage(baseEnemyAtk(state.enemy), 15, 0, 5, 10);
  state.playerHp = Math.max(0, state.playerHp - enemyDamage);
  state.log.push({ round, type: 'attack', attacker: 'enemy', damage: enemyDamage, message: `${state.enemy.name} 对你造成 ${enemyDamage} 点伤害。` });
  if (state.playerHp <= 0) {
    state.result = 'defeat';
    state.log.push({ round, type: 'result', attacker: 'enemy', damage: 0, message: '你倒在了血泊中……' });
  }
  return state;
}

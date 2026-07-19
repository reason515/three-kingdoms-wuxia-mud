import { skillNames, useGame } from '../context/GameContext';

export function ActionBar() {
  const { training, combat, beginTraining, endTraining, beginCombat, flee, dismissCombat } = useGame();

  // Combat state
  if (combat && !combat.result) {
    return (
      <section className="action-bar" data-testid="combat-view">
        <div className="combat-bars">
          <div><span data-testid="player-hp">{combat.playerHp}/{combat.playerMaxHp}</span></div>
          <div><strong>{combat.enemy.name}</strong><span data-testid="enemy-hp">{combat.enemyHp}/{combat.enemy.hp}</span></div>
        </div>
        <ul className="battle-log" data-testid="battle-log">{combat.log.slice(-3).map((entry, index) => <li key={index} data-testid="battle-log-entry">{entry.message}</li>)}</ul>
        <button type="button" className="secondary" data-testid="combat-flee" onClick={() => void flee()}>撤退</button>
      </section>
    );
  }

  if (combat?.result) {
    return (
      <section className="action-bar" data-testid="combat-view">
        <div className="combat-bars">
          <div><span data-testid="player-hp">{combat.playerHp}/{combat.playerMaxHp}</span></div>
          <div><strong>{combat.enemy.name}</strong><span data-testid="enemy-hp">{combat.enemyHp}/{combat.enemy.hp}</span></div>
        </div>
        <p className="chapter">战斗 · {combat.result === 'victory' ? '胜' : '败'}</p>
        <button type="button" data-testid="combat-dismiss" onClick={dismissCombat}>合上战报</button>
      </section>
    );
  }

  // Training state
  if (training?.active) {
    return (
      <section className="action-bar" data-testid="training-panel">
        <p className="chapter">在线挂机</p>
        {training.skills.map((s) => <div key={s.skillId}><strong>{skillNames[s.skillId] ?? s.skillId}</strong><span data-testid={`skill-${s.skillId}`}>熟练度 {s.proficiency}/100</span></div>)}
        <p data-testid="train-status">在线修炼中 · {skillNames[training.active.skillId] ?? training.active.skillId}</p>
        <button type="button" className="secondary" data-testid="train-stop" onClick={() => void endTraining()}>收功</button>
      </section>
    );
  }

  // Idle actions
  return (
    <section className="action-bar" data-testid="training-panel">
      <p className="chapter">在线挂机</p>
      {training?.skills.map((s) => <div key={s.skillId}><strong>{skillNames[s.skillId] ?? s.skillId}</strong><span data-testid={`skill-${s.skillId}`}>熟练度 {s.proficiency}/100</span></div>)}
      <p data-testid="train-status">{training?.active ? `在线修炼中 · ${skillNames[training.active.skillId] ?? training.active.skillId}` : '静候修炼'}</p>
      <button type="button" data-testid="train-start" onClick={() => void beginTraining('skill.basic_breathing')}>打坐吐纳</button>
      <button type="button" className="secondary" data-testid="train-sword" onClick={() => void beginTraining('skill.basic_sword')}>练剑</button>
      <button type="button" className="secondary" data-testid="train-blade" onClick={() => void beginTraining('skill.basic_blade')}>练刀</button>
      <button type="button" className="secondary" data-testid="btn-attack" onClick={() => void beginCombat()}>寻衅街头闲汉</button>
    </section>
  );
}

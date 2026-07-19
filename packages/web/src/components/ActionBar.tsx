import { useGame } from '../context/GameContext';

export function ActionBar() {
  const { combat, beginCombat, flee, dismissCombat } = useGame();

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

  return (
    <section className="action-bar">
      <button type="button" className="secondary" data-testid="btn-attack" onClick={() => void beginCombat()}>寻衅街头闲汉</button>
    </section>
  );
}

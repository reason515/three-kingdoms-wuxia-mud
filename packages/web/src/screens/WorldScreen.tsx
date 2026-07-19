import { attributeLabels, skillNames, useGame } from '../context/GameContext';

export function WorldScreen() {
  const { character, connection, room, training, combat, quests, look, move, talkToNpc, beginTraining, endTraining, beginCombat, flee, dismissCombat } = useGame();

  return (
    <>
      {connection !== 'connected' && <p className="connection-lost" data-testid="connection-lost">缆绳暂松，正在循着来路重返长安……</p>}

      <section className="arrival-card" data-testid="character-summary">
        <p className="chapter">长安 · 客店</p>
        <h2 data-testid="character-name">{character?.name}</h2>
        <p>你在客店的灯火下醒来。行囊尚轻，城中的风声却已传至檐下。</p>
        <dl className="attributes">{attributeLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{character?.attributes[key]}</dd></div>)}</dl>
        <span className="location" data-testid="character-location">{room?.name ?? '长安客店'}</span>
        <div className="vitals" data-testid="vitals"><span data-testid="vital-stamina">体力 {training?.stamina ?? 100}/{training?.maxStamina ?? 100}</span></div>

        {combat && (
          <section className="combat-view" data-testid="combat-view">
            <p className="chapter">战斗 · {combat.result ? (combat.result === 'victory' ? '胜' : '败') : `第 ${combat.round} 回合`}</p>
            <div className="combat-bars">
              <div><span data-testid="player-hp">{combat.playerHp}/{combat.playerMaxHp}</span></div>
              <div><strong>{combat.enemy.name}</strong><span data-testid="enemy-hp">{combat.enemyHp}/{combat.enemy.hp}</span></div>
            </div>
            <ul className="battle-log" data-testid="battle-log">{combat.log.slice(-5).map((entry, index) => <li key={index} data-testid="battle-log-entry">{entry.message}</li>)}</ul>
            {!combat.result && <button type="button" className="secondary" data-testid="combat-flee" onClick={() => void flee()}>撤退</button>}
            {combat.result && <button type="button" data-testid="combat-dismiss" onClick={dismissCombat}>合上战报</button>}
          </section>
        )}

        {quests.filter((q) => !q.completed).map((quest) => (
          <section key={quest.questId} className="quest-log" data-testid="quest-log">
            <div className="quest-step"><p className="chapter">任务 · {quest.questName}</p><p data-testid="quest-step">{quest.stepDescription}  ({quest.stepIndex + 1}/{quest.stepCount})</p></div>
          </section>
        ))}

        {!combat && (
          <button type="button" className="secondary" data-testid="btn-attack" onClick={() => void beginCombat()}>寻衅街头闲汉</button>
        )}

        {training?.offlineSettled && training.offlineSettled.gain > 0 && <div className="offline-notice" data-testid="offline-settled">离线 {training.offlineSettled.hours} 小时，吐纳增益 +{training.offlineSettled.gain}</div>}

        <section className="training-panel" data-testid="training-panel">
          <p className="chapter">在线挂机</p>
          {['skill.basic_breathing', 'skill.basic_sword', 'skill.basic_blade'].map((skillId) => {
            const skill = training?.skills.find((s) => s.skillId === skillId);
            if (!skill) return null;
            const name = skillNames[skillId] ?? skillId;
            return <div key={skillId}><strong>{name}</strong><span data-testid={`skill-${skillId}`}>熟练度 {skill.proficiency}/100</span></div>;
          })}
          <p data-testid="train-status">{training?.active ? `在线修炼中 · ${skillNames[training.active.skillId] ?? training.active.skillId}` : '静候修炼'}</p>
          {training?.active ? <button type="button" className="secondary" data-testid="train-stop" onClick={() => void endTraining()}>收功</button> : <>
            <button type="button" data-testid="train-start" onClick={() => void beginTraining('skill.basic_breathing')}>打坐吐纳</button>
            <button type="button" className="secondary" data-testid="train-sword" onClick={() => void beginTraining('skill.basic_sword')}>练剑</button>
            <button type="button" className="secondary" data-testid="train-blade" onClick={() => void beginTraining('skill.basic_blade')}>练刀</button>
          </>}
        </section>

        {room && (
          <section className="room-view" data-testid="room-view">
            <div className="room-heading"><p className="chapter">环顾</p><button type="button" className="look-button" data-testid="btn-look" onClick={look}>再看一眼</button></div>
            <h3 data-testid="room-title">{room.name}</h3>
            <p data-testid="room-desc">{room.description}</p>
            {room.npcs.length > 0 && <ul className="npc-list" data-testid="npc-list">{room.npcs.map((npc) => <li data-testid={`npc-${npc.id}`} key={npc.id}><strong>{npc.name}</strong><span>{npc.role}</span><button type="button" className="npc-talk" data-testid={`talk-${npc.id}`} onClick={() => void talkToNpc(npc.id)}>交谈</button></li>)}</ul>}
            <div className="exits" data-testid="exits">{Object.entries(room.exits).length ? Object.entries(room.exits).map(([direction]) => <button type="button" className="exit-button" data-testid={`exit-${direction}`} onClick={() => move(direction)} key={direction}>往{({ north: '北', south: '南', east: '东', west: '西', up: '上', down: '下' } as Record<string, string>)[direction]}</button>) : '此处暂无可通行的出口。'}</div>
          </section>
        )}
      </section>
    </>
  );
}

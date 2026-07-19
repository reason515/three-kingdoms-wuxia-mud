import { attributeLabels, skillNames, useGame } from '../context/GameContext';
import { ActionBar } from '../components/ActionBar';
import { DirectionBar } from '../components/DirectionBar';

export function WorldScreen() {
  const { character, connection, room, training, quests, look, move, talkToNpc } = useGame();

  return (
    <>
      {connection !== 'connected' && <p className="connection-lost" data-testid="connection-lost">缆绳暂松，正在循着来路重返长安……</p>}

      <section className="arrival-card">
        {training?.offlineSettled && training.offlineSettled.gain > 0 && <div className="offline-notice" data-testid="offline-settled">离线 {training.offlineSettled.hours} 小时，吐纳增益 +{training.offlineSettled.gain}</div>}

        {quests.filter((q) => !q.completed).map((quest) => (
          <section key={quest.questId} className="quest-log" data-testid="quest-log">
            <div className="quest-step"><p className="chapter">任务 · {quest.questName}</p><p data-testid="quest-step">{quest.stepDescription}  ({quest.stepIndex + 1}/{quest.stepCount})</p></div>
          </section>
        ))}

        {room && (
          <section className="room-view" data-testid="room-view">
            <h3 data-testid="room-title">{room.name}</h3>
            <p data-testid="room-desc">{room.description}</p>
            {room.npcs.length > 0 && (
              <ul className="npc-list" data-testid="npc-list">{room.npcs.map((npc) => (
                <li data-testid={`npc-${npc.id}`} key={npc.id}>
                  <button type="button" className="npc-talk" data-testid={`talk-${npc.id}`} onClick={() => void talkToNpc(npc.id)}>{npc.name}<span>{npc.role}</span></button>
                </li>
              ))}</ul>
            )}
          </section>
        )}

        <ActionBar />
        <DirectionBar />
      </section>
    </>
  );
}

import { useGame } from '../context/GameContext';

export function QuestScreen() {
  const { quests } = useGame();

  return (
    <section className="arrival-card">
      <p className="chapter">任务</p>
      {quests.length === 0 ? <p>暂无任务。四处走动或找人攀谈，江湖自有需要你做的事。</p> : quests.map((quest) => (
        <div key={quest.questId} className="quest-step" style={{ marginTop: 14, padding: 12, border: '1px solid var(--line)' }}>
          <p className="chapter">{quest.completed ? '✅' : '◈'} {quest.questName}</p>
          <p>{quest.stepDescription} ({quest.stepIndex + 1}/{quest.stepCount})</p>
        </div>
      ))}
    </section>
  );
}

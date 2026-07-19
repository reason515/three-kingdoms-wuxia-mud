import { useGame } from '../context/GameContext';

export function QuestScreen() {
  const { quests } = useGame();
  const active = quests.filter((q) => !q.completed);
  const completed = quests.filter((q) => q.completed);

  return (
    <section className="character-sheet">
      {active.length === 0 && completed.length === 0 && (
        <div className="panel">
          <p className="chapter">暂无任务</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.8 }}>
            四处走动或找人攀谈，江湖自有需要你做的事。
          </p>
        </div>
      )}

      {active.length > 0 && (
        <div className="panel">
          <p className="chapter">进行中</p>
          {active.map((quest) => (
            <div key={quest.questId} className="quest-card">
              <p className="quest-name">◈ {quest.questName}</p>
              <p className="quest-step-desc">{quest.stepDescription}</p>
              <div className="quest-progress-bar">
                <div className="quest-progress-fill" style={{ width: `${((quest.stepIndex + 1) / quest.stepCount) * 100}%` }} />
              </div>
              <span className="quest-counter">步骤 {quest.stepIndex + 1}/{quest.stepCount}</span>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="panel">
          <p className="chapter">已完成</p>
          {completed.map((quest) => (
            <div key={quest.questId} className="quest-card completed">
              <p className="quest-name">✅ {quest.questName}</p>
              <p className="quest-step-desc">任务已全部完成。</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

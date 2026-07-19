import { attributeLabels, skillNames, useGame } from '../context/GameContext';

export function CharacterScreen() {
  const { character, room, training, beginTraining, endTraining } = useGame();
  if (!character) return null;

  return (
    <section className="character-sheet">
      <div className="char-header">
        <h2 data-testid="character-name">{character.name}</h2>
        <span className="location" data-testid="character-location">{room?.name ?? '长安客店'}</span>
      </div>

      <div className="vitals" data-testid="vitals">
        <span data-testid="vital-stamina">体力 {training?.stamina ?? 100}/{training?.maxStamina ?? 100}</span>
      </div>

      {training?.offlineSettled && training.offlineSettled.gain > 0 && <div className="offline-notice" data-testid="offline-settled">离线 {training.offlineSettled.hours} 小时，吐纳增益 +{training.offlineSettled.gain}</div>}
      <section className="panel training-panel" data-testid="training-panel">
        <p className="chapter">修炼</p>
        {training?.active ? (
          <>
            <p data-testid="train-status">在线修炼中 · {skillNames[training.active.skillId] ?? training.active.skillId}</p>
            <button type="button" className="secondary" data-testid="train-stop" onClick={() => void endTraining()}>收功</button>
          </>
        ) : (
          <>
            <p data-testid="train-status">静候修炼</p>
            <div className="form-actions">
              <button type="button" data-testid="train-start" onClick={() => void beginTraining('skill.basic_breathing')}>打坐吐纳</button>
              <button type="button" className="secondary" data-testid="train-sword" onClick={() => void beginTraining('skill.basic_sword')}>练剑</button>
              <button type="button" className="secondary" data-testid="train-blade" onClick={() => void beginTraining('skill.basic_blade')}>练刀</button>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <p className="chapter">先天禀赋</p>
        <dl className="attributes">{attributeLabels.map(([key, label]) => (
          <div key={key}><dt>{label}</dt><dd data-testid={`attr-${key}`}>{character.attributes[key]}</dd></div>
        ))}</dl>
      </section>

      <section className="panel">
        <p className="chapter">武学修为</p>
        {training?.skills.length ? training.skills.map((skill) => (
          <div key={skill.skillId} className="skill-row">
            <div className="skill-head">
              <strong>{skillNames[skill.skillId] ?? skill.skillId}</strong>
              <span data-testid={`skill-${skill.skillId}`}>熟练度 {skill.proficiency}/100</span>
            </div>
            <div className="skill-bar"><div className="skill-fill" style={{ width: `${skill.proficiency}%` }} /></div>
          </div>
        )) : <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>尚未习武。开始修炼即可入门。</p>}
      </section>
    </section>
  );
}

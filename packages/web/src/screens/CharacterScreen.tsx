import { attributeLabels, skillNames, useGame } from '../context/GameContext';

export function CharacterScreen() {
  const { character, room, training } = useGame();
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
              <span>{skill.proficiency}/100</span>
            </div>
            <div className="skill-bar"><div className="skill-fill" style={{ width: `${skill.proficiency}%` }} /></div>
          </div>
        )) : <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>尚未习武。在江湖 Tab 开始打坐即可入门吐纳。</p>}
      </section>
    </section>
  );
}

import { attributeLabels, skillNames, useGame } from '../context/GameContext';

export function CharacterScreen() {
  const { character, training } = useGame();

  if (!character) return null;

  return (
    <section className="arrival-card">
      <p className="chapter">角色</p>
      <h2>{character.name}</h2>
      <dl className="attributes">{attributeLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{character.attributes[key]}</dd></div>)}</dl>
      <div className="vitals" data-testid="vitals"><span data-testid="vital-stamina">体力 {training?.stamina ?? 100}/{training?.maxStamina ?? 100}</span></div>
      <section className="training-panel">
        <p className="chapter">武学</p>
        {training?.skills.map((skill) => (
          <div key={skill.skillId}><strong>{skillNames[skill.skillId] ?? skill.skillId}</strong><span>熟练度 {skill.proficiency}/100</span></div>
        ))}
      </section>
    </section>
  );
}

import { FormEvent, useEffect, useState } from 'react';

import { acceptQuest, combatStatus, createCharacter, fleeCombat, questsProgress, register, reportQuestAction, roll, signIn, startCombat, startTraining, stopTraining, trainingProgress, type Attributes, type Character, type CombatSnapshot, type QuestProgress, type TrainingProgress } from './lib/game-api';
import { useGameSocket, connectionLabel } from './hooks/use-game-socket';
import { healthLabel, type HealthState } from './lib/health';

type Stage = 'arrival' | 'create' | 'world';
const attributeLabels: Array<[keyof Attributes, string]> = [
  ['strength', '臂力'],
  ['intelligence', '悟性'],
  ['dexterity', '身法'],
  ['constitution', '根骨'],
];

export function App() {
  const [health, setHealth] = useState<HealthState>('checking');
  const [stage, setStage] = useState<Stage>('arrival');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [playerId, setPlayerId] = useState<string>();
  const [characterName, setCharacterName] = useState('');
  const [attributes, setAttributes] = useState<Attributes>();
  const [character, setCharacter] = useState<Character>();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [training, setTraining] = useState<TrainingProgress>();
  const [combat, setCombat] = useState<CombatSnapshot['state'] | null>();
  const [quests, setQuests] = useState<QuestProgress[]>([]);
  const { state: connection, room, look, move } = useGameSocket(stage === 'world' && Boolean(character), username, password);

  useEffect(() => {
    const controller = new AbortController();
    fetch('http://127.0.0.1:3001/health', { signal: controller.signal })
      .then((response) => (response.ok ? setHealth('online') : setHealth('offline')))
      .catch(() => setHealth('offline'));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!character || stage !== 'world') return;
    let live = true;
    let questAccepted = false;
    const refresh = async () => {
      const [progress, combatResult, questResult] = await Promise.all([trainingProgress(character.id).catch(() => undefined), combatStatus(character.id), questsProgress(character.id)]);
      if (!live) return;
      setTraining(progress);
      setCombat(combatResult?.combat ?? null);
      const quests = questResult?.quests ?? [];
      if (quests.length === 0 && !questAccepted) {
        questAccepted = true;
        await acceptQuest(character.id, 'quest.newbie_guide').catch(() => undefined);
        const retry = await questsProgress(character.id);
        setQuests(retry.quests);
      } else {
        setQuests(quests);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 1_000);
    return () => { live = false; window.clearInterval(timer); };
  }, [character, stage]);

  async function beginTraining(skillId: string) {
    if (!character) return;
    await startTraining(character.id, skillId);
    setTraining(await trainingProgress(character.id));
  }

  async function endTraining() {
    if (!character) return;
    await stopTraining(character.id);
    setTraining(await trainingProgress(character.id));
  }

  async function beginCombat() {
    if (!character) return;
    await startCombat(character.id, 'mob.street_thug');
    const result = await combatStatus(character.id);
    setCombat(result?.combat ?? null);
  }

  async function talkToNpc(npcId: string) {
    if (!character) return;
    const result = await reportQuestAction(character.id, 'talk', npcId);
    if (result?.result?.message) setNotice(result.result.message);
    setQuests((await questsProgress(character.id)).quests);
  }

  async function flee() {
    if (!character) return;
    await fleeCombat(character.id);
    setCombat(null);
  }

  useEffect(() => {
    if (stage === 'world' && training?.active && connection !== 'connected') void endTraining();
  }, [connection, stage, training?.active]);

  useEffect(() => {
    if (!character || !room) return;
    reportQuestAction(character.id, 'goto', room.id).then(() => undefined).catch(() => undefined);
  }, [character, room?.id]);

  useEffect(() => {
    if (!character || combat?.result !== 'victory') return;
    reportQuestAction(character.id, 'kill', combat.enemy.id).then(() => undefined).catch(() => undefined);
  }, [character, combat?.result, combat?.enemy.id]);

  async function submitRegistration(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      setPlayerId(await register(username, password));
      setStage('create');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '文牒登记失败。');
    } finally {
      setBusy(false);
    }
  }

  async function submitLogin() {
    setBusy(true);
    setNotice('');
    try {
      const existing = await signIn(username, password);
      if (!existing) {
        setNotice('此账号尚无角色，请先掷定先天禀赋。');
        return;
      }
      setCharacter(existing);
      setStage('world');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '未能寻回旧日行囊。');
    } finally {
      setBusy(false);
    }
  }

  async function rollAttributes() {
    setBusy(true);
    setNotice('');
    try {
      setAttributes(await roll());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '骰子落地无声。');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCharacter(event: FormEvent) {
    event.preventDefault();
    if (!playerId || !attributes) return;
    setBusy(true);
    setNotice('');
    try {
      const created = await createCharacter(playerId, characterName, attributes);
      setCharacter(created);
      setStage('world');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '名册未能落笔。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell" data-testid="app-shell">
      <header className="masthead">
        <span className="seal" aria-hidden="true">汉末</span>
        <p className="eyebrow">初平元年 · 长安纪</p>
        <h1>汉末江湖录</h1>
        <p className="subtitle">一纸名帖，入此风尘</p>
      </header>

      <section className="notice" aria-live="polite">
        <div className={`status ${health}`} data-testid="service-status">
          <span className="status-dot" />{healthLabel(health)}
        </div>
        <div className={`status connection ${connection}`} data-testid="connection-status">
          <span className="status-dot" />{connectionLabel(connection)}
        </div>
        {stage === 'world' && connection !== 'connected' && <p className="connection-lost" data-testid="connection-lost">缆绳暂松，正在循着来路重返长安……</p>}
        {stage === 'arrival' && (
          <form className="paper-form" onSubmit={submitRegistration} data-testid="account-form">
            <p className="chapter">投帖入城</p>
            <h2>先留下一个称呼。</h2>
            <label>江湖账号<input data-testid="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="hanmo_wanderer" required /></label>
            <label>口令<input data-testid="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} required /></label>
            <div className="form-actions">
              <button type="submit" data-testid="register-btn" disabled={busy}>登记名帖</button>
              <button type="button" className="secondary" data-testid="login-btn" onClick={submitLogin} disabled={busy}>寻回旧卷</button>
            </div>
          </form>
        )}
        {stage === 'create' && (
          <form className="paper-form" onSubmit={confirmCharacter} data-testid="character-form">
            <p className="chapter">定名 · 掷骰</p>
            <h2>命数既开，请为自己落笔。</h2>
            <label>角色名<input data-testid="char-name" value={characterName} onChange={(event) => setCharacterName(event.target.value)} placeholder="杜缄" required /></label>
            <button type="button" className="secondary" data-testid="roll-attr" onClick={rollAttributes} disabled={busy}>掷定先天属性</button>
            {attributes && <dl className="attributes" data-testid="attributes">{attributeLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd data-testid={`attr-${key}`}>{attributes[key]}</dd></div>)}</dl>}
            <button type="submit" data-testid="confirm-create" disabled={busy || !attributes}>入驻长安客店</button>
          </form>
        )}
        {stage === 'world' && character && (
          <section className="arrival-card" data-testid="character-summary">
            <p className="chapter">长安 · 客店</p>
            <h2 data-testid="character-name">{character.name}</h2>
            <p>你在客店的灯火下醒来。行囊尚轻，城中的风声却已传至檐下。</p>
            <dl className="attributes">{attributeLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{character.attributes[key]}</dd></div>)}</dl>
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
                {combat.result && <button type="button" data-testid="combat-dismiss" onClick={() => setCombat(null)}>合上战报</button>}
              </section>
            )}
            {quests.length > 0 && (
              <section className="quest-log" data-testid="quest-log">{quests.filter((quest) => !quest.completed).map((quest) => <div key={quest.questId} className="quest-step"><p className="chapter">任务 · {quest.questName}</p><p data-testid="quest-step">{quest.stepDescription}  ({quest.stepIndex + 1}/{quest.stepCount})</p></div>)}</section>
            )}
            {!combat && (
              <button type="button" className="secondary" data-testid="btn-attack" onClick={() => void beginCombat()}>寻衅街头闲汉</button>
            )}
            {training?.offlineSettled && training.offlineSettled.gain > 0 && <div className="offline-notice" data-testid="offline-settled">离线 {training.offlineSettled.hours} 小时，吐纳增益 +{training.offlineSettled.gain}</div>}
            <section className="training-panel" data-testid="training-panel">
              <p className="chapter">在线挂机</p>
              {['skill.basic_breathing', 'skill.basic_sword', 'skill.basic_blade'].map((skillId) => {
                const skill = training?.skills.find((skill) => skill.skillId === skillId);
                const name = { 'skill.basic_breathing': '基础吐纳', 'skill.basic_sword': '基础剑法', 'skill.basic_blade': '基础刀法' }[skillId] ?? skillId;
                if (!skill) return null;
                return <div key={skillId}><strong>{name}</strong><span data-testid={`skill-${skillId}`}>熟练度 {skill.proficiency}/100</span></div>;
              })}
              <p data-testid="train-status">{training?.active ? `在线修炼中 · ${({ 'skill.basic_breathing': '基础吐纳', 'skill.basic_sword': '基础剑法', 'skill.basic_blade': '基础刀法' } as Record<string, string>)[training.active.skillId] ?? training.active.skillId}` : '静候修炼'}</p>
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
        )}
        {notice && <p className="form-notice" data-testid="form-notice">{notice}</p>}
      </section>
    </main>
  );
}

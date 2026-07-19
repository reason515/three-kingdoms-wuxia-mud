import { useEffect, useState } from 'react';

import { GameProvider, useGame } from './context/GameContext';
import { WorldScreen } from './screens/WorldScreen';
import { CharacterScreen } from './screens/CharacterScreen';
import { QuestScreen } from './screens/QuestScreen';
import { connectionLabel } from './hooks/use-game-socket';
import { healthLabel, type HealthState } from './lib/health';
import { attributeLabels } from './context/GameContext';
import './styles/ink-wash.css';

export function App() {
  const [health, setHealth] = useState<HealthState>('checking');

  useEffect(() => {
    fetch('http://127.0.0.1:3001/health')
      .then((r) => (r.ok ? setHealth('online') : setHealth('offline')))
      .catch(() => setHealth('offline'));
  });

  return (
    <GameProvider>
      <Layout health={health} />
    </GameProvider>
  );
}

function Layout({ health }: { health: HealthState }) {
  const { stage, connection, notice } = useGame();

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
        {stage === 'world' && <div className={`status connection ${connection}`} data-testid="connection-status"><span className="status-dot" />{connectionLabel(connection)}</div>}
        {stage === 'arrival' && <ArrivalForm />}
        {stage === 'create' && <CreateForm />}
        {stage === 'world' && <WorldTabs />}
        {notice && <p className="form-notice" data-testid="form-notice">{notice}</p>}
      </section>
    </main>
  );
}

function ArrivalForm() {
  const { username, setUsername, password, setPassword, busy, submitRegistration, submitLogin } = useGame();
  return (
    <form className="paper-form" onSubmit={submitRegistration} data-testid="account-form">
      <p className="chapter">投帖入城</p>
      <h2>先留下一个称呼。</h2>
      <label>江湖账号<input data-testid="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="hanmo_wanderer" required /></label>
      <label>口令<input data-testid="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" minLength={8} required /></label>
      <div className="form-actions">
        <button type="submit" data-testid="register-btn" disabled={busy}>登记名帖</button>
        <button type="button" className="secondary" data-testid="login-btn" onClick={submitLogin} disabled={busy}>寻回旧卷</button>
      </div>
    </form>
  );
}

function CreateForm() {
  const { characterName, setCharacterName, attributes, busy, rollAttributes, confirmCharacter } = useGame();
  return (
    <form className="paper-form" onSubmit={confirmCharacter} data-testid="character-form">
      <p className="chapter">定名 · 掷骰</p>
      <h2>命数既开，请为自己落笔。</h2>
      <label>角色名<input data-testid="char-name" value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="杜缄" required /></label>
      <button type="button" className="secondary" data-testid="roll-attr" onClick={rollAttributes} disabled={busy}>掷定先天属性</button>
      {attributes && <dl className="attributes" data-testid="attributes">{attributeLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd data-testid={`attr-${key}`}>{attributes[key]}</dd></div>)}</dl>}
      <button type="submit" data-testid="confirm-create" disabled={busy || !attributes}>入驻长安客店</button>
    </form>
  );
}

function WorldTabs() {
  const [tab, setTab] = useState<'world' | 'character' | 'quests'>('world');
  return (
    <>
      <nav className="tab-nav">
        {(['world', 'character', 'quests'] as const).map((t) => (
          <button key={t} type="button" className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {{ world: '江湖', character: '角色', quests: '任务' }[t]}
          </button>
        ))}
      </nav>
      {tab === 'world' && <WorldScreen />}
      {tab === 'character' && <CharacterScreen />}
      {tab === 'quests' && <QuestScreen />}
    </>
  );
}

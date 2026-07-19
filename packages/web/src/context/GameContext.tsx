import { createContext, useContext, useEffect, useState, type FormEvent } from 'react';

import { acceptQuest, combatStatus, createCharacter, fleeCombat, questsProgress, register, reportQuestAction, roll, signIn, startCombat, startTraining, stopTraining, trainingProgress, type Attributes, type Character, type CombatSnapshot, type QuestProgress, type TrainingProgress } from '../lib/game-api';
import { useGameSocket, type ConnectionState, type RoomState } from '../hooks/use-game-socket';

export type { Attributes, Character, CombatSnapshot, ConnectionState, QuestProgress, RoomState, TrainingProgress };

export type Stage = 'arrival' | 'create' | 'world';

export const attributeLabels: Array<[keyof Attributes, string]> = [
  ['strength', '臂力'], ['intelligence', '悟性'], ['dexterity', '身法'], ['constitution', '根骨'],
];

export const skillNames: Record<string, string> = {
  'skill.basic_breathing': '基础吐纳', 'skill.basic_sword': '基础剑法', 'skill.basic_blade': '基础刀法',
};

interface GameContextValue {
  stage: Stage; setStage: (stage: Stage) => void;
  username: string; setUsername: (value: string) => void;
  password: string; setPassword: (value: string) => void;
  playerId: string | undefined; setPlayerId: (value: string | undefined) => void;
  characterName: string; setCharacterName: (value: string) => void;
  attributes: Attributes | undefined; setAttributes: (value: Attributes | undefined) => void;
  character: Character | undefined;
  notice: string; setNotice: (value: string) => void;
  busy: boolean;
  connection: ConnectionState;
  room: RoomState | undefined;
  training: TrainingProgress | undefined;
  combat: CombatSnapshot['state'] | null | undefined;
  quests: QuestProgress[];
  look: () => void;
  move: (direction: string) => void;
  talkToNpc: (npcId: string) => void;
  beginTraining: (skillId: string) => void;
  endTraining: () => void;
  beginCombat: () => void;
  flee: () => void;
  dismissCombat: () => void;
  submitRegistration: (event: FormEvent) => void;
  submitLogin: () => void;
  rollAttributes: () => void;
  confirmCharacter: (event: FormEvent) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
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

  // Health check
  useEffect(() => {
    fetch('http://127.0.0.1:3001/health').catch(() => undefined);
  }, []);

  // Polling
  useEffect(() => {
    if (!character || stage !== 'world') return;
    let live = true;
    let questAccepted = false;
    const refresh = async () => {
      const [progress, combatResult, questResult] = await Promise.all([trainingProgress(character.id).catch(() => undefined), combatStatus(character.id), questsProgress(character.id)]);
      if (!live) return;
      setTraining(progress);
      setCombat(combatResult?.combat ?? null);
      const q = questResult?.quests ?? [];
      if (q.length === 0 && !questAccepted) {
        questAccepted = true;
        await acceptQuest(character.id, 'quest.newbie_guide').catch(() => undefined);
        const retry = await questsProgress(character.id);
        setQuests(retry.quests);
      } else { setQuests(q); }
    };
    refresh();
    const timer = window.setInterval(refresh, 1_000);
    return () => { live = false; window.clearInterval(timer); };
  }, [character, stage]);

  // Auto-stop training on disconnect
  useEffect(() => {
    if (stage === 'world' && training?.active && connection !== 'connected') {
      stopTraining(String(character?.id)).catch(() => undefined).then(() =>
        trainingProgress(String(character?.id)).catch(() => undefined).then(setTraining)
      );
    }
  }, [connection, stage, training?.active]);

  // Auto-report goto
  useEffect(() => {
    if (!character || !room) return;
    reportQuestAction(character.id, 'goto', room.id).then((r) => {
      if (r?.result?.message) setNotice(r.result.message);
      return questsProgress(character.id);
    }).then((q) => setQuests(q.quests)).catch(() => undefined);
  }, [character, room?.id]);

  // Auto-report kill
  useEffect(() => {
    if (!character || combat?.result !== 'victory') return;
    reportQuestAction(character.id, 'kill', combat.enemy.id).then((r) => {
      if (r?.result?.message) setNotice(r.result.message);
      return questsProgress(character.id);
    }).then((q) => setQuests(q.quests)).catch(() => undefined);
  }, [character, combat?.result, combat?.enemy.id]);

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
    try {
      const result = await reportQuestAction(character.id, 'talk', npcId);
      if (result?.result?.message) setNotice(result.result.message);
      else setNotice(`${room?.npcs.find((n) => n.id === npcId)?.name ?? '此人'}没有更多话要对你说。`);
      setQuests((await questsProgress(character.id)).quests);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '交谈失败');
    }
  }

  async function flee() { if (!character) return; await fleeCombat(character.id); setCombat(null); }
  function dismissCombat() { setCombat(null); }

  async function submitRegistration(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setNotice('');
    try { setPlayerId(await register(username, password)); setStage('create'); }
    catch (error) { setNotice(error instanceof Error ? error.message : '文牒登记失败。'); }
    finally { setBusy(false); }
  }

  async function submitLogin() {
    setBusy(true); setNotice('');
    try {
      const existing = await signIn(username, password);
      if (!existing) { setNotice('此账号尚无角色，请先掷定先天禀赋。'); return; }
      setCharacter(existing); setStage('world');
    } catch (error) { setNotice(error instanceof Error ? error.message : '未能寻回旧日行囊。'); }
    finally { setBusy(false); }
  }

  async function rollAttributes() {
    setBusy(true); setNotice('');
    try { setAttributes(await roll()); } catch (error) { setNotice(error instanceof Error ? error.message : '骰子落地无声。'); }
    finally { setBusy(false); }
  }

  async function confirmCharacter(event: FormEvent) {
    event.preventDefault();
    if (!playerId || !attributes) return;
    setBusy(true); setNotice('');
    try { const created = await createCharacter(playerId, characterName, attributes); setCharacter(created); setStage('world'); }
    catch (error) { setNotice(error instanceof Error ? error.message : '名册未能落笔。'); }
    finally { setBusy(false); }
  }

  return (
    <GameContext.Provider value={{
      stage, setStage, username, setUsername, password, setPassword, playerId, setPlayerId,
      characterName, setCharacterName, attributes, setAttributes, character, notice, setNotice, busy,
      connection, room, training, combat, quests, look, move, talkToNpc,
      beginTraining, endTraining, beginCombat, flee, dismissCombat,
      submitRegistration, submitLogin, rollAttributes, confirmCharacter,
    }}>
      {children}
    </GameContext.Provider>
  );
}

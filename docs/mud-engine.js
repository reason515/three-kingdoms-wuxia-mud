/* 汉末江湖录 · bounded MUD exploration/combat layer */
'use strict';

const MUD_LOCATIONS={
  'location.changan.wang_yun_outer_alley':{name:'王允府外巷',desc:'高墙把府内灯火截成一线。持戟武吏轮番换岗，墙根留着车辙与匆忙擦去的血迹。',npcs:['赵衡','府门老卒'],exits:['location.changan.west_market_warehouse'],search:'墙角压着半截巡更木签，背面记着西市换岗的时辰。'},
  'location.changan.west_market_warehouse':{name:'西市废仓',desc:'烧焦的麻包堵住半扇仓门，梁上垂着断绳。这里适合伏击，也适合练习窄处进退。',npcs:['受伤脚夫'],exits:['location.changan.wang_yun_outer_alley','location.changan.old_residence','location.changan.military_family_lane'],search:'你从碎瓦下找到一包尚未受潮的粗布绷带。',enemy:{id:'looter',name:'趁乱劫掠者',hp:42,posture:3,exp:20,profile:'他右手持短刀，左手抓着装粮的布袋，退路在仓门外。'}},
  'location.changan.old_residence':{name:'王允府旧宅',desc:'旧宅窗纸尽失，竹简气味混着尘土。书架倾斜，却仍有人翻找过。',npcs:['许简'],exits:['location.changan.west_market_warehouse'],search:'一枚刮落的朱砂封泥粘在地砖缝里。'},
  'location.changan.military_family_lane':{name:'军属里巷',desc:'艾草与血腥气混在一起。被劈掉的籍贯木牌在沟边堆成一摞，院内不时传来伤者咳声。',npcs:['阿萝','阿禾','退养老卒'],exits:['location.changan.west_market_warehouse','location.changan.backyard','location.changan.ruined_temple'],search:'药渣里混着调息图诀所用的经络记号。',enemy:{id:'press_gang',name:'搜掠溃兵',hp:50,posture:4,exp:24,profile:'两名溃兵一前一后堵住巷口，前者持矛，后者正翻军属的包袱。'}},
  'location.changan.backyard':{name:'军属里巷后院',desc:'井台、木箱和一副拆开的札甲挤在狭小院中。担架横放时只余一人通行。',npcs:['烧伤老卒'],exits:['location.changan.military_family_lane','location.changan.near_camp_path'],search:'木箱夹层藏着两片可绑在前臂上的旧甲片。'},
  'location.changan.near_camp_path':{name:'军营小路',desc:'马蹄把泥地踏成深槽，路旁散着割断的缰绳。远处军哨时断时续。',npcs:['并州斥候'],exits:['location.changan.backyard','location.changan.bingzhou_camp'],search:'你辨出一组双环绳结：前环指路，后环示警。'},
  'location.changan.bingzhou_camp':{name:'并州军营',desc:'营火只点一半，甲士却全副披挂。每个人都在收拾行囊，又都说自己不会走。',npcs:['军司马','营中老卒'],exits:['location.changan.near_camp_path','location.changan.west_market_warehouse'],search:'兵器架后压着一页撤阵伤亡记录。'},
  'location.changan.ruined_temple':{name:'废寺偏殿',desc:'佛座后藏着旧剑匣，偏殿地面被伤兵铺满。断墙与门框都是试招的天然界线。',npcs:['退养老卒'],exits:['location.changan.military_family_lane','location.changan.temple_gate'],search:'佛座暗格里留有残谱被取放过的浅痕。'},
  'location.changan.temple_gate':{name:'废寺山门',desc:'石阶向下收成窄口，两侧断墙足以藏弩手。城门鼓声从西面传来。',npcs:['避难百姓'],exits:['location.changan.ruined_temple','location.changan.lane_exit'],search:'石阶边有新鲜靴印，重心都压向拔刀一侧。'},
  'location.changan.lane_exit':{name:'军属里巷出口',desc:'巷宽不足一丈，棚架横跨头顶。守住这里便能遮住身后整条退路。',npcs:[],exits:['location.changan.temple_gate','location.changan.west_gate'],search:'棚柱上的薄刃切口适合短剑借力。'},
  'location.changan.west_gate':{name:'长安西门',desc:'拒马把人潮切成数股，路引碎片挂在矛杆上。门外烟尘已遮住地平线。',npcs:['守门军卒','逃难军属'],exits:['location.changan.lane_exit','location.changan.gate_inner'],search:'一张被踩烂的路引仍能辨出王允府朱印。'},
  'location.changan.gate_inner':{name:'城门内侧',desc:'城砖在鼓声中落灰。这里没有真正安全的方向，只有先后关闭的门。',npcs:['败兵'],exits:['location.changan.west_gate'],search:'石阶裂缝里卡着半枚旧箭簇。'}
};
const MUD_TECHNIQUES={
  'mud.quick_draw':{name:'疾步出鞘',desc:'消耗1内息，在敌方蓄重击时抢先破势。'},
  'mud.wrist_cut':{name:'截腕',desc:'剑术熟练后可用，先破架势再造成伤害。'},
  'technique.du_jian.guard.crosscurrent':{name:'横剑截流',desc:'守住狭窄通道并保护身后目标。'},
  'technique.du_jian.roam.wall_step':{name:'踏墙换位',desc:'借墙改变位置，绕过正面封锁。'},
  'technique.ren_shuo.breaker.break_siege':{name:'破围',desc:'消耗内息正面打穿多人围堵。'},
  'technique.ren_shuo.protector.return_guard':{name:'回锋护列',desc:'放弃追击，护住撤退队列。'}
};
const ENEMY_INTENTS=[
  {id:'probe',name:'试探逼近',damage:7},
  {id:'guard',name:'收刀护身',damage:4},
  {id:'heavy',name:'蓄力重击',damage:15},
  {id:'rush',name:'抢步突刺',damage:10}
];
let mud=null;

function initMudSession(character,save=null){
  const du=character==='du_jian',meta=JSON.parse(localStorage.getItem(`mud_meta_${character}`)||'{"techniques":[]}');
  mud=save?deserializeMud(save):{
    character,level:1,exp:0,hp:du?72:68,maxHp:du?72:68,stamina:6,maxStamina:6,
    location:du?'location.changan.wang_yun_outer_alley':'location.changan.bingzhou_camp',turn:0,pressure:0,
    proficiency:{[du?'short_sword':'saber']:du?20:25},practice:{},searched:[],defeated:[],techniques:[...meta.techniques],
    combat:null,tab:'world',logs:[{text:du?'你按住师门短剑，听见长安第三遍闭门鼓。':'你收紧左肋绷带，营门外只点着一半火把。',type:'scene'}]
  };
  normalizeMud();
}
function serializeMud(){if(!mud)return null;return JSON.parse(JSON.stringify(mud))}
function deserializeMud(save){return JSON.parse(JSON.stringify(save))}
function getMudSave(){return serializeMud()}
function normalizeMud(){
  if(!mud)return;mud.hp=Math.max(0,Math.min(mud.maxHp,mud.hp));mud.stamina=Math.max(0,Math.min(mud.maxStamina,mud.stamina));
  mud.pressure=Math.max(0,Math.min(8,mud.pressure));mud.logs=mud.logs.slice(-60);
}
function mudEscape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mudLog(text,type='normal'){mud.logs.push({text,type});mud.logs=mud.logs.slice(-60)}
function mudLocation(){return MUD_LOCATIONS[mud.location]||MUD_LOCATIONS['location.changan.west_market_warehouse']}
function mudSkillKey(){return mud.character==='du_jian'?'short_sword':'saber'}
function mudSkillName(){return mud.character==='du_jian'?'短剑':'环首刀'}
function mudSkillRank(value){return value>=100?'化境':value>=60?'精通':value>=30?'熟练':'初识'}
function mudExpNext(){return mud.level===1?30:mud.level===2?75:999}
function addMudExp(amount){
  mud.exp+=amount;const next=mudExpNext();
  if(mud.exp>=next&&mud.level<3){mud.level++;mud.maxHp+=12;mud.hp=mud.maxHp;mud.maxStamina++;mud.stamina=mud.maxStamina;mudLog(`阅历累积，你的实战层次提升至 ${mud.level} 级。气血与体力已经恢复。`,'growth')}
}
function addProficiency(amount){
  const key=mudSkillKey(),before=mud.proficiency[key]||0;mud.proficiency[key]=Math.min(100,before+amount);
  if(before<30&&mud.proficiency[key]>=30&&!mud.techniques.includes('mud.wrist_cut')){mud.techniques.push('mud.wrist_cut');mudLog('反复进退终于连成一势：你悟得「截腕」。','growth')}
}
function advanceMudTurn(amount=1){
  mud.turn+=amount;mud.pressure=Math.min(8,mud.pressure+amount);
  if(mud.pressure===4)mudLog('城门方向再响一遍鼓。自由行动的时间正在减少。','warning');
  if(mud.pressure===6)mudLog('巡卒开始封闭横巷。继续练功已来不及，只能行动或回到主线。','warning');
}
function syncMudToStory(locationId){if(mud&&MUD_LOCATIONS[locationId])mud.location=locationId}
function inlineMudButton(label,command,kind=''){return `<button type="button" class="world-action ${kind}" data-inline-command="${mudEscape(command)}">${mudEscape(label)}</button>`}
function renderInlineMudActions(){
  const root=document.getElementById('world-actions');if(!root||!mud)return;const loc=mudLocation(),panel=document.getElementById('decision-panel'),storyResolved=mud.storyCombat?.outcome;panel.classList.toggle('inline-combat',!!mud.combat||!!storyResolved);
  let buttons=[];
  if(storyResolved){
    const result=storyResolved==='victory'?'伏击者已经退开':storyResolved==='retreat'?'你带伤退出交锋':'你被逼离了原位';
    document.querySelector('#world-action-group .action-group-title').textContent='交锋已决';document.getElementById('mission-next').textContent=`${result}。接下来处理伤者、持卷者与火油。`;
    root.innerHTML=inlineMudButton('继续处理伏击余波','continue story','tech');root.querySelector('button').onclick=finishStoryCombat;return;
  }
  if(mud.combat){
    const prof=mud.proficiency[mudSkillKey()]||0;buttons=[inlineMudButton('试探','probe'),inlineMudButton('快攻','attack','danger'),inlineMudButton('格挡','defend'),inlineMudButton('借地形','terrain')];
    if(prof>=30)buttons.push(inlineMudButton('截腕','tech wrist','tech'));buttons.push(inlineMudButton('撤退','flee'));
    document.querySelector('#world-action-group .action-group-title').textContent=`交锋行动 · ${mud.combat.name}`;document.getElementById('mission-next').textContent=`敌方意图：${ENEMY_INTENTS[mud.combat.intentIndex%ENEMY_INTENTS.length].name}。先处理眼前交锋。`;
  }else{
    if(typeof renderMission==='function')renderMission(runtime.events[runtime.current]);
    buttons=[inlineMudButton('观察','look'),inlineMudButton('搜索','search'),inlineMudButton('交谈','talk'),inlineMudButton(`练${mudSkillName()}`,'practice'),inlineMudButton('调息','rest')];
    const storyOwnsCombat=runtime.current==='event.changan.dujian.d02';
    if(!storyOwnsCombat&&loc.enemy&&!mud.defeated.includes(loc.enemy.id))buttons.push(inlineMudButton('迎战','fight','danger'));
    document.querySelector('#world-action-group .action-group-title').textContent=`地点行动 · ${loc.name}`;
  }
  root.innerHTML=buttons.join('');root.querySelectorAll('[data-inline-command]').forEach(b=>b.onclick=()=>runInlineMudCommand(b.dataset.inlineCommand));
}
function inlineMudDeltas(before){
  const out=[];if(mud.hp!==before.hp)out.push(`气血 ${before.hp} → ${mud.hp}`);if(mud.stamina!==before.stamina)out.push(`体力 ${before.stamina} → ${mud.stamina}`);
  const breath=runtime.state.resources.breath;if(breath!==before.breath)out.push(`内息 ${before.breath} → ${breath}`);if(mud.pressure>before.pressure)out.push('城门进度受到行动影响');
  const prof=mud.proficiency[mudSkillKey()]||0;if(prof!==before.prof)out.push(`熟练 ${before.prof} → ${prof}`);return out;
}
function refreshUnifiedHud(){
  const hp=document.getElementById('st-hp'),stamina=document.getElementById('st-stamina');if(!hp||!stamina)return;
  hp.textContent=`${mud.hp}/${mud.maxHp}`;stamina.textContent=`${mud.stamina}/${mud.maxStamina}`;document.getElementById('st-breath').textContent=runtime.state.resources.breath;
  const event=runtime.events[runtime.current],gate=gateState(STAGES.indexOf(event.stage));document.getElementById('st-gate').textContent=gate.short;document.getElementById('time-mark').textContent=gate.name;
}
function runInlineMudCommand(command){
  const normalized=String(command||'').trim().toLowerCase();if(normalized==='continue story'){finishStoryCombat();return}if(['status','状态','属性'].includes(normalized)){openStateGuide();return}
  if(['inventory','行囊','物品'].includes(normalized)){openStateGuide();return}
  if(['skills','武学','技能'].includes(normalized)){openStateGuide('skill');return}
  const before={hp:mud.hp,stamina:mud.stamina,breath:runtime.state.resources.breath,pressure:mud.pressure,prof:mud.proficiency[mudSkillKey()]||0,logs:mud.logs.length};
  mudCommand(command);const entries=mud.logs.slice(before.logs),text=entries.length?entries.map(x=>x.text).join('\n\n'):`“${command}”没有改变当前局势。`;
  appendTimeline(`地点行动：${command}`,text,inlineMudDeltas(before),entries.some(x=>['danger','warning'].includes(x.type))?'system':'normal');
  refreshUnifiedHud();renderInlineMudActions();autoSave();
}
function beginStoryCombat(choiceId,sourceEvent,nextEvent){
  const tactic=choiceId.split('.').pop(),profiles={
    guard_xu:{hp:38,posture:3,intentIndex:0,opening:'你横剑护在许简身前，持刀人压低肩头再次抢进。'},
    chase_archer:{hp:40,posture:3,intentIndex:2,opening:'你逼退箭手回身时，持刀人已经占住仓门，正蓄力劈向你的退路。'},
    drop_shelf:{hp:34,posture:2,intentIndex:1,opening:'倾倒的货架隔开两人，持刀者踩着流油重新逼近，架势已经散乱。'},
    show_seal:{hp:35,posture:2,intentIndex:1,opening:'剑印让来人迟疑了一瞬，但他随即收刀护身，准备灭口。'}
  },p=profiles[tactic]||profiles.guard_xu;
  mud.storyCombat={id:'west_market_ambush',choiceId,sourceEvent,nextEvent,outcome:null};
  mud.combat={id:'west_market_ambushers',name:'西市伏击者',hp:p.hp,maxHp:p.hp,posture:p.posture,maxPosture:3,exp:20,round:1,intentIndex:p.intentIndex,profile:'一人持短刀封门，另一人隔着倒塌货架寻找射箭的空隙。'};
  mudLog(p.opening,'combat');autoSave?.();
}
function unlockMudTechnique(id,text){
  if(mud.techniques.includes(id))return;mud.techniques.push(id);const key=`mud_meta_${mud.character}`,meta=JSON.parse(localStorage.getItem(key)||'{"techniques":[]}');if(!meta.techniques.includes(id))meta.techniques.push(id);localStorage.setItem(key,JSON.stringify(meta));mudLog(text,'growth');
}
function resolveStoryCombat(outcome){
  if(!mud.storyCombat)return;mud.storyCombat.outcome=outcome;const flag=`combat.west_market.${outcome}`;runtime.state.flags.add(flag);
  if(outcome!=='victory'&&runtime.state.fates['character.xu_jian'])runtime.state.fates['character.xu_jian']='fate.wounded';
  if(outcome==='victory')unlockMudTechnique('mud.quick_draw','你从这场窄门实战中记住了抢先出鞘的时机。「疾步出鞘」已永久解锁。');
}
function finishStoryCombat(){
  if(!mud?.storyCombat?.outcome)return;const next=mud.storyCombat.nextEvent;mud.storyCombat=null;runtime.current=next;document.getElementById('decision-panel').classList.remove('inline-combat');autoSave();renderGame();
}

function openMud(tab='world'){
  if(!mud)initMudSession(currentCharacter||'du_jian');
  mud.tab=tab;showScreen('screen-mud');renderMud();
}
function resumeStory(){showScreen('screen-game');renderGame();activeReveal?.finish()}
function renderMud(){
  if(!mud)return;normalizeMud();const loc=mudLocation();
  document.getElementById('mud-location').textContent=loc.name;
  document.getElementById('mud-pressure').textContent=mud.pressure<3?'城中尚稳':mud.pressure<6?'闭门鼓急':'城门将闭';
  document.getElementById('mud-level').textContent=mud.level;
  document.getElementById('mud-hp').textContent=`${mud.hp}/${mud.maxHp}`;
  document.getElementById('mud-stamina').textContent=`${mud.stamina}/${mud.maxStamina}`;
  document.getElementById('mud-breath').textContent=runtime?.state?.resources?.breath??0;
  document.querySelectorAll('.mud-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===mud.tab));
  if(mud.combat)mud.tab='world';
  const content=document.getElementById('mud-content'),actions=document.getElementById('mud-actions');
  if(mud.tab==='world')renderMudWorld(content,actions);
  else if(mud.tab==='status')renderMudStatus(content,actions);
  else if(mud.tab==='inventory')renderMudInventory(content,actions);
  else if(mud.tab==='skills')renderMudSkills(content,actions);
  else renderMudRecords(content,actions);
  autoSave?.();
}
function mudButton(label,command,kind=''){return `<button type="button" class="mud-action ${kind}" data-mud-command="${mudEscape(command)}">${mudEscape(label)}</button>`}
function bindMudActions(){document.querySelectorAll('[data-mud-command]').forEach(b=>b.onclick=()=>mudCommand(b.dataset.mudCommand))}
function renderMudWorld(content,actions){
  const loc=mudLocation();
  if(mud.combat){renderMudCombat(content,actions);return}
  const recent=mud.logs.slice(-7).map(x=>`<p class="mud-log ${x.type}">${mudEscape(x.text)}</p>`).join('');
  content.innerHTML=`<section class="mud-place"><div class="mud-kicker">${mudEscape(loc.name)}</div><p>${mudEscape(loc.desc)}</p>${loc.npcs.length?`<div class="mud-presence">此地人物：${loc.npcs.map(mudEscape).join(' · ')}</div>`:''}</section><section class="mud-logbook">${recent}</section>`;
  const buttons=[mudButton('观察四周','look'),mudButton('搜索','search'),mudButton('交谈','talk'),mudButton(`练${mudSkillName()}`,'practice'),mudButton('吐纳调息','rest')];
  if(loc.enemy&&!mud.defeated.includes(loc.enemy.id))buttons.push(mudButton(`迎战·${loc.enemy.name}`,'fight','danger'));
  for(const exit of loc.exits){const target=MUD_LOCATIONS[exit];buttons.push(mudButton(`前往·${target.name}`,`go ${target.name}`))}
  actions.innerHTML=buttons.join('');bindMudActions();
}
function renderMudStatus(content,actions){
  const s=runtime.state,a=s.abilities,skill=mud.proficiency[mudSkillKey()]||0,next=mudExpNext();
  content.innerHTML=`<section class="mud-sheet"><h3>人物状态</h3><div class="mud-stat-grid"><span>等级<b>${mud.level}</b></span><span>阅历<b>${mud.exp}/${next===999?'—':next}</b></span><span>武<b>${a.martial}</b></span><span>谋<b>${a.strategy}</b></span><span>势<b>${a.influence}</b></span><span>风声<b>${HEAT[s.heat]}</b></span><span>伤势<b>${INJ[s.injury]}</b></span><span>余时<b>${s.resources.time}</b></span></div><h3>${mudSkillName()}熟练</h3><div class="mud-meter"><i style="width:${skill}%"></i></div><p>${skill}/100 · ${mudSkillRank(skill)}</p><h3>当前处境</h3><p>${mudEscape(mudLocation().name)} · 世界行动 ${mud.turn} 次 · 局势压力 ${mud.pressure}/8</p></section>`;
  actions.innerHTML=mudButton('返回江湖','tab world');bindMudActions();
}
function renderMudInventory(content,actions){
  const items=Object.values(runtime.state.items).filter(x=>x.holderId===runtime.player&&x.quantity>0&& !['state.lost','state.destroyed','state.used'].includes(x.state));
  const names=Object.fromEntries(runtime.bundle.itemDefinitions.map(d=>[d.id,runtime.bundle.texts[d.nameKey]||d.id]));
  content.innerHTML=`<section class="mud-sheet"><h3>随身行囊</h3>${items.length?items.map(x=>`<div class="mud-list-row"><b>${mudEscape(names[x.definitionId]||x.definitionId)}</b><span>${x.equipped?'已装备':'收存'} · ${mudEscape(x.state.replace('state.',''))}</span></div>`).join(''):'<p>身无长物。</p>'}</section>`;
  actions.innerHTML=mudButton('返回江湖','tab world');bindMudActions();
}
function renderMudSkills(content,actions){
  const value=mud.proficiency[mudSkillKey()]||0,known=[...new Set([...mud.techniques,...runtime.state.techniques])];
  content.innerHTML=`<section class="mud-sheet"><h3>${mudSkillName()} · ${mudSkillRank(value)}</h3><div class="mud-meter"><i style="width:${value}%"></i></div><p>熟练 ${value}/100。实战、有限练习与关键抉择都会增长；原地重复练习收益递减。</p><h3>已悟招式</h3>${known.length?known.map(id=>{const t=MUD_TECHNIQUES[id]||{name:runtime.bundle.texts[id+'.name']||id,desc:'由剧情经历掌握的武学。'};return `<div class="mud-list-row"><b>${mudEscape(t.name)}</b><span>${mudEscape(t.desc)}</span></div>`}).join(''):'<p>尚未悟得进阶招式。</p>'}</section>`;
  actions.innerHTML=mudButton('返回江湖','tab world');bindMudActions();
}
function renderMudRecords(content,actions){
  content.innerHTML=`<section class="mud-sheet"><h3>行动记录</h3>${mud.logs.slice().reverse().map(x=>`<p class="mud-record ${x.type}">${mudEscape(x.text)}</p>`).join('')}</section>`;
  actions.innerHTML=mudButton('返回江湖','tab world');bindMudActions();
}
function renderMudCombat(content,actions){
  const c=mud.combat,intent=ENEMY_INTENTS[c.intentIndex%ENEMY_INTENTS.length];
  content.innerHTML=`<section class="mud-combat"><div class="mud-kicker">交锋 · 第 ${c.round} 轮</div><h3>${mudEscape(c.name)}</h3><p>${mudEscape(c.profile)}</p><div class="combat-bars"><label>敌方气力 <i><b style="width:${Math.max(0,c.hp/c.maxHp*100)}%"></b></i>${c.hp}/${c.maxHp}</label><label>敌方架势 <i><b style="width:${c.posture/c.maxPosture*100}%"></b></i>${c.posture}/${c.maxPosture}</label></div><div class="enemy-intent">对方意图：${mudEscape(intent.name)}</div><div class="mud-logbook">${mud.logs.slice(-5).map(x=>`<p class="mud-log ${x.type}">${mudEscape(x.text)}</p>`).join('')}</div></section>`;
  const prof=mud.proficiency[mudSkillKey()]||0,buttons=[mudButton('试探破势','probe'),mudButton('抢步快攻','attack','danger'),mudButton('稳守格挡','defend'),mudButton('借助地形','terrain')];
  if(prof>=30)buttons.push(mudButton('截腕','tech wrist','tech'));
  if(mud.techniques.includes('mud.quick_draw'))buttons.push(mudButton('疾步出鞘','tech quick','tech'));
  buttons.push(mudButton('撤出交锋','flee'));
  actions.innerHTML=buttons.join('');bindMudActions();
}

function mudCommand(raw){
  if(!mud)return;const command=String(raw||'').trim();if(!command)return;
  const [verb,...rest]=command.split(/\s+/),arg=rest.join(' ');
  const aliases={观察:'look',查看:'look',状态:'status',属性:'status',行囊:'inventory',物品:'inventory',武学:'skills',技能:'skills',记录:'records',搜索:'search',搜:'search',交谈:'talk',问:'talk',练剑:'practice',练刀:'practice',练功:'practice',调息:'rest',打坐:'rest',去:'go',走:'go',迎战:'fight',攻击:'attack',快攻:'attack',试探:'probe',格挡:'defend',防守:'defend',地形:'terrain',撤退:'flee',逃:'flee',帮助:'help'};
  const op=aliases[verb]||verb.toLowerCase();
  if(op==='help'){mudLog('可用命令：look、status、inventory、skills、search、talk、practice、rest、go 地点、fight、attack、probe、defend、flee。','info');renderMud();return}
  if(op==='status'||op==='inventory'||op==='skills'||op==='records'){mud.tab=op==='status'?'status':op==='inventory'?'inventory':op==='skills'?'skills':'records';renderMud();return}
  if(op==='tab'){mud.tab=arg||'world';renderMud();return}
  if(mud.combat){mudCombatAction(op,arg);return}
  const loc=mudLocation();
  if(op==='look'){mudLog(loc.desc,'scene')}
  else if(op==='search')mudSearch(loc);
  else if(op==='talk')mudTalk(loc,arg);
  else if(op==='practice')mudPractice();
  else if(op==='rest')mudRest();
  else if(op==='go')mudGo(arg);
  else if(op==='fight')mudStartCombat(loc);
  else mudLog(`无法理解“${command}”。输入 help 查看命令。`,'warning');
  renderMud();
}
function mudSearch(loc){
  if(mud.searched.includes(mud.location)){mudLog('你已经仔细搜过这里，没有新的发现。','muted');return}
  mud.searched.push(mud.location);mud.stamina=Math.max(0,mud.stamina-1);addMudExp(3);advanceMudTurn();mudLog(loc.search,'discovery');
}
function mudTalk(loc,arg){
  const npc=arg?loc.npcs.find(x=>x.includes(arg)):loc.npcs[0];
  if(!npc){mudLog(arg?'此地没有这个人。':'此地无人愿意搭话。','muted');return}
  const lines={赵衡:'赵衡只提醒你一句：城西的命令，每迟一刻就会换一种意思。',许简:'许简把竹简护在袖内：纸不会救人，肯替它作证的人才会。',阿萝:'阿萝没有停下手里的针：想问话，就先替我把水烧开。',阿禾:'阿禾举起木剑：真正的剑是不是不会砍到自己人？',魏石:'魏石没有回答，只把旧箭簇在指间转了一圈。',军司马:'军司马压低声音：今夜别信没有盖印的调令。'};
  mudLog(lines[npc]||`${npc}与你交换了几句消息，却始终留着一半没有说。`,'dialogue');addMudExp(1);
}
function mudPractice(){
  if(mud.pressure>=6){mudLog('闭门鼓已经太急，没有时间继续练功。','warning');return}
  const used=mud.practice[mud.location]||0;if(used>=2){mudLog('此地能验证的步法已经练尽，继续重复不会再有收获。','muted');return}
  if(mud.stamina<2){mudLog('体力不足，强练只会加重伤势。先行调息。','warning');return}
  mud.practice[mud.location]=used+1;mud.stamina-=2;const gain=used===0?9:4;addProficiency(gain);addMudExp(used===0?5:2);advanceMudTurn();
  mudLog(used===0?`你以门槛和墙角为界，完整走了一遍${mudSkillName()}进退，熟练提升 ${gain}。`:`你重复校正方才的落脚，只补全一处细节，熟练提升 ${gain}。`,'growth');
}
function mudRest(){
  if(mud.pressure>=7){mudLog('追兵和人潮已经逼近，无法安心调息。','warning');return}
  const used=mud.practice[`rest:${mud.location}`]||0;if(used>=2){mudLog('短时间内再行吐纳已经无益。','muted');return}
  mud.practice[`rest:${mud.location}`]=used+1;mud.stamina=Math.min(mud.maxStamina,mud.stamina+3);runtime.state.resources.breath=Math.min(4,runtime.state.resources.breath+1);advanceMudTurn();mudLog('你背靠实墙调匀呼吸，体力与一口内息逐渐恢复。','growth');
}
function mudGo(arg){
  const loc=mudLocation(),target=loc.exits.map(id=>[id,MUD_LOCATIONS[id]]).find(([,x])=>x.name===arg||x.name.includes(arg)||arg.includes(x.name));
  if(!target){mudLog(`从这里不能直接前往“${arg||'那里'}”。`,'warning');return}
  if(mud.stamina<=0){mudLog('你已经走不动了，需要先调息。','warning');return}
  mud.location=target[0];mud.stamina--;advanceMudTurn();mudLog(`你穿过两道横巷，来到${target[1].name}。`,'scene');
}
function mudStartCombat(loc){
  if(!loc.enemy||mud.defeated.includes(loc.enemy.id)){mudLog('此地已经没有需要再次交锋的敌人。','muted');return}
  const e=loc.enemy;mud.combat={...e,maxHp:e.hp,maxPosture:e.posture,round:1,intentIndex:0};mudLog(`${e.name}挡住去路。${e.profile}`,'combat');
}
function mudCombatAction(op,arg){
  const c=mud.combat;if(!c)return;const intent=ENEMY_INTENTS[c.intentIndex%ENEMY_INTENTS.length];let defended=false,damage=0,posture=0;
  if(op==='probe'){if(mud.stamina<1)return mudCombatNoStamina();mud.stamina--;posture=2;addProficiency(2);mudLog(`你不急着进身，以剑尖逼他换步，削去 ${posture} 点架势。`,'combat')}
  else if(op==='attack'){if(mud.stamina<2)return mudCombatNoStamina();mud.stamina-=2;damage=12+mud.level*2-(intent.id==='guard'?6:0);posture=1;addProficiency(2);mudLog(`你抢进一刀，造成 ${damage} 点伤害。`,'combat')}
  else if(op==='defend'){defended=true;mud.stamina=Math.min(mud.maxStamina,mud.stamina+1);posture=1;mudLog('你收住前脚，以兵刃护住中线，等待他先动。','combat')}
  else if(op==='terrain'){if(mud.stamina<1)return mudCombatNoStamina();mud.stamina--;posture=2;damage=6;mudLog('你踢翻脚边杂物逼他侧身，借狭窄地形切入空门。','combat')}
  else if(op==='tech'){
    if(arg==='wrist'){if((mud.proficiency[mudSkillKey()]||0)<30)return mudCombatUnknown();if(runtime.state.resources.breath<1)return mudCombatNoBreath();runtime.state.resources.breath--;damage=16;posture=3;mudLog('你先压兵刃再切腕侧，「截腕」迫使对方弃势。','growth')}
    else if(arg==='quick'){if(!mud.techniques.includes('mud.quick_draw'))return mudCombatUnknown();if(runtime.state.resources.breath<1)return mudCombatNoBreath();runtime.state.resources.breath--;damage=intent.id==='heavy'?24:14;posture=2;mudLog('你在重势落下前疾步出鞘，先一步截断他的发力。','growth')}
  }
  else if(op==='flee'){mudLog(mud.storyCombat?'你护住头脸退到倒塌货架之后。伏击者趁势翻墙，许简也在混乱中负了伤。':'你保持兵刃朝前，退到转角后脱离交锋。','warning');mud.combat=null;advanceMudTurn();if(mud.storyCombat)resolveStoryCombat('retreat');renderMud();return}
  else {mudLog('交锋中只能攻击、试探、格挡、借地形、施展招式或撤退。','warning');renderMud();return}
  c.hp=Math.max(0,c.hp-damage);c.posture=Math.max(0,c.posture-posture);
  if(c.hp<=0||c.posture<=0&&c.hp<=12){mudWinCombat(c);return}
  let incoming=intent.damage;if(defended)incoming=Math.max(0,incoming-8);if(c.posture===0)incoming=Math.max(0,incoming-3);
  mud.hp=Math.max(0,mud.hp-incoming);mudLog(incoming?`${c.name}以「${intent.name}」还击，你损失 ${incoming} 点气血。`:`你稳稳接住「${intent.name}」，没有受伤。`,incoming?'danger':'combat');
  if(mud.hp<=0){mudLoseCombat(c);return}
  c.round++;c.intentIndex++;if(c.posture===0){c.posture=1;mudLog(`${c.name}踉跄退开，勉强重整架势。`,'combat')}
  renderMud();
}
function mudCombatNoStamina(){mudLog('体力不足，无法完成这个动作。可以格挡恢复一口体力。','warning');renderMud()}
function mudCombatNoBreath(){mudLog('内息不足，招式无法贯通。','warning');renderMud()}
function mudCombatUnknown(){mudLog('你尚未真正掌握这门用法。','warning');renderMud()}
function mudWinCombat(c){
  mudLog(`${c.name}兵刃脱手，退路已经让开。你没有必要继续追杀。`,'victory');if(!mud.defeated.includes(c.id))mud.defeated.push(c.id);mud.combat=null;addMudExp(c.exp);addProficiency(10);advanceMudTurn();mud.stamina=Math.min(mud.maxStamina,mud.stamina+1);
  if(mud.storyCombat)resolveStoryCombat('victory');else if(c.id==='looter')unlockMudTechnique('mud.quick_draw','你从这场窄门实战中记住了抢先出鞘的时机。「疾步出鞘」已永久解锁。');
  renderMud();
}
function mudLoseCombat(c){
  runtime.state.injury=Math.min(3,runtime.state.injury+1);mud.hp=Math.ceil(mud.maxHp*.35);mud.stamina=1;mud.combat=null;advanceMudTurn(2);
  mudLog(mud.storyCombat?`你被${c.name}逼离许简身前。等你重新站稳，持卷者已经翻墙，许简肩上也多了一道刀伤。`:`你被${c.name}逼退，伤势加重。敌人没有消失，下一次交锋仍会记得你的招式。`,'danger');if(mud.storyCombat)resolveStoryCombat('defeat');renderMud();
}
function submitMudCommand(event){event.preventDefault();const input=document.getElementById('mud-command');const value=input.value;input.value='';mudCommand(value)}
function mudTab(tab){mud.tab=tab;renderMud()}

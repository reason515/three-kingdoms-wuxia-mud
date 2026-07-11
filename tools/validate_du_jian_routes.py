"""Replay representative Du Jian routes from the real content bundle."""
from __future__ import annotations
import json
from pathlib import Path
from content_runtime import ContentRuntime

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=json.loads((ROOT/'content/changan/du_jian/route.json').read_text(encoding='utf-8'))
P='choice.changan.dujian.'

def run(choices:list[str])->ContentRuntime:
 rt=ContentRuntime(BUNDLE)
 for choice in choices: rt.choose(P+choice)
 assert rt.ending is not None
 return rt

COMMON_GUARD=['d01.accept','d02.guard_xu','d03.stay','d03_treat.use_medicine','d04a.take_leaf','d05.take_all','d06_armor.stretcher','d06_medicine.aluo_treats','d07.guard']
ROUTES={
 '守剑护人': COMMON_GUARD+['d08.confront','d09.guard','d10.aluo_first','d11a.fight','d11b.guard','d11c.break_sword','d12.protect'],
 '游剑留路': ['d01.inspect_seal','d02.chase_archer','d03.chase','d04b.save_attacker','d05.give_route','d06_armor.leave','d06_medicine.give_own','d07.roam','d08.draw_sword','d09.roam','d10.give_seal','d11a.fight','d11b.roam','d11_roam_cost.leave_sword','d11c.leave','d12.protect'],
 '守令': ['d01.accept','d02.show_seal','d03.stay','d03_treat.use_medicine','d04a.refuse_leaf','d05.force_aluo','d06_armor.wear','d06_medicine.leave','d07.skip','d08.obey','d12.leave'],
 '收押': COMMON_GUARD+['d08.promise','d09.seal','d10.surrender','d11_capture.confess','d12.wall'],
 '脱逃': COMMON_GUARD+['d08.promise','d09.seal','d10.surrender','d11_capture.escape','d12.protect'],
}
EXPECTED={'守剑护人':'ending.changan.dujian.protect','游剑留路':'ending.changan.dujian.protect','守令':'ending.changan.dujian.duty','收押':'ending.changan.dujian.prison','脱逃':'ending.changan.dujian.protect'}
INJ=['无伤','轻伤','重伤','濒危','死亡']; HEAT=['平静','起疑','暴露','缉拿']; FREE={'free':'自由','captured':'落网','imprisoned':'收押','escaped':'脱逃','coerced':'被迫效力'}

def boundary_checks()->None:
 rt=ContentRuntime(BUNDLE); rt.state['resources']['time']=0
 try: rt.choose(P+'d01.ask')
 except ValueError: pass
 else: raise AssertionError('余时不足仍可支付')
 rt=ContentRuntime(BUNDLE); rt.state['injury']=3; rt.effect({'op':'changeInjury','delta':1}); rt.normalize(); assert rt.state['life']=='dead'
 rt=ContentRuntime(BUNDLE); rt.state['heat']=3; rt.normalize(); assert rt.state['freedom']=='free'
 rt=ContentRuntime(BUNDLE); rt.state['flags'].update({'route.guard','route.roam'})
 try: rt.normalize()
 except AssertionError: pass
 else: raise AssertionError('互斥路线可共存')

if __name__=='__main__':
 print('杜缄真实内容代表路线验证'); print('='*82)
 for name,choices in ROUTES.items():
  rt=run(choices); assert rt.ending==EXPECTED[name],(name,rt.ending)
  s=rt.state
  print(f"PASS  {name:<8} 结局={rt.ending.rsplit('.',1)[-1]:<8} 余时={s['resources']['time']} 内息={s['resources']['breath']} 伤势={INJ[s['injury']]} 风声={HEAT[s['heat']]} 自由={FREE[s['freedom']]} 选择={len(rt.log)}")
 boundary_checks(); print('PASS  边界状态  资源不足/死亡/缉拿未落网/路线互斥'); print('='*82); print('全部通过：5 条真实内容路线 + 4 组边界检查')

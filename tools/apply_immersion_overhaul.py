"""Apply the v0.2 immersion overhaul to the two Chang'an MVP bundles.

The migration is idempotent: it rebuilds authored feedback keys and conditional
scene variants without duplicating characters, effects or text records.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BUNDLES = {
    "dujian": ROOT / "content/changan/du_jian/route.json",
    "renshuo": ROOT / "content/changan/ren_shuo/route.json",
}

# High-value actions receive fully authored physical and emotional feedback.
CURATED: dict[str, str] = {
    # 杜缄：身份、第一次交锋、第一次舍弃
    "choice.changan.dujian.d01.accept": "你接过文书，封泥尚温。赵衡替你理正剑带，动作和去年雪夜送药回来时一样熟稔。\n\n他没有催你。正因为没有催，这份托付才显得更重。",
    "choice.changan.dujian.d01.ask": "你没有立刻接文书。赵衡压着刀柄的拇指停了一下。\n\n“不是犯人。”他说，“是个会让很多人开口的证人。”府内又换过一班武吏，你追问所耗的片刻已经从门缝里漏了出去。",
    "choice.changan.dujian.d01.inspect_seal": "你借衣袖遮住手指，轻轻转过封泥。边缘有一道被热气熏亮的蜡痕——有人拆开过，又把它封了回去。\n\n赵衡看着巷外，没有看你的手。",
    "choice.changan.dujian.d01.warn_foster_mother": "旧识从侧门离开时没有回头。你把养母的住处和暗号都交给了他。\n\n这一份人情今夜已经用尽，但至少有一扇门会在乱兵到来前先关上。",
    "choice.changan.dujian.d02.guard_xu": "你没有追箭手。短剑横过许简肩前，刀锋撞在剑脊上，震得虎口发麻。\n\n许简终于腾出一只手抓住你的衣角。墙外瓦片一响——持卷者已经借你守人的这一息翻过后墙。",
    "choice.changan.dujian.d02.chase_archer": "你踏上木箱，鞋底蹬裂薄板，从持刀人肩上越了过去。\n\n身后传来许简撞上门框的闷响。你逼退箭手，也看清了他腰间那束并州旧箭簇；这条线索是用离开许简身边换来的。",
    "choice.changan.dujian.d02.drop_shelf": "短剑割断麻绳，整排货架斜着砸下，把两名袭击者隔在两边。火油罐滚过砖地，在你脚边碎开。\n\n人暂时分开了，油却正向灯脚流去。你救下的是眼前一息，不是整场麻烦。",
    "choice.changan.dujian.d02.show_seal": "你把剑印翻到掌外。持刀人认出了纹样，刀势迟了半拍，许简趁机退进门内。\n\n巷口却有人低声叫出了王允府三个字。你的身份已经比你的脚程更早传开。",
    "choice.changan.dujian.d03.stay": "你跪到许简身侧，手掌压住他肋间的伤口。墙外脚步越来越轻，最终消失在屋脊之后。\n\n文书可以再追，人若在这里流干血，便没有下一步。你先作了这一重判断。",
    "choice.changan.dujian.d03.chase": "你借墙角残箱翻上后墙，没有回头。\n\n许简叫了你一声，声音被瓦片碎裂声截断。前方的人还追得上，身后那道伤却只能交给命数。",
    "choice.changan.dujian.d03.remove_fire": "你一脚踢开灯脚，火苗仍舔上了封套。随后你俯身架起许简，把他的右臂搭到自己肩上，一步步拖出油迹。\n\n人出来了，文书边缘已经焦黑。你闻到的纸灰，会一路跟到城门。",
    "choice.changan.dujian.d04a.take_leaf": "你收下薄简。许简没有松手，直到你亲口答应先护阿萝。\n\n竹片只有几钱重，贴进衣襟后却像多压了一块甲。自这一刻起，你护送的不再只是王允府的命令。",
    "choice.changan.dujian.d04b.save_attacker": "你先把摔伤者从断竹中拖出，替他固定了折腿。他疼得满头冷汗，仍朝远处那枚箭来的方向偏了偏下巴。\n\n“并州斥候。”他说。你救下一条命，也让另一名主角在这段记录里第一次留下了影子。",
    "choice.changan.dujian.d05.take_all": "你蹲下，把最重的老妇背到担架上。阿萝没有道谢，只把另一根抬杆递给你。\n\n阿禾抱着木剑跑去叫人。院里每多站起来一个伤者，队伍便慢一分；可从这一刻起，他们不再只是名册上的一行字。",
    "choice.changan.dujian.d05.take_siblings": "你只替阿萝和阿禾让出位置。阿萝替老妇掖好被角，起身时没有看你。\n\n她跟你走了，却把一部分心留在院里。你保住了速度，也带上了这份沉默。",
    "choice.changan.dujian.d05.give_route": "你在地上画出两条巷路，把口令教给阿萝。她抹掉图，只留下自己记得住的三个转角。\n\n“走不走，由我决定。”她牵起阿禾。你放开了对她的控制，也放弃了替她承担全部危险的机会。",
    "choice.changan.dujian.d05.force_aluo": "你亮出府令，两名武吏上前夹住院门。阿萝把沾血的针收进袖中，先让阿禾站到自己身后。\n\n她跟你走，不是因为相信你。木剑擦过你的剑鞘，阿禾第一次没有抬头看你。",
    "choice.changan.dujian.d07.guard": "你以门框为界，连退七步，每一步都让剑尖留在身后人的前方。第八步时，你终于不再看赵衡会怎样出刀，而是先看自己究竟要守谁。\n\n残谱上的线条与脚下门槛重合。“横剑截流”自此不再只是纸上的名字。",
    "choice.changan.dujian.d07.roam": "你沿断墙走了三遍。第三遍落脚时，残梁在脚下轻轻一沉，你借那一沉换到墙的另一侧。\n\n你领悟的不是逃得更快，而是怎样在刀锋合拢前，把自己放到最需要的位置。",
    "choice.changan.dujian.d07.entrust": "你合上残谱，递给阿萝。她没有翻看，只用药囊外层的油布把它裹紧。\n\n这一夜你不会因此多会一招；但若你倒在城门内，仍会有人知道这半本书该交给谁。",
    "choice.changan.dujian.d08.obey": "你把人和文书交了出去。赵衡亲手收走你的剑，没有让武吏碰你。\n\n阿萝经过身边时，阿禾的木剑从怀里掉下来。没有人替他捡。原命令完成得很干净，干净得没有留下可以辩解的地方。",
    "choice.changan.dujian.d08.confront": "你把残页举到两人之间。赵衡看见被刮去的分类，眼里没有惊讶。\n\n“乱世没有逐一审人的时间。”他说。你终于得到回答，也终于明白你们之间再没有一句旧情可以替这个回答遮掩。",
    "choice.changan.dujian.d08.promise": "你以剑印作押，说会在城门前给他一个交代。赵衡侧身让开，只说了一句“别让我替师父清理门户”。\n\n他给你的不是宽恕，而是一段借来的路。",
    "choice.changan.dujian.d08.draw_sword": "短剑出鞘时，赵衡先看了一眼你的手势。那是他教你修正过无数次的起手。\n\n两名弩手抬弩，他却抬手压住。师兄弟之间最后一点照顾，只够让这一战晚到城门。",
    "choice.changan.dujian.d09.guard": "你把后脚抵住巷砖，剑身横过不足一丈的巷口。第一刀被引向墙面，第二刀压得你膝盖一沉；第三名追兵从矮墙跃下时，只看见阿萝一行已经退过转角。\n\n你守住的不是地面，是他们离开的时间。",
    "choice.changan.dujian.d09.roam": "你踏墙换位，鞋尖在墙砖上只借了一次力，便先一步落到屋脊追兵面前。\n\n地面的刀声仍在逼近阿萝。你只能相信她记住了你教的退路——游剑的代价，从来是把一部分生死交给同伴。",
    "choice.changan.dujian.d10.aluo_first": "你把最后一个伤者推进门缝，转身将短剑横在拒马之后。阿萝想停，阿禾却拉住了她。\n\n木剑从男孩手中举起来，隔着人潮朝你点了一下。城门开始闭合，你没有再回头。",
    "choice.changan.dujian.d10.surrender": "你先把短剑放在地上，再将剑印和怀中残谱一件件摆到旁边。赵衡的人扣住你的手腕时，阿萝一行正从城门缝里通过。\n\n失去自由并不比挨一刀轻。你只是把代价从他们身上移到了自己身上。",
    "choice.changan.dujian.d11a.fight": "你把短剑举到眉前。赵衡的刀没有立刻落下。\n\n远处军阵正在溃散，城墙上的尘土一层层落下来。你们都知道历史不会等这一战分出是非；但身后的人只能等你。",
    "choice.changan.dujian.d11b.guard": "你不接他的刀锋，只接他逼向身后人的每一步。长刀三次压下，短剑三次把力量引向石阶。\n\n第四次，你的肩背已经见血，赵衡的重心却终于越过了刀柄。那是你用伤势换来的破绽。",
    "choice.changan.dujian.d11b.roam": "你贴着刀背掠过，左脚踏上城墙排水石，借势翻到赵衡身后。侧门铁闩锈死，短剑插入缝隙才撬开半寸。\n\n门有了缝，你的剑却被咬在石里。生路从来不是凭空打开的。",
    "choice.changan.dujian.d11c.break_sword": "你把短剑反抵石阶，双手压下。剑身先弯，随后在你们之间断成两截。\n\n赵衡的刀停在半空。你斩断的不是武学，而是再用师门替彼此辩解的资格。",
    "choice.changan.dujian.d11c.disarm": "你顺着赵衡失衡的那一瞬贴近，剑脊压腕，剑格别住刀环。长刀落地时没有血。\n\n赵衡看着空下来的右手，像第一次明白师父教“卸锋”并不是为了让人输得更难看。",
    # 任朔：军中身份、同袍债与阵列
    "choice.changan.renshuo.r01.accept": "你把调令折好塞进甲缝，没有为自己辩一句。军司马在你转身时叫住你，替你把松开的左肋绷带重新打了一个军中结。\n\n军营仍在怀疑你，但至少还有人愿意让你完整地走出营门。",
    "choice.changan.renshuo.r01.report": "你把侦察所见逐条说完。书记每记一行，营外便少一分天色。\n\n军司马终于肯正眼看你，也把魏石最后出现的位置往西修了两坊。你换来较清楚的路，却把自己知道什么也交给了军营。",
    "choice.changan.renshuo.r01.peek_order": "你俯身收紧甲绳，借火光扫过调令。行文像都尉府，落款却用了三个月前已经废掉的记号。\n\n这不是吕布直属的命令。有人正借军令把仍肯办事的人逐个调出营。",
    "choice.changan.renshuo.r02.trace_sword": "你沿着剑痕退行的方向一步步量过脚印。持剑者始终面向仓门，说明他护着的不是自己。\n\n墙角还留着魏石惯用的双环绳结：第一环指路，第二环示警。你又一次因他留下的本事避开松动的棚梁，却也更想知道他为何来过这里。",
    "choice.changan.renshuo.r03.help": "你先把刀推回鞘中，俯身抬起担架后端。左肋立刻像被重新撕开，你没有松手。\n\n阿萝这才让开半步。阿禾把木剑插回腰带，跑去替你推门。信任不是一句军令换来的，是三个人一起抬过一道门槛。",
    "choice.changan.renshuo.r03.give_medicine": "你把止血散放进阿萝掌心，没有指定救谁。她看了你一眼，把药按到烧伤最重的老卒伤口上。\n\n你自己的绷带仍在渗血。阿禾却第一次叫了你一声“任大哥”。",
    "choice.changan.renshuo.r03.force_testimony": "你的手按上腰牌，命阿萝交出名单。她把阿禾挡到身后，一字一字念完那些名字。\n\n你得到了想要的证词，却让院中每个人都重新看见了一个持刀军卒。",
    "choice.changan.renshuo.r04.listen": "你让魏石说完，也让他把染血的马鞍翻了过来。夹层里藏着城门轮值、马厩方位和几户富商的门图。\n\n他确实想救军属；他也确实准备借他们的恐慌替自己夺一份家底。两件事都是真的。",
    "choice.changan.renshuo.r04.draw_saber": "环首刀出鞘时，魏石侧身避开，没有还手。他熟悉你的左肋旧伤，退的每一步都逼你扭腰追击。\n\n你终于在他肩上留下一道口子，他也已经退到角门外。巷中的人都看见了两个并州旧卒拔刀相向。",
    "choice.changan.renshuo.r04.appeal_old_bond": "你把旧箭簇放到马鞍上。魏石盯着那个“朔”字看了很久，伸手时却没有拿。\n\n“旧债可以慢慢还，”他说，“今夜的路不能慢。”他迟疑了，却没有真正停下。",
    "choice.changan.renshuo.r05.report": "你吹响军哨。魏石先是一怔，随后亲手割断最近一匹马的缰绳。\n\n“这一箭算我白替你挡了。”他说。巡卒从巷口涌来，你完成了军令，也把两年前那条命债推上了军法的案桌。",
    "choice.changan.renshuo.r05.stop_quietly": "你没有吹哨，只用刀背拍开马栏。三匹马受惊冲进横巷，魏石的计划顷刻散了一半。\n\n他本可以与你拼命，却只在离开前看了一眼你的旧伤。你阻止了他，也替他保留了没有被军法当场处置的一线。",
    "choice.changan.renshuo.r05.acquiesce": "你让开巷口，条件是先把军属送出去。魏石当着你的面卸下两袋财物，留下粮和药。\n\n他不是被你说服，只是接受了一桩交易。自这一刻起，他抢来的每一匹马也有你的一份沉默。",
    "choice.changan.renshuo.r07.breaker": "老卒让你在狭窄过道里连续出刀，不许后退。第三次撞开木架时，你终于明白“破围”不是多杀一人，而是让围阵先相信你不会停。\n\n刀谱上的伤亡数字仍在眼前。这一招打得越直，代价便越难藏。",
    "choice.changan.renshuo.r07.protector": "老卒把三只空药箱当作伤兵，命你每退一步都让刀锋回到它们前面。你的左肋很快渗血，队形却没有散。\n\n“回锋护列”不是替所有人受伤，而是让身后的人知道下一步该往哪里退。",
    "choice.changan.renshuo.r08.civilians_first": "你让军属先穿过矛杆下的空隙，自己留在最后。阿萝扶着老卒，阿禾回头想等你，被她一把推过拒马。\n\n男孩把木剑举到额前，学的是并州军送同袍出阵的礼。你必须独自接住后面的刀。",
    "choice.changan.renshuo.r08.with_wei": "魏石的人从侧门冲入，把守卒和拒马一同挤开。你护着军属跟进马队，脚下却不断踩到从皮袋里散落的铜钱。\n\n这条路确实能救人。它也确实是用别人的血和财物铺成的。",
    "choice.changan.renshuo.r08.solo_rearguard": "你把最后一名伤者推过门缝，随后用刀环卡住拒马。第一支箭钉进破甲，第二支擦过左肋。\n\n身后脚步没有乱。你终于把老卒教的“护列”用在了一群不属于任何军阵的人身上。",
    "choice.changan.renshuo.r09a.expose_plan": "你没有骂魏石，只把染血马鞍的来历、失踪甲士和皮袋中的门图逐一说给他的部下听。\n\n有人先放低了刀，随后是第二个人。魏石回头看他们时，第一次发现恐慌也会反噬利用它的人。",
    "choice.changan.renshuo.r09a.fight": "你拔刀，没有再提两年前那支箭。魏石也没有。\n\n两个起手式一模一样的人隔着三丈烟尘相对。你们都知道第一刀该从哪里来，也都知道旧情已经不能替任何人挡下这一刀。",
    "choice.changan.renshuo.r09b.breaker": "你迎着两匹马之间最窄的缝隙直进。第一刀劈开缰绳，第二刀压低骑手的兵刃，第三步已经撞入阵心。\n\n围阵因你的不停步先乱了。你的旧伤也在甲下重新裂开。",
    "choice.changan.renshuo.r09b.protector": "魏石虚晃向你，刀锋却转向身后的军属。你没有追他的肩，而是回刀封住那条空隙。\n\n刀背撞上前臂，震得左肋一阵发黑。身后队伍仍按你教的步子后退，没有一个人越过另一个人逃命。",
    "choice.changan.renshuo.r09c.break_saber": "你把环首刀横在膝上压断。断口弹起，在掌心划出一道血线。\n\n魏石停了刀。你们在边地一起学会的东西仍在身体里，但从这一刻起，再没有一把旧刀可以替你们证明同袍二字。",
    "choice.changan.renshuo.r09c.let_go": "你让开下坡的路。魏石没有道谢，只把那枚旧箭簇重新丢回你脚边。\n\n他活着离开，军法却需要有人留下。你弯腰捡箭时，已经听见身后的军靴声。",
}


def cond_any_fate(character_id: str, *fates: str) -> dict[str, Any]:
    return {"op": "any", "conditions": [
        {"op": "characterFate", "characterId": character_id, "fate": fate}
        for fate in fates
    ]}


def effect_echo(costs: list[dict[str, Any]], effects: list[dict[str, Any]]) -> list[str]:
    all_effects = costs + effects
    echoes: list[str] = []
    ops = {e.get("op") for e in all_effects}
    if any(e.get("op") == "spendResource" and e.get("resource") == "time" for e in all_effects):
        echoes.append("远处的闭门鼓又响了一遍；这段耽搁已经追不回来。")
    if any(e.get("op") == "spendResource" and e.get("resource") == "breath" for e in all_effects):
        echoes.append("一口内息沿兵刃送出，胸口随即空了一瞬。")
    if "consumeItem" in ops:
        echoes.append("手里的物资就此用去，下一次需要它时只能另想办法。")
    if "changeInjury" in ops or "setInjury" in ops:
        echoes.append("疼痛留在了身体里，并会跟着你走进下一场交锋。")
    if "setHeat" in ops:
        echoes.append("巷口已经有人记住你的脸与兵器，消息会走在你前面。")
    if any(e.get("op") == "setCharacterFate" and e.get("fate") == "fate.dead" for e in all_effects):
        echoes.append("你没有回头；身后的呼吸声最终还是弱了下去。")
    if "learnTechnique" in ops:
        echoes.append("方才的进退终于在筋骨里连成一势；下一次拔刀时，它会成为新的选择。")
    if "addInsight" in ops and "learnTechnique" not in ops:
        echoes.append("这一进一退没有白费，它在你心里留下了一条尚未走完的武学方向。")
    if "confiscateVisibleItems" in ops:
        echoes.append("兵器与信物被一件件取走。失去行动权，比伤口更快地改变了眼前局势。")
    if any(e.get("op") in {"transferItem", "setItemState"} for e in all_effects) and not echoes:
        echoes.append("东西换了去处，也把后来能够选择的路一并改变。")
    return echoes[:2]


def forecast(choice: dict[str, Any]) -> str:
    effects = list(choice.get("costs", []))
    for res in choice.get("resolutions", []):
        effects.extend(res.get("effects", []))
    notes: list[str] = []
    if any(e.get("op") == "spendResource" and e.get("resource") == "time" for e in effects):
        notes.append("会耽搁行程")
    if any(e.get("op") == "spendResource" and e.get("resource") == "breath" for e in effects):
        notes.append("需要动用内息")
    if any(e.get("op") == "consumeItem" for e in effects):
        notes.append("会耗掉手中物资")
    if any(e.get("op") in {"changeInjury", "setInjury"} and (e.get("delta", 0) > 0 or e.get("value", 0) > 0) for e in effects):
        notes.append("自己可能负伤")
    if any(e.get("op") == "setHeat" and e.get("value", 0) >= 2 for e in effects):
        notes.append("身份可能暴露")
    if any(e.get("op") in {"changeRelationship", "setRelationship"} and (e.get("delta", 0) < 0 or e.get("value", 0) < 0) for e in effects):
        notes.append("会伤及彼此信任")
    if any(e.get("op") == "setCharacterFate" and e.get("fate") in {"fate.dead", "fate.abandoned", "fate.captured"} for e in effects):
        notes.append("可能有人被留下")
    if any(e.get("op") in {"transferItem", "setItemState", "confiscateVisibleItems"} for e in effects):
        notes.append("会改变物件去向")
    if choice.get("risk") == "lethal":
        notes.append("这一步可能致命")
    elif choice.get("risk") == "high" and not notes:
        notes.append("局面一旦失手便难以挽回")
    if not notes:
        original = choice.get("_original_intent", "")
        banned = ("设置", "解锁", "结局", "领悟", "进入R", "获得")
        if original and not any(x in original for x in banned):
            return original
        return "眼前不必立刻付出代价，但后果会留到下一步。"
    return "；".join(dict.fromkeys(notes)) + "。"


def add_ahe(bundle: dict[str, Any]) -> None:
    cid = "character.a_he"
    if not any(c["id"] == cid for c in bundle["characters"]):
        insert_at = next((i + 1 for i, c in enumerate(bundle["characters"]) if c["id"] == "character.aluo"), len(bundle["characters"]))
        bundle["characters"].insert(insert_at, {
            "id": cid,
            "nameKey": "character.a_he.name",
            "factionIds": ["faction.civilians"],
            "tags": ["role.child", "relation.aluo_younger_brother"],
            "defaultFate": "fate.with_aluo",
        })
    bundle["texts"]["character.a_he.name"] = "阿禾"
    for event in bundle["events"]:
        if "character.aluo" in event.get("actorIds", []) and cid not in event["actorIds"]:
            event["actorIds"].append(cid)
        for choice in event["choices"]:
            for resolution in choice["resolutions"]:
                if any(e.get("op") == "setCharacterFate" and e.get("characterId") == cid for e in resolution["effects"]):
                    continue
                aluo_fates = [e["fate"] for e in resolution["effects"] if e.get("op") == "setCharacterFate" and e.get("characterId") == "character.aluo"]
                if aluo_fates:
                    resolution["effects"].append({"op": "setCharacterFate", "characterId": cid, "fate": aluo_fates[-1]})


def add_feedback(bundle: dict[str, Any]) -> None:
    texts = bundle["texts"]
    for event in bundle["events"]:
        for choice in event["choices"]:
            choice["_original_intent"] = texts.get(choice["intentKey"], "")
            texts[choice["intentKey"]] = forecast(choice)
            for index, resolution in enumerate(choice["resolutions"]):
                key = f"result.{choice['id']}.{index}"
                resolution["resultTextKey"] = key
                if choice["id"] in CURATED:
                    result = CURATED[choice["id"]]
                else:
                    label = texts.get(choice["labelKey"], "你作出了选择").strip("【】。 ")
                    echoes = effect_echo(choice.get("costs", []), resolution.get("effects", []))
                    if not echoes:
                        echoes = {
                            "none": ["动作落定，身边人的站位与目光也随之改变；这一步没有立刻见血，却已经表明你的取舍。"],
                            "costly": ["动作落定，周围短暂一静。眼前的路仍在，但你已经不能再假装未曾作出选择。"],
                            "high": ["兵刃、呼吸与脚步都在这一刻换了方向。你已经越过能够轻易回头的界线。"],
                            "lethal": ["这一步落下，生死便不再只握在你手里。没有人还能把它当作一句未出口的话收回。"],
                        }.get(choice.get("risk"), ["局势因你的行动向前推了一步，再也回不到方才。"])
                    result = f"你{label}。\n\n" + "\n\n".join(echoes)
                texts[key] = result
            choice.pop("_original_intent", None)


def overhaul_dujian(bundle: dict[str, Any]) -> None:
    events = {e["id"].rsplit(".", 1)[-1]: e for e in bundle["events"]}
    t = bundle["texts"]
    t["event.changan.dujian.d01.text"] = (
        "府门内的灯还亮着，门外却已换了第三班持戟武吏。城中近来每逢换岗都会多查一遍籍贯，今夜尤其严。\n\n"
        "赵衡没有披甲，只穿着师父留下的旧襜褕。去年长安落雪，养母病重，正是他冒着宵禁替你把药送进坊门；袖口那道补丁，还是那夜被墙钉刮破后留下的。\n\n"
        "赵衡：护许简去城西旧宅，再把誊录名册的医女带回来。\n\n"
        "他说“带回来”时，右手仍压在刀柄上。那是师父纠正了他十年也没改掉的习惯。你不知道他在防谁，但你知道他从不轻易把师父的旧衣穿出来。"
    )
    t["event.changan.dujian.d04a.text"] = (
        "旧宅窗纸早被风揭去。许简从贴身衣层中取出一页薄简。人名旁原有三种墨记，如今有一列被刀尖逐个刮去。\n\n"
        "许简：这是原簿留下的一页。赵衡命我重抄副本时，亲手划掉了这些分类。阿萝看过原簿，她若落到他手里，便活不到开口那日。\n\n"
        "刮痕边缘还粘着王允府封泥所用的朱砂。许简的证词未必能救所有人，却足够让你不能再把这份托付当作一趟普通护送。"
    )
    t["event.changan.dujian.d05.text"] = (
        "军属里巷比西市安静得多。沿街各户原本挂着籍贯木牌，如今写着‘陇西’‘金城’的几块都被人连夜劈掉，只剩墙上的新白印。董卓死后，凉州从一个地名慢慢变成了一桩嫌疑。\n\n"
        "阿萝没有藏。她跪在院里替一名凉州老妇缝合腿伤，四周还躺着三个不能独自行走的人。不到十岁的阿禾握着一块刻歪的木剑，守在药囊旁边。\n\n"
        "阿萝：我知道你为何来。要我走，可以。先告诉我，这些人怎么办。\n\n"
        "王允府想从名册里找出董卓旧党，城外的溃兵却说名册要杀尽所有外乡人。两边争的是同一张纸；院里的人只知道，纸上的名字都是自己的。"
    )
    t["event.changan.dujian.d08.text"] = (
        "赵衡没有带大队人马，只带了两名生面孔的持弩武吏。山门外已经挤进第一批从城外逃来的百姓，有人边跑边撕掉衣襟上的籍贯木牌。\n\n"
        "赵衡：师弟，把医女和文书给我。今日之事，我当你从未走错路。\n\n"
        "他的语气仍像从前替你讲解剑谱。可两名弩手站的位置，一左一右封住了阿萝与巷口；他为你的每一种回答都预备了后手。"
    )
    t["event.changan.dujian.d10.text"] = (
        "西侧城门只开着容一辆车通过的缝。败兵、军属和百姓挤在拒马之间，守卒正用矛杆驱赶没有路引的人。\n\n"
        "城头先后来了两名传令者：一个举着王允府的符节，命守卒严查凉州籍；另一个满身是血，只喊吕布前军已经退回城内。两道命令没有谁宣布作废，守门的人便只好把每一个陌生面孔都当成危险。\n\n"
        "许简要保住底稿，阿萝要带走伤者。你若留下引开追兵，自己未必还能赶上城门关闭。\n\n"
        "史书日后会把这一刻写成‘城门失守’。可站在门缝前的人看不见史书，只看得见下一辆车还能不能过去。"
    )
    t["event.changan.dujian.d11a.text"] = (
        "夕光贴着城墙落下来，把赵衡的影子拖成一条细长的刀痕。远处传来军阵崩散的声音，不是交锋，是成队的人开始各自逃命。\n\n"
        "赵衡拔刀，刀尖没有指你，先封住了通往侧门的三步。\n\n"
        "赵衡：我最后问一次。人，还是名册？"
    )
    t["event.changan.dujian.d11a.shoulder_known"] = (
        "夕光贴着城墙落下来。任朔留下的见闻忽然与眼前重合：赵衡拔刀时左肩总比右肩慢半寸，并非习惯，而是旧箭伤牵住了肩胛。\n\n"
        "你终于知道该看哪里，却也知道一个破绽并不能替你决定是否出剑。\n\n"
        "赵衡：我最后问一次。人，还是名册？"
    )
    events["d11a"]["textVariants"] = [{
        "when": {"op": "knows", "claimId": "claim.zhao.left_shoulder"},
        "textKey": "event.changan.dujian.d11a.shoulder_known",
    }]
    # State-safe aftermath variants.
    t["event.changan.dujian.d12.text"] = (
        "入夜后，长安方向的火照亮了半边天。你清点仍在身边的人与物：有些托付已经有了去处，有些名字只能留在记忆里。\n\n"
        "败兵从官道上不断经过，没有人知道明日由谁发号施令。你只知道，自己还能决定怎样讲述今夜。"
    )
    t["event.changan.dujian.d12.prison"] = (
        "火光从临时牢狱狭小的气窗映进来。短剑不在身边，指尖却还能在土墙上刻字。外面先是武吏奔逃，随后响起陌生军队撞门的声音。\n\n"
        "长安已经换了主人。你仍没有自由，但阿萝去了哪里、许简留下什么，至少还没有从你口中被夺走。"
    )
    t["event.changan.dujian.d12.aluo_xu"] = (
        "入夜后，长安方向的火照亮了半边天。许简的袖口还留着你替他止血时按下的血印，阿萝正重新清点药囊；阿禾坐在路碑下，把木剑断口一圈圈缠紧。\n\n"
        "你们并非全身而退，但至少还能互相叫出名字。远处有人催促赶路，你必须决定先安置活人，还是先记下未能同行的人。"
    )
    t["event.changan.dujian.d12.aluo"] = (
        "阿萝带着阿禾在城外等你。男孩的木剑少了一截，仍被他郑重插在腰间。她没有先问名册，只替你看了伤口。\n\n"
        "许简没有出现在约定的路碑旁。长安的火越烧越亮，你救下的人和遗失的证词从此不能再互相抵消。"
    )
    t["event.changan.dujian.d12.xu"] = (
        "许简靠着路碑，把幸存的竹片一枚枚排在膝上。他没有问阿萝是否出来；你们都看见了城门方向被冲散的人群。\n\n"
        "记录还在，能为它作证的人却未必还在。你必须决定这份残缺的真相该由谁背下去。"
    )
    both = {"op": "all", "conditions": [
        cond_any_fate("character.aluo", "fate.safe", "fate.accompanying"),
        cond_any_fate("character.xu_jian", "fate.safe", "fate.protected"),
    ]}
    events["d12"]["textVariants"] = [
        {"when": {"op": "compare", "path": "freedom", "cmp": "eq", "value": "imprisoned"}, "textKey": "event.changan.dujian.d12.prison"},
        {"when": both, "textKey": "event.changan.dujian.d12.aluo_xu"},
        {"when": cond_any_fate("character.aluo", "fate.safe", "fate.accompanying"), "textKey": "event.changan.dujian.d12.aluo"},
        {"when": cond_any_fate("character.xu_jian", "fate.safe", "fate.protected"), "textKey": "event.changan.dujian.d12.xu"},
    ]


def overhaul_renshuo(bundle: dict[str, Any]) -> None:
    events = {e["id"].rsplit(".", 1)[-1]: e for e in bundle["events"]}
    t = bundle["texts"]
    t["event.changan.renshuo.r01.text"] = (
        "营门外的火把只点了一半。一个多月前，吕布亲手杀死董卓，并州军也因此从董卓麾下的外来兵，忽然成了守卫朝廷的人。城里人嘴上称他们功臣，盘查腰牌时却比从前更细。\n\n"
        "你刚把左肋的伤口重新扎紧，军司马便掀帘出来，手里握着一份没有盖印的调令。\n\n"
        "军司马：魏石昨夜未归。找到他，核实军属是否被围。天亮前不归，视同逃兵。\n\n"
        "帐中还有都尉身边的书记，正在比对你的腰牌与出营记录。城外传来李傕、郭汜收拢凉州兵的消息以后，每一个没有按时归营的并州人，都可能被看成下一支叛军。\n\n"
        "魏石昨夜只在你的铺下留了一枚箭簇。两年前他替你挡箭时，曾把同一枚箭簇从肩上拔出来，在上面刻了一个‘朔’字。如今他把旧债还到你手里，却没有说明要你拿它去救谁。"
    )
    t["event.changan.renshuo.r02.text"] = (
        "西市废仓外残留着焦痕和新翻的土。棚下躺着一个摔断腿的男人，身上覆着半张沾泥的名册副本。\n\n"
        "墙头还有另一道足迹：步幅短，脚尖始终朝向仓内，持剑者曾在后退中护住什么。矮墙根部则系着一截双环麻绳——魏石在边地教你的路标，第一环指路，第二环示警。\n\n"
        "你按警示绕开将塌的棚梁。两年前他替你挡过箭，今夜他的旧本事又救了你一次；可绳结指向的，正是军属聚居的里巷。"
    )
    t["event.changan.renshuo.r05.text"] = (
        "魏石的部下已经牵马到了巷口。三匹凉州马，鞍上绑着从溃兵处夺来的粮秣、弩箭和一副拆散的明光甲。这不是逃难者随手带走的东西，是一群人准备脱离所有军令后重新立足的家底。\n\n"
        "魏石：城里说王允不肯赦凉州人，城外说李傕、郭汜已经带兵回来。你还要替谁守规矩？\n\n"
        "这两句话都只有一半可靠，所以才比假话更容易让人相信。院里的军属不知道朝堂究竟议过什么，只知道盘查越来越紧，自己的名字确实出现在名单上。\n\n"
        "魏石：同袍。你若不举发我，这些人和马都可以用在出城。那个医女——你可以带走。\n\n"
        "他说‘带走’时，仍是两年前替你挡箭前的神情。但马鞍上的明光甲属于都尉帐前的守夜甲士；甲在这里，人已经不在了。"
    )
    t["event.changan.renshuo.r06_armor.text"] = (
        "院角木箱上放着一副完整札甲。甲片之间重新穿过麻绳，既能穿在一个人身上，也能拆成几块绑上担架，替整列伤者挡住一次箭雨。\n\n"
        "你在边军学过甲不是只护自己的：前列的甲、后列的命，本来就是同一件东西。可你左肋正在渗血，若把防护分出去，下一刀只能由身体来接。"
    )
    t["event.changan.renshuo.r07.text"] = (
        "废寺偏殿已经被撤下来的并州伤兵占满。退养老卒坐在断佛像下，身边不是香炉，而是按队列排好的刀、绷带和空药箱。\n\n"
        "他认出你的刀法，把半册汗渍浸黄的《并州军刀撮要》压到你膝上。\n\n"
        "老卒：营里教人怎么进，我这册只记怎么退。你若还有时间，我教你一势。\n\n"
        "书页边的批注不是口诀，是历次撤阵中每一个位置死了多少人。城门鼓声越来越急，你学的每一刀都必须回答：是自己先出去，还是让队伍不断。"
    )
    t["event.changan.renshuo.r08.text"] = (
        "城门只剩一车宽的缝。守卒的矛杆在人头上方横成栅栏，杆上吊着被撕碎的路引。王允府的吏员仍在查籍贯，吕布军的传令骑却逆着人潮入城，催各营准备撤退。\n\n"
        "魏石的人马已在城外小丘列成三骑一组的冲击阵。他远远举刀，刀尖朝下、刀刃朝外——边军中询问‘我们还算不算同袍’的旧礼。\n\n"
        "军属、阿萝和阿禾还跟在身后。你的刀已经快拔不出来，不是因为伤，而是因为城内城外的命令都自称在救人，你拔刀以后却只能替其中一边开路。"
    )
    t["event.changan.renshuo.r10.text"] = (
        "入夜以后，长安已是半城火、半城烟。你把环首刀横在膝上，清点刀口、伤势与仍能回应你名字的人。\n\n"
        "魏石留下的箭簇还在不在，军属有没有过门，军营是否还认你，都已经各有结果。接下来只能决定你愿意怎样承担。"
    )
    t["event.changan.renshuo.r10.prison"] = (
        "营栅在身后合拢时，城中正传来溃兵撞门的声音。腰牌与刀被摆上军法案桌，负责记录的书记却已经逃了。\n\n"
        "阿萝与军属的去向没有写进供状。你失去了替自己辩解的机会，也因此保住了替别人沉默的机会。"
    )
    t["event.changan.renshuo.r10.civilians"] = (
        "城外沟渠旁，军属按你教的次序重新排成两列。阿萝扶着烧伤老卒，阿禾则拿木剑挨个点数，生怕漏下一个人。\n\n"
        "你的刀口已经卷了，军职也未必还在；但这支没有旗号的队伍仍知道该跟着谁走下一段夜路。"
    )
    t["event.changan.renshuo.r10.aluo"] = (
        "阿萝带着阿禾等在一辆弃车后。她替你重新扎紧左肋，男孩把木剑横在膝上，模仿你方才回锋的姿势。\n\n"
        "更多军属没有赶到。你救出的两个人不能替那些名字作答，却足够让今夜不只剩下一纸军令。"
    )
    t["event.changan.renshuo.r10.alone"] = (
        "城外没有等你的人。魏石的马蹄印向西而去，军营方向则亮着准备审讯逃兵的火把。\n\n"
        "环首刀还在手里，旧箭簇却像比刀更重。你可以继续走，也可以回去让一份无人愿记的供状留下名字。"
    )
    events["r10"]["textVariants"] = [
        {"when": {"op": "any", "conditions": [
            {"op": "compare", "path": "freedom", "cmp": "eq", "value": "imprisoned"},
            {"op": "compare", "path": "freedom", "cmp": "eq", "value": "captured"},
        ]}, "textKey": "event.changan.renshuo.r10.prison"},
        {"when": cond_any_fate("character.civilians", "fate.safe", "fate.accompanying"), "textKey": "event.changan.renshuo.r10.civilians"},
        {"when": cond_any_fate("character.aluo", "fate.safe", "fate.accompanying"), "textKey": "event.changan.renshuo.r10.aluo"},
        {"when": {"op": "always"}, "textKey": "event.changan.renshuo.r10.alone"},
    ]


def add_ending_variants(bundle: dict[str, Any], character: str) -> None:
    texts = bundle["texts"]
    for ending in bundle["endings"]:
        base = ending["summaryKey"]
        dead_key = f"{base}.dead"
        legacy_key = f"{base}.legacy"
        title = texts.get(ending["titleKey"], "这一局")
        texts[dead_key] = f"{title}并未因你的死亡失去意义。有人沿着你留下的刀剑痕与托付走出了长安，而你的名字停在城门的火光里。"
        texts[legacy_key] = f"你没能把所有东西带走，却让兵刃、残谱或一句证词有了下一位保管者。长安失守之后，这份传承比胜负活得更久。"
        legacy_flag = "legacy.entrusted" if character == "dujian" else "legacy.entrusted_ren"
        ending["summaryVariants"] = [
            {"when": {"op": "compare", "path": "life", "cmp": "eq", "value": "dead"}, "textKey": dead_key},
            {"when": {"op": "hasFlag", "flag": legacy_flag}, "textKey": legacy_key},
        ]


def migrate(name: str, path: Path) -> None:
    bundle = json.loads(path.read_text(encoding="utf-8"))
    bundle["schemaVersion"] = "0.2.0"
    bundle["contentVersion"] = "0.2.0"
    add_ahe(bundle)
    if name == "dujian":
        overhaul_dujian(bundle)
    else:
        overhaul_renshuo(bundle)
    add_ending_variants(bundle, name)
    add_feedback(bundle)
    path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    choices = sum(len(e["choices"]) for e in bundle["events"])
    feedback = sum(len(c["resolutions"]) for e in bundle["events"] for c in e["choices"])
    print(f"updated {path.relative_to(ROOT)}: {choices} choices, {feedback} result texts")


if __name__ == "__main__":
    for bundle_name, bundle_path in BUNDLES.items():
        migrate(bundle_name, bundle_path)

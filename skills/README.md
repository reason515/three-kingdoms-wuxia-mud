<div align="center">

<span style="font-size: 28px;"><strong>《汉末江湖录》项目专属 Skills</strong></span><br/>
<span style="font-size: 18px;">面向移动端周目制三国武侠文字 RPG</span>

</div>

---

本目录沉淀项目反复使用的设计、写作、数据和发行方法。所有 skill 均以以下产品方向为共同前提：

- 三国史实构成历史锚点，玩家主要介入史书留白和局部人物命运；
- 移动端以 2～5 个上下文行动选项为核心操作；
- 重玩动力来自真相拼图、人物命运、路线构筑和历史挑战；
- MUD 感来自文字表现、地点、持续状态和规则联动，而不是命令输入；
- Web 是快速验证渠道，移动端是主要交互目标。

# Skill 使用顺序

## 历史篇章设计

1. `historical-wuxia-worldbuilder`：确定史实锚点、可虚构边界、势力和历史风险。
2. `narrative-quest-writer`：构建身份、事件、抉择、证据、人物命运和多周目揭示。
3. `mud-system-designer`：把剧情转化为可执行状态、稀缺资源和选择后果。
4. `combat-and-progression-balancer`：设计能力构筑、情境化战斗和局内外成长。

## 内容落地

5. `game-content-data-architect`：建立场景、事件、选项、证据、结局和存档数据结构。
6. `responsive-text-game-ui-designer`：设计移动端场景阅读、行动区和信息抽屉。
7. `localization-i18n-planner`：规划文本 key、术语、动态文本和翻译流程。

## 验证与发行

8. `indie-release-planner`：规划纸面原型、Web 垂直切片、测试指标和平台路径。

# 当前使用原则

- 根据任务加载相关 skill，不要求每次全部加载。
- 跨领域任务应组合使用，例如设计完整历史篇章时至少加载世界观、叙事和系统三个 skill。
- 首个垂直切片以验证“玩家是否愿意立即换身份重开”为首要目标。
- 在核心重玩循环成立前，不优先投入正式排行榜、多人系统或大规模内容生产。

更完整的职责说明见 `../docs/PROJECT_SKILLS.md`。

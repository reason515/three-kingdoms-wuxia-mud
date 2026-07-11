<div align="center">

<span style="font-size: 28px;"><strong>《汉末江湖录》内容数据结构</strong></span><br/>
<span style="font-size: 18px;">事件、选择、状态、人物、物品、武学与结局 Schema · v0.1</span>

</div>

---

# 1. 文档目标

本文把 `SYSTEM_DESIGN.md` 的规则内核转换为可以编写、校验、回放和迁移的内容数据结构。

MVP 的直接目标是：

1. 将杜缄 D01～D12 从文字设计稿转换成结构化内容；
2. 让条件、代价、结果和下一节点成为唯一权威状态；
3. 自动检查资源越界、引用错误、死路、互斥状态和结局冲突；
4. 让文本、规则和未来客户端彼此分离；
5. 为任朔路线复用同一结构，而不是新增专用代码。

# 2. MVP 存储选择

## 2.1 使用 JSON 内容包

MVP 采用 UTF-8 JSON，每个历史篇章或人物路线可以先保存为一个自包含内容包。

选择 JSON 的原因：

- Python 和浏览器原生支持，不增加依赖；
- 可直接使用 JSON Schema、版本控制和自动校验；
- 确定性强，不存在 YAML 隐式类型等额外歧义；
- 适合当前由少量作者维护的垂直切片。

代价是长文本编辑体验不如 YAML。内容量扩大后，可以增加 YAML 作者格式或编辑器，但构建产物仍统一转换为本文定义的 JSON 结构。

## 2.2 文件布局

```text
schemas/
  content-bundle.schema.json
content/
  examples/
    du_jian_schema_example.json
  changan/
    du_jian/
      route.json                 # 下一阶段生成
    ren_shuo/
      route.json                 # 杜缄全路线通过后生成
tools/
  validate_content.py
```

当前示例文件只验证 Schema，不代表完整杜缄路线。

# 3. 内容包顶层结构

```json
{
  "$schema": "../../../schemas/content-bundle.schema.json",
  "schemaVersion": "0.1.0",
  "contentVersion": "0.1.0",
  "bundleId": "changan.dujian",
  "locale": "zh-CN",
  "scenario": {},
  "initialState": {},
  "characters": [],
  "locations": [],
  "itemDefinitions": [],
  "itemInstances": [],
  "techniques": [],
  "claims": [],
  "events": [],
  "endings": [],
  "invariants": {},
  "texts": {}
}
```

- `schemaVersion`：结构版本；字段含义改变时升级。
- `contentVersion`：剧情、条件和数值版本；平衡调整时升级。
- `bundleId`：稳定且不使用显示名的内容包 ID。
- `locale`：当前内嵌文本语言。
- `scenario`：篇章入口、阶段和历史锚点。
- `initialState`：人物进入本轮时的权威状态。
- `characters` 至 `claims`：可被事件引用的内容注册表。
- `events`：事件、选项、代价、结果和跳转。
- `endings`：主结局规则与优先级。
- `invariants`：路线互斥等全局约束。
- `texts`：本内容包使用的本地化文本。

# 4. ID 与引用规则

ID 使用小写 ASCII、数字、点、下划线和短横线：

```text
scenario.changan
character.du_jian
location.changan.west_market_warehouse
item.du_jian.short_sword
item_instance.du_jian.short_sword
technique.du_jian.guard.crosscurrent
claim.zhao.edited_registry
event.changan.dujian.d02
ending.changan.dujian.protect
```

要求：

- ID 一旦进入存档不得因显示名修改；
- 同一注册表内必须唯一；
- 引用必须指向同一内容包中存在的 ID，或显式声明的外部依赖；
- 分析埋点直接使用事件和选项 ID；
- 文本 key 与对象 ID 分开，文本修改不影响存档。

# 5. 初始状态

```json
{
  "playerCharacterId": "character.du_jian",
  "abilities": { "martial": 2, "strategy": 2, "influence": 1 },
  "resources": { "breath": 3, "time": 3, "favor": 1 },
  "injury": 0,
  "heat": 1,
  "life": "alive",
  "freedom": "free",
  "conduct": [],
  "flags": [],
  "knowledge": [],
  "insights": {},
  "relationships": []
}
```

枚举：

- `injury`：0 无伤、1 轻伤、2 重伤、3 濒危、4 死亡；
- `heat`：0 平静、1 起疑、2 暴露、3 缉拿；
- `life`：`alive`、`dead`、`missing`；
- `freedom`：`free`、`captured`、`imprisoned`、`escaped`、`coerced`。

“被追捕”不存储为自由状态，而由 `heat == 3 && freedom == "free"` 派生。

# 6. 人物与关系

人物定义保存身份和默认命运，不保存本轮中不断变化的态度：

```json
{
  "id": "character.zhao_heng",
  "nameKey": "character.zhao_heng.name",
  "factionIds": ["faction.wang_yun_house"],
  "tags": ["same_school"],
  "defaultFate": "active"
}
```

本轮关系保存在 `initialState.relationships`：

```json
{
  "characterId": "character.zhao_heng",
  "attitude": 0,
  "tags": ["same_school"]
}
```

- `attitude` 范围为 -2～2；
- “同门、救命之恩、承诺、背叛”使用关系标签；
- 态度下降不会删除“同门”事实；
- 人物命运由 `setCharacterFate` 修改。

# 7. 物品与装备

## 7.1 定义与实例分离

物品定义描述通用规则：

```json
{
  "id": "item.du_jian.short_sword",
  "nameKey": "item.du_jian.short_sword.name",
  "slot": "weapon",
  "tags": ["visible", "same_school_token"],
  "allowedStates": ["intact", "damaged", "destroyed", "confiscated", "lost"]
}
```

实例描述本轮中的实际去向：

```json
{
  "id": "item_instance.du_jian.short_sword",
  "definitionId": "item.du_jian.short_sword",
  "holderId": "character.du_jian",
  "state": "intact",
  "equipped": true,
  "quantity": 1
}
```

这能避免用 `original_leaf = true` 同时表达“存在、持有、已托付、被没收”四种不同事实。

## 7.2 MVP 槽位

```text
weapon / armor / token / consumable / story / none
```

同一人物只能装备一个兵器、一个衣甲和一个信物。剧情物品不占普通槽位，但仍有持有者和状态。

# 8. 武学、知识与史证

## 8.1 武学

```json
{
  "id": "technique.du_jian.guard.crosscurrent",
  "nameKey": "technique.du_jian.guard.crosscurrent.name",
  "route": "guard",
  "tier": 1,
  "requiredEnvironmentTags": [],
  "exclusiveGroup": "du_jian.primary_route"
}
```

是否掌握保存在单局状态，不写回定义。路线互斥由 `exclusiveGroup` 和内容包 `invariants` 双重校验。

## 8.2 知识与史证

史证使用有来源的说法，不只使用真假布尔值：

```json
{
  "id": "claim.zhao.edited_registry",
  "subjectId": "character.zhao_heng",
  "statementKey": "claim.zhao.edited_registry.statement",
  "defaultConfidence": "sourced",
  "contradicts": []
}
```

玩家本轮获得的是知识记录：说法 ID、来源、可信度和是否亲历。任朔周目输入只能增加知识或行动方法，不能直接授予杜缄武学。

# 9. 事件结构

```json
{
  "id": "event.changan.dujian.d02",
  "kind": "combat",
  "stage": "escort",
  "locationId": "location.changan.west_market_warehouse",
  "priority": 100,
  "textKey": "event.changan.dujian.d02.text",
  "actorIds": ["character.du_jian", "character.xu_jian"],
  "environmentTags": ["narrow", "doorway", "wooden_crates"],
  "choices": []
}
```

事件类型：

```text
scene / choice / combat / growth / capture / ending
```

每个可达非结局事件必须有 1～5 个选项；普通事件目标仍为 2～3 个，复杂抉择 3～4 个。

# 10. 选项、条件和结果

## 10.1 选项结构

```json
{
  "id": "choice.changan.dujian.d02.guard_xu",
  "labelKey": "choice.changan.dujian.d02.guard_xu.label",
  "intentKey": "choice.changan.dujian.d02.guard_xu.intent",
  "risk": "costly",
  "availability": { "op": "hasItem", "itemInstanceId": "item_instance.du_jian.short_sword", "states": ["intact", "damaged"] },
  "costs": [
    { "op": "spendResource", "resource": "breath", "amount": 1 }
  ],
  "resolutions": [
    {
      "default": true,
      "effects": [
        { "op": "addInsight", "route": "guard", "amount": 1 },
        { "op": "setCharacterFate", "characterId": "character.xu_jian", "fate": "protected" }
      ],
      "next": { "type": "event", "eventId": "event.changan.dujian.d03" }
    }
  ]
}
```

- `availability` 是权威条件；
- `costs` 在效果之前支付，不能支付时选项锁定；
- `resolutions` 按顺序匹配，第一个成立的结果生效；
- 每组选项结果必须有一个位于末尾的 `default: true`；
- `next` 只能进入已存在事件、结局检查或直接结束。

## 10.2 条件表达式

MVP 条件操作符：

| 操作符 | 用途 |
|---|---|
| `always` | 永远成立 |
| `all` / `any` / `not` | 组合条件 |
| `compare` | 比较白名单状态路径 |
| `hasFlag` / `hasConduct` | 检查标记或行止 |
| `hasItem` | 检查实例、持有者和物品状态 |
| `relationship` | 检查态度或关系标签 |
| `techniqueKnown` | 检查已掌握招式 |
| `knows` | 检查知识或史证 |
| `environmentHas` | 检查当前场景环境 |
| `characterFate` | 检查人物命运 |

禁止在条件中嵌入 JavaScript、Python 或任意表达式字符串。

## 10.3 效果操作符

MVP 效果分为：

- 资源：`spendResource`、`changeResource`、`setResource`；
- 状态：`changeInjury`、`setInjury`、`setHeat`、`setLife`、`setFreedom`；
- 标记：`addFlag`、`removeFlag`、`addConduct`、`removeConduct`；
- 关系与命运：`changeRelationship`、`addRelationshipTag`、`removeRelationshipTag`、`setCharacterFate`；
- 物品：`transferItem`、`setItemState`、`consumeItem`；
- 成长：`learnTechnique`、`addInsight`；
- 知识：`addKnowledge`；
- 调度：`scheduleEvent`、`cancelEvent`；
- 反馈：`emitFeedback`。

效果执行后仍必须经过 `SYSTEM_DESIGN.md` 定义的状态规范化和强制结局检查。

# 11. 条件分支与确定性

需要条件化结果时，使用有序 `resolutions`：

```json
"resolutions": [
  {
    "when": {
      "op": "relationship",
      "characterId": "character.aluo",
      "attitude": { "gte": 1 }
    },
    "effects": [
      { "op": "addFlag", "flag": "escort_intact" }
    ],
    "next": { "type": "event", "eventId": "event.changan.dujian.d10" }
  },
  {
    "default": true,
    "effects": [
      { "op": "setCharacterFate", "characterId": "character.civilians", "fate": "captured_one" }
    ],
    "next": { "type": "event", "eventId": "event.changan.dujian.d10" }
  }
]
```

不允许：

- “可能成功”；
- 未声明概率的随机抽签；
- 依赖文本暗示但没有状态条件；
- 多个结果同时匹配后由引擎任意选择。

# 12. 跳转与调度

`next` 支持：

```json
{ "type": "event", "eventId": "event.changan.dujian.d03" }
{ "type": "resolveEnding" }
{ "type": "end" }
```

- 普通主线优先使用显式事件跳转；
- 延迟人物事件使用 `scheduleEvent`；
- 历史阶段事件由稳定优先级调度；
- 相同优先级按事件 ID 排序；
- 不随机抽取主线节点。

# 13. 结局结构

```json
{
  "id": "ending.changan.dujian.protect",
  "family": "protect",
  "priority": 400,
  "titleKey": "ending.changan.dujian.protect.title",
  "summaryKey": "ending.changan.dujian.protect.summary",
  "when": {},
  "excludeWhen": null,
  "requiredCosts": ["identity_or_school_or_evidence_or_freedom"]
}
```

结局解析：

1. 规范化状态；
2. 计算生死、自由和人物命运；
3. 过滤满足 `when` 且不满足 `excludeWhen` 的结局；
4. 按 `priority` 从高到低取唯一主结局；
5. 追加武学、装备、行止和江湖评语。

相同优先级的两个可达结局视为内容错误，不靠数组顺序解决。

# 14. 文本与本地化

事件和选项只引用文本 key：

```json
"texts": {
  "event.changan.dujian.d02.text": "废仓门轴才响半声……",
  "choice.changan.dujian.d02.guard_xu.label": "横剑挡在许简身前",
  "choice.changan.dujian.d02.guard_xu.intent": "留在许简身边，以内息换取保护"
}
```

MVP 允许文本内嵌在单语言内容包中。增加英文时，将 `texts` 拆成独立语言文件，规则对象和 ID 不变。

# 15. 校验规则

## 15.1 结构校验

- 必需字段存在且类型正确；
- ID 格式正确并在各注册表内唯一；
- 枚举值合法；
- 每个非结局事件有 1～5 个选项；
- 每个选项有代价数组、结果数组和最终默认结果；
- 条件与效果操作符在白名单中。

## 15.2 引用校验

- 入口事件存在；
- 人物、地点、物品定义、物品实例、武学、知识和文本 key 均存在；
- 事件跳转目标存在；
- 物品实例引用有效定义和持有者；
- 结局文本存在。

## 15.3 状态与可达性校验

- 从入口事件遍历可达图；
- 每个可达事件至少有一个状态下可用的选项；
- 无意外不可达事件；
- 资源不低于 0；
- 死亡、落网、收押和普通行动不冲突；
- 互斥路线、残谱去向等状态不能共存；
- 被没收或损坏物品不再提供能力；
- 落网续段最多一层；
- 每个主结局可达且优先级唯一；
- 不存在无代价完美路线。

当前 `tools/validate_content.py` 先执行结构、操作符和引用校验；完整状态空间遍历在杜缄路线数据化后加入。

# 16. 作者工作流

1. 在剧情文档中确认节点意图和动作逻辑；
2. 为人物、地点、物品和武学建立稳定 ID；
3. 编写事件文本 key 和选项；
4. 将条件、代价和效果写成结构化操作；
5. 运行内容校验器；
6. 运行代表路线回归测试；
7. 人工检查叙事反馈是否准确解释状态变化；
8. 提交内容包、测试和版本号。

如果一个结果无法用现有操作符表达，应先判断它是否属于可复用规则。不得为单个选项直接嵌入任意脚本。

# 17. 存档与版本迁移

存档必须记录：

- `schemaVersion`；
- `contentVersion`；
- `bundleId`；
- 当前事件 ID；
- 单局状态；
- 已调度事件；
- 行动日志。

迁移原则：

- 增加可选文本字段可只升级内容版本；
- 改字段名、枚举或状态含义必须升级 Schema；
- 删除已经进入存档的 ID 时必须提供映射；
- 无法安全恢复的旧单局可只保留结局和跨周目档案；
- 迁移不得丢失已经发现的见闻和人物结局。

# 18. MVP 与后续扩展

## 18.1 MVP 实现

- 单内容包 JSON；
- 单语言内嵌文本；
- 明确条件和效果白名单；
- 确定性事件跳转；
- 人物关系、物品实例、武学、知识和结局；
- Python 校验器和代表路线测试。

## 18.2 后续再增加

- YAML 作者格式和构建转换；
- 独立本地化文件；
- SQLite 索引和可视化编辑器；
- 固定种子挑战事件池；
- 存档自动迁移工具；
- 跨篇章依赖包；
- 内容差异和路线覆盖率报告。

暂不加入任意脚本、程序生成剧情、复杂经济和多人同步状态。

# 19. 下一步

1. 使用本 Schema 完整转换 `DU_JIAN_ROUTE.md`；
2. 将五条代表路线改为读取真实内容数据，而不是手写状态转换；
3. 增加事件图遍历、资源边界和结局可达性检查；
4. 修正数据化过程中暴露的剩余歧义；
5. 杜缄全路线通过后再编写任朔内容包。

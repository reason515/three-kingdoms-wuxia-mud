<div align="center">

<span style="font-size: 30px;"><strong>《汉末江湖录》</strong></span><br/>
<span style="font-size: 18px;">历史夹缝中的三国武侠周目制文字 RPG</span>

</div>

---

# 项目简介

《汉末江湖录》是一款正在设计中的移动端优先、选择驱动、可反复挑战的三国武侠文字 RPG。

玩家将以无名小人物的身份进入真实三国历史事件的夹缝，在每个场景提供的 2～5 个行动之间作出取舍，调查隐秘、结交人物、修习武艺，并决定那些未被史书记载之人的命运。

> 大势或不可改，人心自有去处。

# 核心特色

- **三国史实与适度虚构**：重要史实构成历史锚点，虚构主要发生在史书留白、事件过程和小人物命运中。
- **按钮与命令并行的 MUD 行动**：可观察、搜索、交谈、移动、练功、调息和迎战；无需记忆命令，也可直接输入 `look`、`status`、`go`、`attack` 等命令。
- **可查看的角色状态**：随时查看等级、阅历、气血、体力、内息、伤势、熟练、行囊、武学和行动记录。
- **情节与实战共同驱动成长**：有限训练、多回合战斗、指点和秘籍会提升熟练并解锁新招式。
- **少量独特的秘籍装备**：兵器、衣甲、信物和残谱既提供能力，也带来暴露、时间或关系代价。
- **多周目求真**：不同人物只能看到局部真相，但真相服务于江湖抉择而非取代武侠主线。
- **人物命运图谱**：结算不仅呈现主角结局，也记录关键人物的生死、归属、关系与名声。
- **MUD 式文字表现**：通过地点、持续状态、招式成长、战斗回显和有空间感的文字描写保留 MUD 的沉浸力。
- **移动端优先**：场景文本与 2～5 个上下文行动构成主要界面，Web 用于快速验证玩法。

# 当前设计方向

核心循环：

```text
选择身份与专长
→ 进入历史篇章
→ 阅读场景与局势
→ 在2～5个行动中取舍
→ 改变资源、关系、风声和情报
→ 经历历史节点、交锋与人物事件
→ 获得结局、人物命运和史证
→ 以新身份或新路线再次进入
```

重复游玩的动力依次来自：

1. 尝试不同武学路线与关键交锋；
2. 探索人物命运与江湖恩义；
3. 收集秘籍、装备经历和武学称号；
4. 从不同人物视角理解历史；
5. 完成不杀、低伤、基础武功等挑战；
6. 在公平条件下参与排行榜竞争。

# 首个垂直切片

首个篇章暂定为 **《长安残照》**：

- 时间：初平三年（192 年）；
- 背景：董卓被诛，王允掌权，李傕、郭汜即将反攻长安；
- 固定大势：长安陷落、王允身死、吕布败走；
- 玩家空间：决定密信与名册的归属、无名者的生死、情报的真假及后世留下的记录；
- 目标：验证玩家通关后是否愿意立即换一种身份再次挑战。

# 项目状态

项目目前处于**可试玩 Web 垂直切片与纸面测试阶段**。杜缄、任朔两条路线已经数据化并完成 v0.2 沉浸整改。

当前重点：

- 验证自由探索、命令输入、有限练功和多回合战斗是否形成持续可玩性；
- 通过 5～10 人测试验证行动回响、人物关系和条件尾声是否增强代入感；
- 验证武学熟练与新招式是否改变探索、战斗和剧情选择；
- 验证秘籍装备是否产生真实机会成本；
- 验证不同周目是否带来新打法、新关系语境和新认知；
- 根据玩家停留、犹豫和重开行为删减无效选项；
- 继续校验人物命运、装备、伤势和场景文本的连续性。

# 文档导航

| 文档 | 内容 |
|---|---|
| [`docs/VISION.md`](docs/VISION.md) | 项目愿景、产品定位与设计支柱 |
| [`docs/GAME_CONCEPT.md`](docs/GAME_CONCEPT.md) | 完整游戏概念、循环、成长、结局与 MVP |
| [`docs/STORY_BIBLE.md`](docs/STORY_BIBLE.md) | 《长安残照》的历史边界、人物、武学、秘籍装备与多周目结构 |
| [`docs/MVP_DESIGN.md`](docs/MVP_DESIGN.md) | MVP 的玩法范围、成长、战斗、装备、测试和通过标准 |
| [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) | 确定性规则内核、状态结算、战斗成长、存档与未来扩展边界 |
| [`docs/CONTENT_SCHEMA.md`](docs/CONTENT_SCHEMA.md) | JSON 内容包、条件效果、即时结果、条件场景、结局与校验规范 |
| [`docs/IMMERSION_OVERHAUL.md`](docs/IMMERSION_OVERHAUL.md) | v0.2 沉浸整改范围、数据变化、质量门禁与测试重点 |
| [`docs/MUD_MECHANICS_REFACTOR.md`](docs/MUD_MECHANICS_REFACTOR.md) | 探索、命令、状态、有限练功、多回合战斗与跨周目解锁 |
| [`docs/PLAYER_EXPERIENCE_REFACTOR_PLAN.md`](docs/PLAYER_EXPERIENCE_REFACTOR_PLAN.md) | 玩家困惑诊断、统一界面、状态解释、时间线、战斗与分阶段重构计划 |
| [`docs/DU_JIAN_ROUTE.md`](docs/DU_JIAN_ROUTE.md) | 杜缄路线的12个实际事件节点、选项、状态与结局判定 |
| [`docs/REN_SHUO_ROUTE.md`](docs/REN_SHUO_ROUTE.md) | 任朔路线的10个事件节点、选项、结局与双人物交叉状态 |
| [`content/changan/du_jian/route.json`](content/changan/du_jian/route.json) | 杜缄路线完整可执行内容包：19个事件、80个选项 |
| [`content/changan/ren_shuo/route.json`](content/changan/ren_shuo/route.json) | 任朔路线完整可执行内容包：13个事件、55个选项 |
| [`docs/DU_JIAN_MECHANICS_VALIDATION.md`](docs/DU_JIAN_MECHANICS_VALIDATION.md) | 杜缄五条代表路线、边界状态、修正记录与机制验证结论 |
| [`docs/NATURAL_LANGUAGE_INTERACTION.md`](docs/NATURAL_LANGUAGE_INTERACTION.md) | 移动端选择交互及可选自然语言增强 |
| [`docs/UI_DESIGN_SPEC.md`](docs/UI_DESIGN_SPEC.md) | 水墨宣纸视觉系统与响应式 UI 规范 |
| [`docs/mobile-ui-concept.html`](docs/mobile-ui-concept.html) | 可交互的移动端游戏主界面概念 |
| [`docs/mobile-ui-concept-mobile.png`](docs/mobile-ui-concept-mobile.png) | 移动端概念图静态预览 |
| [`docs/PROJECT_SKILLS.md`](docs/PROJECT_SKILLS.md) | 项目专属 Skills 的职责与使用规划 |
| [`DESIGN.md`](DESIGN.md) | 设计与视觉规范索引 |

# 项目结构

```text
three-kingdoms-wuxia-mud/
├── README.md
├── DESIGN.md
├── docs/       # 愿景、玩法、交互与 UI 设计文档
└── skills/     # 项目专属设计、写作和开发 Skills
```

# 本地运行与测试

启动可试玩页面：

```bash
python serve.py
```

推荐访问 `http://127.0.0.1:8080/docs/game.html`；若未使用本机代理，也可以访问 `http://localhost:8080/docs/game.html`。启动脚本会自动检测重复服务和端口占用。

首次运行真实浏览器 E2E 前安装 Playwright：

```bash
pip install playwright
playwright install chromium
```

运行完整校验：

```bash
python tools/validate_all.py
```

其中 `tools/e2e_browser.py` 会在随机空闲端口启动隔离服务器，真实点击杜缄守剑与任朔护军完整路线，并检查即时结果、状态变化、存档续玩、结局、移动端布局、桌面设备框、HTTP 失败和浏览器控制台错误。

# 设计原则

出现设计分歧时，优先判断：

1. 是否增强玩家身处汉末历史现场的感觉；
2. 是否制造有信息依据的真实取舍；
3. 是否改变后续状态、路线、关系或认知；
4. 是否为重复游玩提供新视角，而不是重复劳动；
5. 是否能够通过移动端少量选项清晰完成；
6. 是否适合先做成小而完整的历史篇章。

# 说明

本仓库当前主要用于保存设计文档与项目专属 Skills。玩法、剧情和技术方案仍在迭代中。

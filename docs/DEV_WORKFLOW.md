<div align="center">

<span style="font-size: 28px;"><strong>《汉末江湖录》开发工作流</strong></span><br/>
<span style="font-size: 18px;">Living Spec · 人类与 AI 可共同执行 · v1.0</span>

</div>

---

# 1. 文档目的

本文档是项目开发流程的唯一权威来源。读者：

- **开发者**（含 AI 编码助手）：每次改动前查阅流程，改动后执行检查清单
- **CI 流水线**：自动化脚本的规范依据

核心原则：

> 每次改动必须交付三项产出——实现代码、校验测试、E2E 覆盖。三项全部通过才算"完成"。

# 2. 项目结构

```text
three-kingdoms-mud/
├── package.json              # workspace root
├── turbo.json                # monorepo 编排
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── docs/
│   ├── RECONSTRUCTION.md     # 游戏重构方案
│   ├── DEV_WORKFLOW.md       # 本文档
│   └── legacy/               # 旧项目设计档案（只读）
│       └── ...
├── packages/
│   ├── content/              # 内容数据（YAML + Zod schema + 校验器）
│   │   ├── package.json
│   │   ├── rooms/            # 房间数据
│   │   ├── npcs/             # NPC 数据
│   │   ├── skills/           # 技能数据
│   │   ├── items/            # 物品数据
│   │   ├── quests/           # 任务数据
│   │   ├── src/
│   │   │   ├── schema/       # Zod schema 定义
│   │   │   └── validate/     # 校验器
│   │   └── test/             # 内容校验测试
│   ├── server/               # 游戏服务层
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── room.ts
│   │   │   │   ├── combat.ts
│   │   │   │   ├── skill.ts
│   │   │   │   ├── idle.ts
│   │   │   │   ├── quest.ts
│   │   │   │   └── faction.ts
│   │   │   ├── tick.ts       # World Tick
│   │   │   ├── eventbus.ts   # 事件总线
│   │   │   ├── protocol.ts   # 通信协议定义
│   │   │   └── db/           # 数据库层
│   │   └── test/             # 引擎单元/集成测试
│   ├── gateway/              # WebSocket 网关
│   │   ├── package.json
│   │   ├── src/
│   │   └── test/
│   └── web/                  # PWA 前端
│       ├── package.json
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── styles/
│       ├── test/             # 单元测试（Vitest）
│       └── e2e/              # E2E 测试（Playwright）
│           ├── smoke.spec.ts
│           ├── combat.spec.ts
│           ├── room.spec.ts
│           ├── skill.spec.ts
│           ├── idle.spec.ts
│           └── content.spec.ts
└── tools/                    # 管理后台 + CI 脚本
    ├── admin/                # Web 管理面板
    └── ci/                   # CI 辅助脚本
```

# 3. 统一命令入口

## 3.1 根目录 script（pnpm）

| 命令 | 作用 | 运行层级 |
|------|------|---------|
| `pnpm dev` | 启动全部开发服务（server + gateway + web） | 根（turbo） |
| `pnpm test` | 运行全部单元/集成测试 + 内容校验 | 根（turbo） |
| `pnpm test:e2e` | 运行烟雾 E2E | `web` 包 |
| `pnpm test:e2e -- combat` | 按 scope 运行领域 E2E | `web` 包 |
| `pnpm test:all` | 全量测试（unit + content + e2e full）| 根（turbo） |
| `pnpm lint` | TypeScript + ESLint 全量检查 | 根（turbo） |
| `pnpm typecheck` | TypeScript 编译检查（不输出） | 根（turbo） |
| `pnpm build` | 生产构建 | 根（turbo） |
| `pnpm validate` | 内容数据校验（仅 content 包） | `content` 包 |

## 3.2 各包子命令

```text
# server 包
cd packages/server
pnpm dev            # 启动游戏服务（含 tick）
pnpm test           # 引擎测试
pnpm test:watch     # watch 模式（保存即跑）

# content 包
cd packages/content
pnpm validate       # YAML schema 校验
pnpm test           # 内容完整性测试

# web 包
cd packages/web
pnpm dev            # Vite dev server
pnpm test           # Vitest 单元测试
pnpm test:e2e       # Playwright E2E（默认烟雾）

# gateway 包
cd packages/gateway
pnpm dev            # WebSocket 网关
pnpm test           # 协议测试
```

# 4. 开发流程

## 4.1 单次改动完整流程

```mermaid
flowchart TB
    A["开始改动"] --> B["写代码<br>+ 单元/集成测试"]
    B --> C{改动涉及<br>内容数据?}
    C -->|是| D["更新 YAML<br>+ 新增内容校验测试"]
    C -->|否| E{改动涉及<br>玩家可感知行为?}
    D --> E
    E -->|是| F["新增/更新领域 E2E"]
    E -->|否| G["运行领域测试"]
    F --> G
    G --> H["运行烟雾 E2E<br>pnpm test:e2e"]
    H --> I{通过?}
    I -->|否| J["修 bug"]
    J --> B
    I -->|是| K["提交<br>scope: message"]
    K --> L["完成"]

    classDef start fill:#f0fff4,stroke:#38a169,color:#1a4731,stroke-width:2px
    classDef action fill:#ebf4ff,stroke:#2b6cb0,color:#1a365d,stroke-width:2px
    classDef decision fill:#fffff0,stroke:#d69e2e,color:#5c4a1f,stroke-width:2px
    classDef danger fill:#fff5f7,stroke:#d53f8c,color:#521b3a,stroke-width:2px
    classDef end fill:#f7fafc,stroke:#718096,color:#2d3748,stroke-width:1px

    class A start
    class B,D,F,G,H,K action
    class C,E,I decision
    class J danger
    class L end
```

## 4.2 检查清单

改动完成时逐项确认：

- [ ] 实现代码通过 TypeScript 编译（`pnpm typecheck`）
- [ ] 所有单元/集成测试通过（`pnpm test` 或包内 `pnpm test`）
- [ ] 如涉及内容数据：YAML schema 校验通过 + 内容测试通过（`pnpm validate`）
- [ ] 如涉及玩家可感知行为：领域 E2E 已新增/更新
- [ ] 烟雾 E2E 全部 8 条通过（`pnpm test:e2e`）
- [ ] commit 提交，scope 正确标注

# 5. 测试策略

## 5.1 测试金字塔

```text
        ┌───────────┐
        │  E2E      │  每改动 1-3 条领域用例
        │  烟雾 8条  │  每次改动都跑
        ├───────────┤
        │  集成测试  │  引擎间边界 + 数据库
        ├───────────┤
        │  单元测试  │  引擎方法 + 工具函数
        ├───────────┤
        │  内容校验  │  YAML schema + 引用完整性
        └───────────┘
```

## 5.2 各层职责

### 单元测试（Vitest — `packages/server/test/`、`packages/web/test/`）

**跑在**：保存时（watch 模式应尽快反馈）

**覆盖**：
- 战斗公式计算（伤害/命中/暴击）
- 技能解锁条件判定
- 挂机收益公式（在线 vs 离线）
- 命令解析器（中文/英文别名映射）
- 协议序列化/反序列化
- UI 组件渲染（React Testing Library）

**命名约定**：`engine/combat.test.ts` ↔ `engine/combat.ts`

**示例**：

```typescript
// packages/server/test/engine/combat.test.ts
import { describe, it, expect } from "vitest";
import { calculateDamage, hitCheck } from "../../src/engine/combat";

describe("combat - damage calculation", () => {
  it("base damage without modifiers", () => {
    const dmg = calculateDamage({ baseAtk: 20, str: 15, skillLvl: 0, weaponMod: 1.0 });
    expect(dmg).toBeCloseTo(23, 0); // 20 * (1 + 15/100) * 1.0
  });

  it("西凉刀法破甲 vs 轻甲", () => {
    const dmg = calculateDamage({
      baseAtk: 30,
      str: 20,
      skillLvl: 3,
      weaponMod: 1.2,
      targetDef: 10,
      targetCon: 12,
      armorPiercing: true,
    });
    expect(dmg).toBeGreaterThan(40);
  });
});
```

### 集成测试

**跑在**：手动或 CI

**覆盖**：
- 战斗引擎 → 技能引擎触发关系（击败敌人应触发熟练度增加）
- 挂机引擎 → 数据库持久化（离线 tick 后角色状态写入 SQLite）
- 任务引擎 → 阵营系统（完成任务后声望正确变化）
- WebSocket 网关 → 游戏服务消息转发

### 内容校验测试（Vitest — `packages/content/test/`）

**跑在**：每次 YAML 修改后

**覆盖**：
- 每个 YAML 文件符合 Zod schema
- 所有引用的 ID 真实存在（房间/NPC/技能/物品/任务）
- 出口 `exits` 指向的房间存在，且双向连通
- 怪物重生计时器 >= 0，掉落表 ID 存在
- 技能系数在合理范围内
- 装备属性不超过上限

**示例**：

```typescript
// packages/content/test/rooms.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { glob } from "glob";
import { RoomSchema } from "../src/schema/room";
import { existsInMap } from "../src/validate/references";

const roomFiles = glob.sync("rooms/**/*.yml");

describe("content - rooms", () => {
  it.each(roomFiles)("%s passes schema validation", (file) => {
    const yaml = readFileSync(file, "utf-8");
    const result = RoomSchema.safeParse(yaml);
    expect(result.success, result.error?.message).toBe(true);
  });

  it("all room exits reference existing rooms", () => {
    for (const file of roomFiles) {
      const room = RoomSchema.parse(readFileSync(file, "utf-8"));
      for (const [dir, targetId] of Object.entries(room.exits)) {
        expect(existsInMap(targetId), `${file}: exit ${dir} → ${targetId} not found`).toBe(true);
      }
    }
  });

  it("all room exits are bidirectional", () => {
    // 如果 A 的 east 指向 B，B 的 west 应该指向 A
    // ...
  });
});
```

### E2E 测试（Playwright — `packages/web/e2e/`）

**组织结构**：

```text
e2e/
├── smoke.spec.ts        # 8 条烟雾用例，每次改动都跑
├── combat.spec.ts       # 战斗领域
├── room.spec.ts         # 房间/地图领域
├── skill.spec.ts        # 技能/修炼领域
├── idle.spec.ts         # 挂机领域
├── quest.spec.ts        # 任务/对话领域
├── content.spec.ts      # 内容渲染验证
└── fixtures/            # 测试夹具
    ├── test-account.ts  # 自动注册测试账号
    └── helpers.ts       # 通用断言
```

**烟雾测试 8 条用例**（`smoke.spec.ts`，目标 45 秒）：

```typescript
import { test, expect } from "@playwright/test";
import { registerTestAccount, login } from "./fixtures/test-account";

test.describe("smoke", () => {
  test("1. server health check", async ({ request }) => {
    const res = await request.get("http://localhost:3001/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  test("2. WebSocket connects successfully", async ({ page }) => {
    await page.goto("/");
    const wsConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket("ws://localhost:3001/ws");
        ws.onopen = () => resolve(true);
        ws.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 3000);
      });
    });
    expect(wsConnected).toBe(true);
  });

  test("3. create character and spawn at inn", async ({ page }) => {
    const account = registerTestAccount();
    await page.goto("/");
    await page.fill('[data-testid="username"]', account.username);
    await page.fill('[data-testid="password"]', account.password);
    await page.click('[data-testid="login-btn"]');
    // 首次登录 → 创建角色页面
    await page.fill('[data-testid="char-name"]', account.charName);
    await page.click('[data-testid="roll-attr"]');
    await page.click('[data-testid="confirm-create"]');
    // 降生客店
    await expect(page.locator('[data-testid="room-title"]')).toContainText("客店");
  });

  test("4. look at room", async ({ page }) => {
    // 已有角色登录
    await page.click('[data-testid="btn-look"]');
    await expect(page.locator('[data-testid="room-desc"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="exits"]')).toBeVisible();
  });

  test("5. move to adjacent room", async ({ page }) => {
    await page.click('[data-testid="exit-east"]');
    await expect(page.locator('[data-testid="room-title"]')).not.toContainText("客店");
  });

  test("6. auto-combat one round", async ({ page }) => {
    // 需要在一个有怪物的房间
    await page.goto("/debug/room?withMonster=true");
    await page.click('[data-testid="btn-attack"]');
    await page.click('[data-testid="combat-auto"]');
    await expect(page.locator('[data-testid="battle-log"]')).toBeVisible();
    await page.waitForTimeout(3000); // 等一个心跳
    await expect(page.locator('[data-testid="battle-log-entry"]').first()).toBeVisible();
  });

  test("7. start training and receive tick", async ({ page }) => {
    await page.click('[data-testid="tab-train"]');
    await page.click('[data-testid="train-start"]');
    await expect(page.locator('[data-testid="train-status"]')).toContainText("修炼中");
    await page.waitForTimeout(3000); // 等 tick 结算
    await expect(page.locator('[data-testid="train-progress"]')).not.toHaveText("0");
  });

  test("8. disconnect and reconnect", async ({ page }) => {
    // 模拟断网
    await page.evaluate(() => {
      // 强制关闭 WebSocket
      (window as any).__testCloseWS?.();
    });
    await expect(page.locator('[data-testid="connection-lost"]')).toBeVisible();
    // 自动重连
    await expect(page.locator('[data-testid="connection-lost"]')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="room-title"]')).toBeVisible();
  });
});
```

**领域 E2E 示例**（`combat.spec.ts`）：

```typescript
import { test, expect } from "@playwright/test";
import { loginTestChar, moveToRoom } from "./fixtures/helpers";

test.describe("combat", () => {
  test("自动心跳战中气血归零则战败", async ({ page }) => {
    await loginTestChar(page);
    await moveToRoom(page, "changan.west_market"); // 有劫掠者
    await page.click('[data-testid="btn-attack"]');
    // 通过 debug API 把角色气血设为 1
    await page.evaluate(() => fetch("/debug/set-hp/1"));
    await page.click('[data-testid="combat-auto"]');
    await page.waitForTimeout(5000);
    await expect(page.locator('[data-testid="combat-result"]')).toContainText("战败");
  });

  test("手动回合战中可以使用招式破甲", async ({ page }) => {
    // ...
  });

  test("战斗策略面板配置后自动释放技能", async ({ page }) => {
    // ...
  });
});
```

## 5.3 CI 测试触发规则

```yaml
# turbo.json 核心逻辑
tasks:
  test:
    dependsOn: ["^build"]
  test:e2e:
    cache: false
```

**手动运行规则**：

| 场景 | 命令 | 预期时间 |
|------|------|---------|
| 保存代码时 | `vitest --watch`（自动） | < 1 秒 |
| 改动完成 | `pnpm test:e2e`（烟雾） | < 45 秒 |
| 改动涉及 combat | `pnpm test:e2e -- combat` + 烟雾 | < 90 秒 |
| 改动涉及 content | `pnpm validate && pnpm test:e2e -- content` | < 60 秒 |
| 改动涉及多个领域 | 逐领域跑 E2E + 烟雾 | < 3 分钟 |
| 合并/发版前 | `pnpm test:all`（全量） | < 10 分钟 |

# 6. Commit 规范

## 6.1 格式

```text
scope: 简短描述
```

**scope** 必须是以下之一：

| scope | 含义 | 触发 E2E |
|-------|------|---------|
| `combat` | 战斗引擎 | `combat.spec.ts` |
| `skill` | 技能/修炼引擎 | `skill.spec.ts` |
| `idle` | 挂机引擎 | `idle.spec.ts` |
| `room` | 房间/地图引擎 | `room.spec.ts` |
| `quest` | 任务引擎 | `quest.spec.ts` |
| `faction` | 阵营系统 | （暂无，后续添加） |
| `content` | 内容数据（YAML） | `content.spec.ts` |
| `gateway` | 网关 | gateway 测试 |
| `web` | 前端 UI | web 单元测试 |
| `server` | 游戏服务（跨引擎改动） | 烟雾 + 受影响的引擎 E2E |
| `docs` | 仅文档改动 | 无 E2E |
| `fix` | 修复（不明确归属的 bug） | 烟雾 |
| `chore` | 工程配置（构建/依赖） | 烟雾 |

## 6.2 示例

```text
combat: 西凉刀法破甲效果实现
skill: 熟练度 30 解锁截腕招式
room: 长江西市 6 间房初始数据
content: 新增 3 种西凉军 NPC 配置
idle: 离线修炼上限调整为 8 小时
fix: 断线重连后房间描述为空
server: 事件总线重构，引擎间解耦
docs: 新增开发工作流文档
```

## 6.3 CI 自动检测兜底

除 commit scope 外，CI 同时检测文件变更路径作为兜底：

```text
packages/content/rooms/**       → 自动加跑 content 校验
packages/server/src/engine/combat.ts  → 自动加跑 combat E2E
packages/web/src/components/    → 自动加跑烟雾 E2E
```

两条规则取并集——如果 commit scope 标注 `combat` 但实际只改了 `docs/`，两条线都跑，不会漏。

# 7. 内容创建流程

策划（或手写 YAML 的开发者）新增内容的完整流程：

## 7.1 新增一间房

```text
1. 在 packages/content/rooms/changan/west_market.yml 定义房间
2. 运行 pnpm validate → 检查 schema + 引用完整性
3. 运行 pnpm test:e2e -- content → 验证房间在浏览器中渲染正确
4. 编写内容测试（如出口双向性）
5. 编写领域 E2E（如"从客店移动到西市"）
6. 提交：content: 新增长安西市房间
```

## 7.2 新增一个技能

```text
1. 在 packages/content/skills/blade/xi_liang_dao.yml 定义技能
2. 运行 pnpm validate
3. 在 server 侧写单元测试（伤害计算/解锁条件）
4. 编写领域 E2E（"学会西凉刀法后战斗伤害正确"）
5. 提交：skill: 新增西凉刀法
```

## 7.3 新增一个任务

```text
1. 在 packages/content/quests/changan_newbie_guide.yml 定义任务链
2. 运行 pnpm validate → 检查对话引用的 NPC 存在、奖励物品存在
3. 编写领域 E2E（"新手引导 5 步完整走完"）
4. 提交：quest: 新增长安新手引导任务链
```

# 8. 开发环境

## 8.1 前置条件

- Node.js ≥ 18
- pnpm ≥ 8
- Git

## 8.2 一键启动

```bash
git clone <repo>
cd three-kingdoms-mud
pnpm install
pnpm dev           # 同时启动 server + gateway + web
```

浏览器打开 `http://localhost:5180`

## 8.3 首次配置 E2E

```bash
cd packages/web
npx playwright install chromium
```

# 9. 质量门禁

每次改动完成前的必过关卡：

| 门禁 | 命令 | 通过标准 |
|------|------|---------|
| 类型检查 | `pnpm typecheck` | 0 错误 |
| Lint | `pnpm lint` | 0 错误 |
| 单元/集成测试 | `pnpm test` | 全部通过 |
| 内容校验（如涉及） | `pnpm validate` | 全部通过 |
| 烟雾 E2E | `pnpm test:e2e` | 8/8 通过 |
| 领域 E2E（如涉及） | `pnpm test:e2e -- <scope>` | 全部通过 |

**预提交检查（git hook）**：

```bash
# .husky/pre-commit
pnpm typecheck
pnpm lint
pnpm validate  # 快速，只检查 schema
pnpm test:e2e  # 烟雾
```

任一失败则阻止提交。

# 10. 目录快速参考

| 我想…… | 去这里 |
|--------|--------|
| 添加/修改房间 | `packages/content/rooms/` |
| 添加/修改技能 | `packages/content/skills/` |
| 添加/修改 NPC | `packages/content/npcs/` |
| 添加/修改物品 | `packages/content/items/` |
| 添加/修改任务 | `packages/content/quests/` |
| 修改战斗逻辑 | `packages/server/src/engine/combat.ts` |
| 修改修炼逻辑 | `packages/server/src/engine/skill.ts` |
| 修改挂机逻辑 | `packages/server/src/engine/idle.ts` |
| 修改房间引擎 | `packages/server/src/engine/room.ts` |
| 修改通信协议 | `packages/server/src/protocol.ts` |
| 修改前端 UI | `packages/web/src/components/` |
| 写引擎单元测试 | `packages/server/test/` 或同目录 `*.test.ts` |
| 写内容校验 | `packages/content/test/` |
| 写 E2E 测试 | `packages/web/e2e/` |
| 写前端单元测试 | `packages/web/test/` 或同目录 `*.test.ts` |
| 看游戏设计文档 | `docs/RECONSTRUCTION.md` |
| 看旧项目设计档案 | `docs/legacy/` |

---

<div align="center">

<span style="font-size: 14px; color: #718096;">文档版本 v1.0 · 2025 年 7 月 · 基于 Grill-Me 决策访谈生成</span>

</div>

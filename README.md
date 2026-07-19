<div align="center">

<span style="font-size: 30px;"><strong>《汉末江湖录》</strong></span><br/>
<span style="font-size: 18px;">长安纪 · 持久世界 MUD</span>

</div>

---

# 1. 项目状态

项目正按 `docs/DEVELOPMENT_PLAN.md` 从旧版分支叙事原型重构为移动端优先的持久世界 MUD。

当前完成 **W1：工程骨架与可重复测试环境**：pnpm/Turbo monorepo、SQLite/Drizzle 数据库迁移、最小内容校验、server health endpoint、WebSocket 网关基座、React Web 壳和 Playwright Smoke。

# 2. 工作区

```text
packages/
├── content/  # YAML 内容、Zod schema 与校验器
├── server/   # 游戏服务、Drizzle/SQLite 与引擎
├── gateway/  # WebSocket 网关与协议
└── web/      # React/Vite PWA 与 Playwright E2E
```

# 3. 本地开发

## 3.1 前置条件

- Node.js 22+
- pnpm 11+

## 3.2 安装与启动

```bash
pnpm install
pnpm dev
```

- Web：`http://127.0.0.1:5180`
- Game Server health：`http://127.0.0.1:3001/health`
- Gateway health：`http://127.0.0.1:3002/health`

## 3.3 数据库

```bash
pnpm db:migrate  # 应用 SQLite migration
pnpm db:reset    # 回滚开发数据库 schema
```

默认开发数据库位于 `packages/server/data/hanmo.db`，不会提交到 Git。

# 4. 校验命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm validate
pnpm test:e2e
pnpm test:all
```

每项玩家可感知功能应按 `docs/DEV_WORKFLOW.md` 增加对应领域 E2E，并在提交前运行 Smoke。

# 5. 设计与计划

- `docs/RECONSTRUCTION.md`：持久世界 MUD 的设计与架构边界
- `docs/DEVELOPMENT_PLAN.md`：需求追溯、工作周与里程碑
- `docs/DEV_WORKFLOW.md`：实现、测试与质量门禁流程
- `docs/UI_DESIGN_SPEC.md`：水墨宣纸视觉规范

旧版叙事原型资料保留在仓库中，仅作设计档案；新功能以以上三份重构文档为准。

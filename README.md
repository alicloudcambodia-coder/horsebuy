# 🐎 horsebuy

**SEA 版 POUNDING · 多平台电商代运营 SaaS + Agent 平台**

从 1688 一键选品 → AI 翻译 + 图片本地化 → 多平台上架 (Shopee 越南/泰国/Lazada).

> **07/07 v3 项目骨架** · 从 0 起 · Node.js/TypeScript + Fastify + Prisma + PostgreSQL + Telegraf
> **架构**: 参照 POUNDING v0.1 · 合入 POUNDING 对比报告 13 差距
> **目标**: 24 周 (07/07-12/21) 上线 + 5-10 家付费商家内测

---

## 一、快速开始

### 前置

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Docker (跑 Postgres) 或本地 PostgreSQL 17

### 装 & 跑

```bash
# 1. 装依赖
cd /Users/apple/projects/horsebuy
pnpm install

# 2. 起 Postgres (Docker 版, 最简单)
docker run -d --name horsebuy-pg \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=horsebuy \
    -e POSTGRES_DB=horsebuy \
    postgres:17

# 3. 复制 env
cp .env.example .env
# 主公改 .env 里的 DATABASE_URL / ANTHROPIC_API_KEY / TELEGRAM_BOT_TOKEN

# 4. Prisma migrate (建 4 类表 + tenant + shop + user)
pnpm db:generate
pnpm db:migrate

# 5. 起服务
pnpm dev
# → 🐎 horsebuy started on port 3000

# 6. 测健康
curl http://localhost:3000/healthz
# → {"ok":true,"service":"horsebuy",...}

# 7. 测搜索
curl -X POST http://localhost:3000/api/sourcing/1688/search \
    -H 'Content-Type: application/json' \
    -H 'X-Tenant-Id: 00000000-0000-0000-0000-000000000001' \
    -d '{"keyword": "厨房收纳", "limit": 5}'
```

---

## 二、项目结构

```
horsebuy/
├── package.json             # Node 20+, ESM, Fastify+Prisma+Zod+Telegraf
├── tsconfig.json            # strict TS
├── .env.example
├── .gitignore
├── prisma/
│   └── schema.prisma        # 🎯 4 类数据模型 + tenant + shop + user
├── src/
│   ├── index.ts             # Fastify server 入口
│   ├── env.ts               # Zod env 校验
│   ├── db.ts                # Prisma client 单例
│   ├── lib/
│   │   ├── logger.ts        # Pino
│   │   ├── tenant.ts        # 🎯 tenant 中间件 (差距 #7 前置)
│   │   ├── websocket.ts     # 🎯 7 种 event (差距 #4)
│   │   └── cost.ts          # 🎯 recordToolCall + withCost (差距 #5)
│   ├── routes/
│   │   ├── conversations.ts # POUNDING 7.1 · Agent 会话
│   │   ├── sourcing.ts      # POUNDING 7.2 · 1688 采集
│   │   └── shopee.ts        # POUNDING 7.3 · Shopee 业务
│   ├── providers/
│   │   └── alibaba.ts       # 🎯 1688 Provider Adapter (差距 #2)
│   ├── skills/
│   │   └── index.ts         # 5 大 Skill stub (W3+ 上真实现)
│   ├── agents/              # W3 Agent 编排层放这
│   └── bots/
│       └── merchant.ts      # 🎯 商家 Telegram Bot POC (差距 #8)
├── test/
│   └── health.test.ts       # vitest
├── .github/workflows/
│   └── ci.yml               # Postgres 服务 + typecheck + lint + test
└── README.md
```

---

## 三、架构 · POUNDING 4 层映射

```
入口层:  Telegraf Bot (src/bots/merchant.ts) + Fastify REST + WebSocket
Agent 层: src/agents/ (W3 上 Anthropic SDK 编排)
Skill 层: src/skills/ (5 大 Skill: sourcing/listing/copywriting/pricing/image)
Worker 层: (W5 建 src/workers/) — 1688 采集 / 图片 / 翻译 队列
Backend: Fastify + Prisma + PostgreSQL + WebSocket bus
```

---

## 四、当前状态 · Phase 0 · W1 Day 1 (07/07)

| 组件 | 状态 | 说明 |
|---|---|---|
| Backend 骨架 | ✅ 起步 | Fastify + Prisma + Zod + CORS + WS |
| 4 类数据模型 | ✅ | SourceProduct + ProductDraft + ListingTask + ToolCallLog |
| Tenant 中间件 | ✅ | X-Tenant-Id header 隔离 (JWT W17 加) |
| REST 接口族 | ✅ | 3 大族 conversations/sourcing/shopee |
| WebSocket bus | ✅ | 7 种 event 命名规范 |
| 1688 Provider Adapter | ✅ 接口 + Stub | 真 Provider W5 上 |
| 5 大 Skill | 🟡 stub | W3-W5 上 |
| Agent 编排 | 🔴 未起 | W3 上 (Anthropic SDK) |
| Worker 队列 | 🔴 未起 | W5 上 (Redis) |
| ShopeeAdapter | 🔴 未起 | W9 上 |
| 商家 Telegram Bot | ✅ POC | /find /list /tasks /health |
| CI (GitHub Actions) | ✅ | typecheck + lint + test |
| 测试骨架 | ✅ | vitest |

---

## 五、24 周计划 (07/07-12/21)

| Phase | 周期 | 主题 |
|---|---|---|
| **Phase 0** | W1-W6 (07/07-08/17) | 骨架 + 4 类数据 + Provider Adapter + Skill stub + Agent 编排 + MVP 边界 |
| Phase 1 | W7-W14 (08/18-10/12) | Shopee 越南 Adapter · 100 SKU 端到端 |
| Phase 2 | W15-W22 (10/13-12/07) | Shopee 泰国 + 稳定性 + 双站 300 SKU |
| Phase 3 | W23-W24 (12/08-12/21) | 内测 + **12/21 周日上线** |

详见: `~/Documents/0522/horsebuy_24周上线计划_v3_20260707.md`

---

## 六、5 个待主公决策 (07/12 前)

1. Backend 语言最终确认 (推荐保持 Node/TS, 已经跑起来了)
2. 1688 Provider 首选 (`aliopen` / `jushuitan` / `yuewen` / 其它) —— W1 Day 6 调研
3. LLM 首选 (Anthropic Claude / DeepSeek / Qwen) —— W3 前定
4. 图片生成服务商 (DALL-E / Midjourney / SD) —— W12 前定
5. 上线时"自动发布" vs "人工确认" —— W6 定

---

## 七、参考

- POUNDING 产品文档: `~/Library/.../uploads/pounding_ozon_product_doc.md`
- POUNDING 对比报告 v1: `~/Documents/0522/horsebuy_vs_pounding_对比调整建议_v1_20260707.md`
- 24 周计划 v3: `~/Documents/0522/horsebuy_24周上线计划_v3_20260707.md`

// horsebuy · Fastify server 入口
// 07/07 v3 · 0% → 55%, Node.js/TypeScript + Fastify + Prisma + Zod + Telegraf
// 参照 POUNDING v0.1 架构, 合入 13 差距对比报告

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { registerTenant } from './lib/tenant.js';
import { eventBus } from './lib/websocket.js';
import { conversationsRoutes } from './routes/conversations.js';
import { sourcingRoutes } from './routes/sourcing.js';
import { shopeeRoutes } from './routes/shopee.js';
import { prisma } from './db.js';

async function main() {
  const app = Fastify({
    // Fastify 5 breaking change: `logger` 只接配置对象, 传 pino instance 用 `loggerInstance`
    loggerInstance: logger,
    disableRequestLogging: env.NODE_ENV === 'production',
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(websocket);
  // Tenant 直接注册在 app 上, 不用 register (避免 plugin encapsulation, hook 才能在 routes 里生效)
  registerTenant(app);

  // Health
  app.get('/healthz', async () => ({
    ok: true,
    service: 'horsebuy',
    version: '0.1.0',
    ts: Date.now(),
  }));

  // /ws · WebSocket · POUNDING v0.1 Section 7.4
  app.get('/ws', { websocket: true }, (socket, request) => {
    const tenantId = request.tenantId ?? 'anonymous';
    eventBus.subscribe(tenantId, socket);
    socket.send(JSON.stringify({ name: 'connected', data: { tenantId, ts: Date.now() } }));

    socket.on('message', (raw) => {
      const text = raw.toString();
      // 简易心跳
      if (text === 'ping') socket.send('pong');
    });
  });

  // API 3 大族 · POUNDING v0.1 Section 7
  await app.register(conversationsRoutes, { prefix: '/api/conversations' });
  await app.register(sourcingRoutes, { prefix: '/api/sourcing/1688' });
  await app.register(shopeeRoutes, { prefix: '/api/shopee' });

  // 优雅关闭
  const shutdown = async () => {
    logger.info('shutting down...');
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info({ port: env.PORT, env: env.NODE_ENV }, '🐎 horsebuy started');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

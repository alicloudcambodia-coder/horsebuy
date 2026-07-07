// horsebuy · /api/shopee/* · 对比报告差距 #3 REST 接口族
// POUNDING v0.1 Section 7.3 (Ozon → Shopee, SEA 版)

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { eventBus } from '../lib/websocket.js';

const createTaskSchema = z.object({
  agent_id: z.string().default('horsebuy_shopee_vn'),
  conversation_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  shop_id: z.string().optional(),
  product_draft_ids: z.array(z.string().uuid()).min(1).max(100),
  cost_estimate_cny: z.number().nonnegative().optional(),
});

const pricingPreviewSchema = z.object({
  cost_cny: z.number().positive(),
  margin: z.number().min(0).max(1).default(0.35),
  platform_fee_pct: z.number().min(0).max(1).default(0.08),
  shipping_cny: z.number().nonnegative().default(3),
  cny_to_vnd: z.number().positive().default(3500), // 汇率 W13 换实时
});

export const shopeeRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/shopee/tasks · 创建上架任务
  fastify.post('/tasks', async (request, reply) => {
    const body = createTaskSchema.parse(request.body);

    const task = await prisma.listingTask.create({
      data: {
        tenantId: request.tenantId,
        agentId: body.agent_id,
        conversationId: body.conversation_id,
        userId: body.user_id,
        shopId: body.shop_id,
        productDraftIds: body.product_draft_ids,
        costEstimateCny: body.cost_estimate_cny,
        steps: [
          { name: 'collect_1688', status: 'pending' },
          { name: 'image_process', status: 'pending' },
          { name: 'copywriting_vi', status: 'pending' },
          { name: 'pricing', status: 'pending' },
          { name: 'shopee_publish', status: 'pending' },
        ],
        status: 'pending',
      },
    });

    eventBus.publish(request.tenantId, {
      name: 'listing.task.created',
      data: { task_id: task.id, agent_id: body.agent_id, product_count: body.product_draft_ids.length },
    });

    reply.code(201).send(task);
  });

  // GET /api/shopee/tasks/:id
  fastify.get<{ Params: { id: string } }>('/tasks/:id', async (request, reply) => {
    const task = await prisma.listingTask.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId },
      include: { toolCallLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!task) return reply.code(404).send({ error: 'not found' });
    reply.send(task);
  });

  // POST /api/shopee/tasks/:id/retry
  fastify.post<{ Params: { id: string } }>('/tasks/:id/retry', async (request, reply) => {
    const task = await prisma.listingTask.updateMany({
      where: { id: request.params.id, tenantId: request.tenantId, status: 'failed' },
      data: { status: 'pending' },
    });
    if (task.count === 0) {
      return reply.code(404).send({ error: 'task not found or not failed' });
    }
    reply.send({ retry: true });
  });

  // POST /api/shopee/drafts · 创建/追加商品草稿
  fastify.post<{ Body: unknown }>('/drafts', async (request, reply) => {
    const bodySchema = z.object({
      source_product_id: z.string().uuid().optional(),
      title_cn: z.string().min(1),
      category_shopee: z.string().optional(),
    });
    const body = bodySchema.parse(request.body);
    const draft = await prisma.productDraft.create({
      data: {
        tenantId: request.tenantId,
        sourceProductId: body.source_product_id,
        titleCn: body.title_cn,
        categoryShopee: body.category_shopee,
        status: 'draft',
      },
    });
    reply.code(201).send(draft);
  });

  // PATCH /api/shopee/drafts/:id
  fastify.patch<{ Params: { id: string }; Body: unknown }>('/drafts/:id', async (request, reply) => {
    const bodySchema = z.object({
      title_vi: z.string().optional(),
      description_vi: z.string().optional(),
      category_shopee: z.string().optional(),
      pricing: z.record(z.unknown()).optional(),
      status: z.enum(['draft', 'ready', 'listing', 'published', 'failed']).optional(),
    });
    const body = bodySchema.parse(request.body);
    const updated = await prisma.productDraft.updateMany({
      where: { id: request.params.id, tenantId: request.tenantId },
      data: body,
    });
    if (updated.count === 0) return reply.code(404).send({ error: 'not found' });
    reply.send({ updated: true });
  });

  // POST /api/shopee/drafts/:id/publish · 发布 (Phase 0 只做占位, W9 上真 Adapter)
  fastify.post<{ Params: { id: string } }>('/drafts/:id/publish', async (request, reply) => {
    const draft = await prisma.productDraft.findFirst({
      where: { id: request.params.id, tenantId: request.tenantId },
    });
    if (!draft) return reply.code(404).send({ error: 'not found' });

    // TODO W9: 调 ShopeeAdapter 真发布. Phase 0 只标 status
    await prisma.productDraft.update({
      where: { id: draft.id },
      data: { status: 'published' },
    });
    reply.send({ published: true, mock: true, message: 'W9 ShopeeAdapter 上线后走真发布' });
  });

  // POST /api/shopee/pricing/preview · 价格试算
  fastify.post('/pricing/preview', async (request, reply) => {
    const p = pricingPreviewSchema.parse(request.body);
    const targetGross = p.cost_cny / (1 - p.margin - p.platform_fee_pct);
    const landedCny = targetGross + p.shipping_cny;
    const listVnd = Math.round(landedCny * p.cny_to_vnd);
    reply.send({
      inputs: p,
      cost_cny: p.cost_cny,
      target_gross_cny: Number(targetGross.toFixed(2)),
      landed_cny: Number(landedCny.toFixed(2)),
      list_vnd: listVnd,
    });
  });
};

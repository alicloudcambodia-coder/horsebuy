// horsebuy · /api/conversations/* · Agent 会话接口 · POUNDING v0.1 Section 7.1

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eventBus } from '../lib/websocket.js';

const createConvSchema = z.object({
  agent_id: z.string().default('horsebuy_shopee_vn'),
  title: z.string().optional(),
});

const sendMessageSchema = z.object({
  message: z.string().min(1),
});

// 简易内存版会话存储 · Phase 0 用 · W3 Agent 编排接入 Anthropic SDK
const conversations = new Map<
  string,
  { id: string; tenantId: string; agentId: string; title?: string; messages: Array<{ role: string; content: string; ts: number }> }
>();

export const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    const body = createConvSchema.parse(request.body);
    const id = crypto.randomUUID();
    conversations.set(id, {
      id,
      tenantId: request.tenantId,
      agentId: body.agent_id,
      title: body.title,
      messages: [],
    });
    reply.code(201).send({ id, agent_id: body.agent_id });
  });

  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const conv = conversations.get(request.params.id);
    if (!conv || conv.tenantId !== request.tenantId) return reply.code(404).send({ error: 'not found' });
    reply.send(conv);
  });

  fastify.post<{ Params: { id: string } }>('/:id/messages', async (request, reply) => {
    const conv = conversations.get(request.params.id);
    if (!conv || conv.tenantId !== request.tenantId) return reply.code(404).send({ error: 'not found' });
    const body = sendMessageSchema.parse(request.body);

    conv.messages.push({ role: 'user', content: body.message, ts: Date.now() });

    // TODO W3: 真 Agent 编排 (Anthropic SDK) + 5 Skill mock 调用
    const stubReply = `[stub W3 未实现] 收到指令: ${body.message.slice(0, 50)}... 编排层 W3 (07/21-07/27) 上, 现在只回音.`;
    conv.messages.push({ role: 'assistant', content: stubReply, ts: Date.now() });

    // 流式 event
    eventBus.publish(request.tenantId, {
      name: 'message.stream',
      data: { conversation_id: conv.id, role: 'assistant', delta: stubReply, done: true },
    });

    reply.send({ reply: stubReply, mock: true });
  });
};

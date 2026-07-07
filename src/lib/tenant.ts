// horsebuy · Tenant 中间件 · 对比报告差距 #7 SaaS 命门
// 每个受保护 route 强制解析 X-Tenant-Id, 挂到 request.tenantId
// TODO W17: 加真实 JWT 鉴权 (现在只是从 header 读, dev 用)

import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
  }
}

// Phase 0 期间用一个 default tenant, W17 上线时改成 JWT 解析
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export const tenantPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('tenantId', '');

  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    const headerTenant = (request.headers['x-tenant-id'] as string | undefined) ?? DEFAULT_TENANT_ID;
    request.tenantId = headerTenant;
  });
};

// horsebuy · /api/sourcing/1688/* · 对比报告差距 #3 REST 接口族
// POUNDING v0.1 Section 7.2

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getAlibabaProvider } from '../providers/alibaba.js';
import { withCost } from '../lib/cost.js';
import { prisma } from '../db.js';

const searchSchema = z.object({
  keyword: z.string().optional(),
  category: z.string().optional(),
  price_min_cny: z.coerce.number().nonnegative().optional(),
  price_max_cny: z.coerce.number().nonnegative().optional(),
  min_sales_count: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(['cross_border_score', 'price_asc', 'sales_desc']).optional(),
});

export const sourcingRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/sourcing/1688/search
  fastify.post('/search', async (request, reply) => {
    const body = searchSchema.parse(request.body);
    const provider = getAlibabaProvider();

    const rawList = await withCost(
      { tenantId: request.tenantId, tool: `alibaba.${provider.name}.search`, costCny: 0.01 },
      () =>
        provider.search({
          keyword: body.keyword,
          category: body.category,
          priceMinCny: body.price_min_cny,
          priceMaxCny: body.price_max_cny,
          minSalesCount: body.min_sales_count,
          limit: body.limit,
          sort: body.sort,
        }),
    );

    // 落 source_products (含 tenantId)
    const persisted = await Promise.all(
      rawList.map((raw) =>
        prisma.sourceProduct.create({
          data: {
            tenantId: request.tenantId,
            provider: provider.name,
            sourceProductId: raw.sourceProductId,
            sourceUrl: raw.sourceUrl,
            titleCn: raw.titleCn,
            shopName: raw.shopName,
            categorySource: raw.categorySource,
            priceMinCny: raw.priceMinCny,
            priceMaxCny: raw.priceMaxCny,
            salesCount: raw.salesCount,
            minOrderQuantity: raw.minOrderQuantity,
            mainImage: raw.mainImage,
            imageUrls: raw.imageUrls ?? [],
            skuSummary: (raw.skuSummary ?? {}) as never,
            rawScore: raw.rawScore,
            rawPayload: raw as never,
          },
        }),
      ),
    );

    reply.code(200).send({ provider: provider.name, count: persisted.length, items: persisted });
  });

  // GET /api/sourcing/1688/products/:id
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const provider = getAlibabaProvider();
    const detail = await withCost(
      { tenantId: request.tenantId, tool: `alibaba.${provider.name}.detail`, costCny: 0.005 },
      () => provider.detail(request.params.id),
    );
    reply.code(200).send({ provider: provider.name, detail });
  });

  // POST /api/sourcing/1688/products/batch
  fastify.post<{ Body: { ids: string[] } }>('/products/batch', async (request, reply) => {
    const { ids } = request.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.code(400).send({ error: 'ids 不能空' });
    }
    if (ids.length > 20) {
      return reply.code(400).send({ error: '一次最多 20 条' });
    }
    const provider = getAlibabaProvider();
    const details = await withCost(
      {
        tenantId: request.tenantId,
        tool: `alibaba.${provider.name}.batch_detail`,
        costCny: 0.005 * ids.length,
      },
      () => provider.batchDetail(ids),
    );
    reply.code(200).send({ provider: provider.name, details });
  });

  // GET /api/sourcing/1688/providers/status
  fastify.get('/providers/status', async (_request, reply) => {
    const provider = getAlibabaProvider();
    reply.code(200).send(await provider.status());
  });
};

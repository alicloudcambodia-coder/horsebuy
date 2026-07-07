// horsebuy · 成本追踪 · 对比报告差距 #5 前置到 W4
// 每次 LLM/图片/Provider/Shopee API 调用都写 ToolCallLog

import { prisma } from '../db.js';
import { logger } from './logger.js';
import { eventBus } from './websocket.js';

export interface ToolCallRecord {
  tenantId: string;
  taskId?: string;
  tool: string; // 'llm.translate_vi' | 'shopee.create_product' | 'image.generate' | 'alibaba.search'
  requestSummary?: unknown;
  responseSummary?: unknown;
  status: 'success' | 'failed' | 'timeout';
  latencyMs: number;
  costCny: number;
  errorMessage?: string;
}

export async function recordToolCall(record: ToolCallRecord): Promise<void> {
  try {
    await prisma.toolCallLog.create({
      data: {
        tenantId: record.tenantId,
        taskId: record.taskId,
        tool: record.tool,
        requestSummary: record.requestSummary ?? {},
        responseSummary: record.responseSummary ?? {},
        status: record.status,
        latencyMs: record.latencyMs,
        costCny: record.costCny,
        errorMessage: record.errorMessage,
      },
    });

    // 广播 cost 事件
    if (record.taskId) {
      eventBus.publish(record.tenantId, {
        name: 'listing.task.cost',
        data: {
          task_id: record.taskId,
          tool: record.tool,
          cost_cny: record.costCny,
          status: record.status,
        },
      });
    }
  } catch (err) {
    logger.error({ err, record }, 'recordToolCall 失败 (不阻塞主流程)');
  }
}

/**
 * 包装一次 API 调用, 自动记录 cost + latency
 */
export async function withCost<T>(
  meta: Omit<ToolCallRecord, 'status' | 'latencyMs' | 'responseSummary'>,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    await recordToolCall({
      ...meta,
      status: 'success',
      latencyMs: Date.now() - started,
      responseSummary: sanitize(result),
    });
    return result;
  } catch (err) {
    await recordToolCall({
      ...meta,
      status: 'failed',
      latencyMs: Date.now() - started,
      responseSummary: {},
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/** 返回值大对象只留 shape, 不存原始数据 (敏感信息避免落库) */
function sanitize(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value !== 'object') return { type: typeof value };
  if (Array.isArray(value)) return { type: 'array', length: value.length };
  return { type: 'object', keys: Object.keys(value).slice(0, 20) };
}

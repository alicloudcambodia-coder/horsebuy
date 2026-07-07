// horsebuy · WebSocket Event Bus · 对比报告差距 #4
// POUNDING v0.1 Section 7.4 定义的 7 种 event

import type { WebSocket } from '@fastify/websocket';

export type WsEventName =
  | 'message.stream'
  | 'listing.task.created'
  | 'listing.task.step'
  | 'listing.task.cost'
  | 'listing.task.warning'
  | 'listing.task.result'
  | 'listing.task.failed';

export interface WsEvent<TData = unknown> {
  name: WsEventName;
  data: TData;
  ts: number;
}

/**
 * 简易内存版 event bus. Phase 0 用. Phase 2 W20 换 Redis pub/sub.
 * 按 tenantId 分组, 只广播给同租户订阅者.
 */
class EventBus {
  private subs = new Map<string, Set<WebSocket>>();

  subscribe(tenantId: string, socket: WebSocket): void {
    if (!this.subs.has(tenantId)) {
      this.subs.set(tenantId, new Set());
    }
    this.subs.get(tenantId)!.add(socket);

    socket.on('close', () => {
      this.subs.get(tenantId)?.delete(socket);
    });
  }

  publish<TData>(tenantId: string, evt: Omit<WsEvent<TData>, 'ts'>): void {
    const sockets = this.subs.get(tenantId);
    if (!sockets || sockets.size === 0) return;

    const payload = JSON.stringify({ ...evt, ts: Date.now() });
    for (const socket of sockets) {
      if (socket.readyState === 1 /* OPEN */) {
        socket.send(payload);
      }
    }
  }

  count(tenantId?: string): number {
    if (tenantId) return this.subs.get(tenantId)?.size ?? 0;
    let total = 0;
    for (const s of this.subs.values()) total += s.size;
    return total;
  }
}

export const eventBus = new EventBus();

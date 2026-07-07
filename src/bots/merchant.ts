// horsebuy · 商家 Telegram Bot POC · 对比报告差距 #8 首发渠道
// W2 (07/14-07/20) 完成. 主公自己 4 bot 已经在 Telegram, 复用 Telegraf.
// 主公跑: pnpm bot:merchant (需要 TELEGRAM_BOT_TOKEN)

import { Telegraf } from 'telegraf';
import { env } from '../env.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../db.js';

if (!env.TELEGRAM_BOT_TOKEN) {
  logger.error('缺 TELEGRAM_BOT_TOKEN, 商家 Bot 无法启动. 主公 @BotFather 建 bot 后填 .env');
  process.exit(1);
}

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

bot.start(async (ctx) => {
  await ctx.reply(
    '🐎 欢迎来 horsebuy 商家版\n\n' +
      '这是 W2 POC 版本. 现在支持:\n' +
      '  /find <关键词> — 从 1688 找货\n' +
      '  /list — 我的商品草稿\n' +
      '  /tasks — 我的上架任务\n' +
      '  /health — 后端心跳\n\n' +
      '  W3 之后加 Agent 自然语言对话 (直接说 "找 10 个厨房收纳品上 Shopee 越南"), W18 上生产.',
  );
});

bot.command('health', async (ctx) => {
  await ctx.reply(`✅ 商家 Bot 在线 · tenant=${DEFAULT_TENANT_ID.slice(0, 8)} · ts=${Date.now()}`);
});

bot.command('find', async (ctx) => {
  const keyword = ctx.message.text.replace(/^\/find\s*/, '').trim();
  if (!keyword) {
    return ctx.reply('用法: /find 厨房收纳');
  }
  await ctx.reply(`🔍 搜索 1688: ${keyword} ... (Phase 0 用 stub Provider)`);
  // TODO W3 Agent 编排后, 这里改成直接调 Agent
  // 现在直接落 SourceProduct 演示 tenant 隔离生效
  const sample = await prisma.sourceProduct.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      provider: 'stub',
      sourceProductId: `stub_bot_${Date.now()}`,
      titleCn: `[stub] ${keyword}`,
      priceMinCny: 12.8,
      salesCount: 100,
      rawScore: 0.85,
    },
  });
  await ctx.reply(`✅ 已入库: ${sample.id.slice(0, 8)} · ${sample.titleCn}`);
});

bot.command('list', async (ctx) => {
  const drafts = await prisma.productDraft.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  if (drafts.length === 0) return ctx.reply('还没商品草稿. 用 /find <关键词> 找货, 然后生成草稿.');
  const lines = drafts.map((d, i) => `${i + 1}. [${d.status}] ${d.titleCn} ${d.titleVi ? '· ' + d.titleVi : ''}`);
  await ctx.reply('📦 最近 10 条草稿:\n' + lines.join('\n'));
});

bot.command('tasks', async (ctx) => {
  const tasks = await prisma.listingTask.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  if (tasks.length === 0) return ctx.reply('还没上架任务.');
  const lines = tasks.map(
    (t, i) => `${i + 1}. [${t.status}] ${t.productDraftIds.length} SKU · ${t.createdAt.toISOString().slice(0, 10)}`,
  );
  await ctx.reply('🎯 最近 10 个任务:\n' + lines.join('\n'));
});

bot.on('message', async (ctx) => {
  await ctx.reply('W3 加自然语言 Agent 后, 直接说需求就好. 现在支持: /find /list /tasks /health');
});

bot.launch().then(() => logger.info('🐎 horsebuy merchant Bot 上线'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

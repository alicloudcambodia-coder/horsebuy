// horsebuy · env 解析 (Zod 校验, 缺 required 直接 fail-fast)
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  QWEN_API_KEY: z.string().optional(),

  ONE688_PROVIDER: z.enum(['stub', 'aliopen', 'jushuitan', 'yuewen']).default('stub'),
  ONE688_APP_KEY: z.string().optional(),
  ONE688_APP_SECRET: z.string().optional(),

  SHOPEE_PARTNER_ID: z.string().optional(),
  SHOPEE_PARTNER_KEY: z.string().optional(),
  SHOPEE_SHOP_ID: z.string().optional(),
  SHOPEE_SANDBOX: z.coerce.boolean().default(true),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),

  WS_HEARTBEAT_MS: z.coerce.number().int().positive().default(30000),

  MAX_COST_PER_TASK_CNY: z.coerce.number().positive().default(10),
  MAX_SKU_PER_BATCH: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ 无效的 .env 配置:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

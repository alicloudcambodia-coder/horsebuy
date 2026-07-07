// horsebuy · 5 大 Skill · POUNDING v0.1 Section 5.3
// Phase 0 (W3-W5) 只做 stub, Phase 1 (W7+) 上真实实现

export interface SkillContext {
  tenantId: string;
  taskId?: string;
  userId?: string;
}

// 1. Sourcing · 从 1688 找货
export const sourcingSkill = {
  name: 'sourcing',
  description: '从 1688 按条件搜索并采集商品',
  async run(_ctx: SkillContext, args: { keyword: string; limit?: number }) {
    return { stub: true, hint: 'W3 W5 接 alibaba Provider Adapter', args };
  },
};

// 2. Listing · Shopee 上架编排
export const listingSkill = {
  name: 'listing',
  description: '把 ProductDraft 通过 ShopeeAdapter 发布',
  async run(_ctx: SkillContext, args: { draft_ids: string[] }) {
    return { stub: true, hint: 'W9 上真 ShopeeAdapter', args };
  },
};

// 3. Copywriting · 越南语文案生成
export const copywritingSkill = {
  name: 'copywriting',
  description: '生成越南语标题/描述/属性/关键词',
  async run(_ctx: SkillContext, args: { draft_id: string; lang: 'vi' | 'th' }) {
    return { stub: true, hint: 'W11 接 DeepSeek/Qwen/Gemini 3 模型对比', args };
  },
};

// 4. Pricing · 定价规则
export const pricingSkill = {
  name: 'pricing',
  description: '按成本/汇率/费率/毛利计算售价',
  async run(_ctx: SkillContext, args: { cost_cny: number; margin?: number }) {
    return { stub: true, hint: 'W13 接 Shopee 越南 profile + 汇率 cron', args };
  },
};

// 5. Image · 图片本地化
export const imageSkill = {
  name: 'image',
  description: '去 1688 水印 + 加店铺 logo + 尺寸适配',
  async run(_ctx: SkillContext, args: { image_urls: string[]; shop_id: string }) {
    return { stub: true, hint: 'W12 接 sharp/Pillow + AI 图片生成', args };
  },
};

export const allSkills = [sourcingSkill, listingSkill, copywritingSkill, pricingSkill, imageSkill];

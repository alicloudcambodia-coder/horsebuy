// horsebuy · 1688 Provider Adapter · 对比报告差距 #2
// 抽象接口, 让 Skill/Worker 只调 interface 不看实现
// Phase 0 用 stub, W5 主公调研后接真 Provider (aliopen / jushuitan / yuewen)

// ============================================================
// 类型
// ============================================================

export interface SearchFilters {
  keyword?: string;
  category?: string;
  priceMinCny?: number;
  priceMaxCny?: number;
  minSalesCount?: number;
  limit?: number;
  sort?: 'cross_border_score' | 'price_asc' | 'sales_desc';
}

export interface RawSourceProduct {
  sourceProductId: string;
  sourceUrl?: string;
  titleCn: string;
  shopName?: string;
  categorySource?: string;
  priceMinCny?: number;
  priceMaxCny?: number;
  salesCount?: number;
  minOrderQuantity?: number;
  mainImage?: string;
  imageUrls?: string[];
  skuSummary?: unknown;
  rawScore?: number;
}

export interface ProductDetail extends RawSourceProduct {
  descriptionHtml?: string;
  attributes?: Record<string, string>;
  skus?: Array<{ skuId: string; name: string; priceCny: number; stock: number }>;
}

export interface ProviderStatus {
  provider: string;
  reachable: boolean;
  quotaRemaining?: number;
  qpsLimit?: number;
  lastError?: string;
  checkedAt: string;
}

/**
 * 1688 Provider 抽象接口. 换服务商 = 换实现类, Skill/Worker 不动.
 */
export interface AlibabaProvider {
  readonly name: string;

  search(filters: SearchFilters): Promise<RawSourceProduct[]>;

  detail(sourceProductId: string): Promise<ProductDetail>;

  batchDetail(ids: string[]): Promise<ProductDetail[]>;

  status(): Promise<ProviderStatus>;
}

// ============================================================
// Stub 实现 (Phase 0 用, W5 换真 Provider)
// ============================================================

export class StubAlibabaProvider implements AlibabaProvider {
  readonly name = 'stub';

  async search(filters: SearchFilters): Promise<RawSourceProduct[]> {
    const limit = filters.limit ?? 10;
    return Array.from({ length: limit }, (_, i) => ({
      sourceProductId: `stub_${Date.now()}_${i}`,
      sourceUrl: `https://detail.1688.com/offer/stub_${i}.html`,
      titleCn: `[stub] ${filters.keyword ?? '厨房收纳'} 商品 ${i + 1}`,
      shopName: `stub 供应商店铺 ${i + 1}`,
      categorySource: filters.category ?? '家居日用',
      priceMinCny: 5 + i * 2,
      priceMaxCny: 20 + i * 3,
      salesCount: 100 + i * 50,
      minOrderQuantity: 2,
      mainImage: `https://picsum.photos/seed/${i}/800/800`,
      imageUrls: Array.from({ length: 5 }, (_, j) => `https://picsum.photos/seed/${i}_${j}/800/800`),
      rawScore: 0.5 + (i % 5) * 0.1,
    }));
  }

  async detail(sourceProductId: string): Promise<ProductDetail> {
    const searchResult = await this.search({ limit: 1 });
    const base = searchResult[0];
    return {
      ...base,
      sourceProductId,
      titleCn: `[stub detail] ${sourceProductId}`,
      descriptionHtml: `<p>stub 商品详情 ${sourceProductId}</p>`,
      attributes: {
        material: '塑料',
        color: '白色',
        weight_g: '350',
      },
      skus: [
        { skuId: `${sourceProductId}_S`, name: 'S 号', priceCny: 12.8, stock: 100 },
        { skuId: `${sourceProductId}_M`, name: 'M 号', priceCny: 15.8, stock: 80 },
      ],
    };
  }

  async batchDetail(ids: string[]): Promise<ProductDetail[]> {
    return Promise.all(ids.map((id) => this.detail(id)));
  }

  async status(): Promise<ProviderStatus> {
    return {
      provider: this.name,
      reachable: true,
      quotaRemaining: 999999,
      qpsLimit: 100,
      checkedAt: new Date().toISOString(),
    };
  }
}

// ============================================================
// Factory (env 决定用哪个 Provider)
// ============================================================

import { env } from '../env.js';

let cached: AlibabaProvider | null = null;

export function getAlibabaProvider(): AlibabaProvider {
  if (cached) return cached;

  switch (env.ONE688_PROVIDER) {
    case 'stub':
      cached = new StubAlibabaProvider();
      break;
    case 'aliopen':
    case 'jushuitan':
    case 'yuewen':
      // TODO W5 实现. 现在 fallback 到 stub
      console.warn(`Provider ${env.ONE688_PROVIDER} 未实现, fallback 到 stub`);
      cached = new StubAlibabaProvider();
      break;
    default:
      cached = new StubAlibabaProvider();
  }

  return cached;
}

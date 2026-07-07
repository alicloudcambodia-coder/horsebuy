// horsebuy · 最小健康测试 · 主公 W2 补更多测试

import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('should add', () => {
    expect(1 + 1).toBe(2);
  });
});

describe('env parsing', () => {
  it('parses defaults', async () => {
    process.env.DATABASE_URL = 'postgresql://x:y@localhost:5432/horsebuy';
    const { env } = await import('../src/env.js');
    expect(env.PORT).toBeGreaterThan(0);
    expect(env.ONE688_PROVIDER).toBe('stub');
  });
});

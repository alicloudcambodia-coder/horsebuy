// horsebuy · seed script · Phase 0 默认 tenant + 一个 admin user
// 主公 pnpm tsx scripts/seed.ts

import { prisma } from '../src/db.js';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      name: 'horsebuy default',
      plan: 'trial',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@horsebuy.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@horsebuy.local',
      name: 'admin',
      role: 'owner',
    },
  });

  console.log('✅ seed 完成');
  console.log('   tenant:', tenant.id);
  console.log('   user:  ', user.email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

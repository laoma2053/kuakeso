/**
 * 每日重置脚本
 * 重置所有账号的 dailySaveCount
 * 建议通过 crontab 每天凌晨0点执行: 0 0 * * * npx tsx src/scripts/reset-daily.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.cloudAccount.updateMany({
    data: { dailySaveCount: 0 },
  });
  console.log(`🔄 [每日重置] 已重置 ${result.count} 个账号的每日转存计数`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

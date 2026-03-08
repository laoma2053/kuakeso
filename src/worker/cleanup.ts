/**
 * 资源清理 Worker
 * 每15分钟执行一次，清理夸克网盘中已转存的资源
 *
 * 使用方式: npx ts-node src/worker/cleanup.ts
 * 或通过 Docker 独立运行
 */

import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15分钟
const BATCH_SIZE = 50;
const SAVE_CACHE_PREFIX = 'saved:';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const redis = new IORedis(REDIS_URL);
const prisma = new PrismaClient();

// 创建队列
const cleanupQueue = new Queue('cleanup', { connection });

/**
 * 清理工作逻辑
 * 1. 查询已过期的 Resource (expireAt < now)
 * 2. 按账号分组
 * 3. 批量删除夸克网盘文件
 * 4. 清理回收站
 * 5. 更新数据库状态
 */
async function performCleanup() {
  console.log(`[Cleanup] 开始清理任务 @ ${new Date().toISOString()}`);

  try {
    // 1. 查询过期资源
    const expiredResources = await prisma.resource.findMany({
      where: {
        expiresAt: { lte: new Date() },
        status: 'active',
      },
      include: { account: true },
      take: BATCH_SIZE,
    });

    if (expiredResources.length === 0) {
      console.log('[Cleanup] 没有过期资源需要清理');
      return { cleaned: 0 };
    }

    console.log(`[Cleanup] 发现 ${expiredResources.length} 个过期资源`);

    // 2. 按账号分组
    const grouped = new Map<number, typeof expiredResources>();
    for (const res of expiredResources) {
      const accountId = res.accountId;
      if (!accountId) continue;
      if (!grouped.has(accountId)) grouped.set(accountId, []);
      grouped.get(accountId)!.push(res);
    }

    let totalCleaned = 0;

    // 3. 按账号清理
    const entries = Array.from(grouped.entries());
    for (const [accountId, resources] of entries) {
      const account = resources[0]?.account;
      if (!account || !account.cookie) continue;

      const { QuarkAPI } = await import('../lib/quark-api');
      const api = new QuarkAPI(account.cookie);

      // 收集要删除的文件 fid (fileFid 可能存储了逗号分隔的多个fid)
      const fids: string[] = [];
      for (const r of resources) {
        if (r.fileFid) {
          fids.push(...r.fileFid.split(',').filter(Boolean));
        }
      }

      if (fids.length === 0) continue;

      try {
        // 批量删除文件
        console.log(`[Cleanup] 账号 ${account.name}: 删除 ${fids.length} 个文件`);
        await api.deleteFiles(fids);

        // 同步删除分享链接
        const shareIds = resources
          .map((r: any) => r.shareId)
          .filter(Boolean);
        if (shareIds.length > 0) {
          console.log(`[Cleanup] 账号 ${account.name}: 删除 ${shareIds.length} 个分享链接`);
          await api.deleteShare(shareIds);
        }

        // 清理回收站
        await new Promise(resolve => setTimeout(resolve, 1000));
        const recycleItems = await api.recycleList();
        if (recycleItems && recycleItems.length > 0) {
          const recycleIds = recycleItems.map((item: any) => item.fid || item.id).filter(Boolean);
          if (recycleIds.length > 0) {
            await api.recycleRemove(recycleIds);
          }
        }

        // 更新数据库
        await prisma.resource.updateMany({
          where: { id: { in: resources.map((r: any) => r.id) } },
          data: { status: 'cleaned' },
        });

        // 关键: 清除已删除资源的 Redis 缓存，防止用户拿到已失效链接
        for (const r of resources) {
          if (r.originalUrl) {
            await redis.del(`${SAVE_CACHE_PREFIX}${r.originalUrl}`);
          }
        }

        totalCleaned += resources.length;
        console.log(`[Cleanup] 账号 ${account.name}: 清理完成`);
      } catch (error) {
        console.error(`[Cleanup] 账号 ${account.name} 清理失败:`, error);

        // 标记为清理失败
        await prisma.resource.updateMany({
          where: { id: { in: resources.map((r: any) => r.id) } },
          data: { status: 'clean_failed' },
        });
      }
    }

    console.log(`[Cleanup] 本次清理完成: ${totalCleaned} 个资源`);
    return { cleaned: totalCleaned };
  } catch (error) {
    console.error('[Cleanup] 清理任务异常:', error);
    throw error;
  }
}

// 创建 Worker
const worker = new Worker(
  'cleanup',
  async (job) => {
    console.log(`[Worker] 处理任务 ${job.name} #${job.id}`);
    return await performCleanup();
  },
  {
    connection,
    concurrency: 1,
  }
);

worker.on('completed', (job, result) => {
  console.log(`[Worker] 任务完成 #${job?.id}:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] 任务失败 #${job?.id}:`, err.message);
});

// 定时添加清理任务
async function scheduleCleanup() {
  console.log('[Scheduler] 启动清理调度器');

  // 立即执行一次
  await cleanupQueue.add('cleanup', {}, {
    removeOnComplete: 10,
    removeOnFail: 5,
  });

  // 每15分钟执行
  setInterval(async () => {
    await cleanupQueue.add('cleanup', {}, {
      removeOnComplete: 10,
      removeOnFail: 5,
    });
  }, CLEANUP_INTERVAL);
}

scheduleCleanup().catch(console.error);

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('[Worker] 收到 SIGTERM，正在关闭...');
  await worker.close();
  await redis.quit();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] 收到 SIGINT，正在关闭...');
  await worker.close();
  await redis.quit();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('[Worker] 资源清理 Worker 已启动');

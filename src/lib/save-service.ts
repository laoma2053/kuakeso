/**
 * 转存服务
 * 实现: 去重、资源级分布式锁、多账号调度（健康评分）、转存+分享
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { QuarkAPI } from '@/lib/quark-api';
import { generateSlug } from '@/lib/utils';
import crypto from 'crypto';

const SAVE_CACHE_PREFIX = 'saved:';
const SAVE_CACHE_TTL = 600; // 10分钟（与资源过期时间对齐，Worker清理时同步删除）
const ACCOUNT_LOCK_PREFIX = 'account_lock:';
const RESOURCE_LOCK_PREFIX = 'lock:resource:';
const RESOURCE_LOCK_TTL = 120; // 2分钟
const RESOURCE_LOCK_WAIT_MS = 500;
const RESOURCE_LOCK_MAX_WAIT = 30000; // 最多等30秒

export interface SaveResult {
  ok: boolean;
  shareUrl?: string;
  slug?: string;
  message?: string;
}

function resourceKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * 获取可用账号
 * 策略：过滤空间不足 + 按健康评分（failCount asc, dailySaveCount asc）
 */
async function getAvailableAccount(): Promise<{
  id: number;
  cookie: string;
  nickname: string;
  saveDirId: string | null;
} | null> {
  const accounts = await prisma.cloudAccount.findMany({
    where: {
      status: 'active',
      isActive: true,
      platform: 'quark',
    },
    orderBy: [
      { failCount: 'asc' },
      { dailySaveCount: 'asc' },
    ],
  });

  for (const account of accounts) {
    // 空间检查：使用率超过95%跳过
    if (account.totalSpace > 0 && Number(account.usedSpace) / Number(account.totalSpace) > 0.95) {
      continue;
    }

    const lockKey = `${ACCOUNT_LOCK_PREFIX}${account.id}`;
    const locked = await redis.set(lockKey, '1', 'EX', 60, 'NX');
    if (locked) {
      return {
        id: account.id,
        cookie: account.cookie,
        nickname: account.nickname || '未命名',
        saveDirId: account.saveDirId ?? null,
      };
    }
  }

  return null;
}

async function releaseAccountLock(accountId: number): Promise<void> {
  await redis.del(`${ACCOUNT_LOCK_PREFIX}${accountId}`);
}

/**
 * 核心转存函数
 */
export async function saveAndShareResource(
  originalUrl: string,
  title: string
): Promise<SaveResult> {
  // 1. L3 缓存命中
  const cacheKey = `${SAVE_CACHE_PREFIX}${originalUrl}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    return { ok: true, shareUrl: data.shareUrl, slug: data.slug };
  }

  // 2. 数据库去重
  const existing = await prisma.resource.findFirst({
    where: { originalUrl, status: 'active' },
  });
  if (existing?.shareUrl) {
    await redis.setex(cacheKey, SAVE_CACHE_TTL, JSON.stringify({
      shareUrl: existing.shareUrl,
      slug: existing.slug,
    }));
    return { ok: true, shareUrl: existing.shareUrl, slug: existing.slug };
  }

  // 3. 资源级分布式锁（防止并发重复转存同一资源）
  const resKey = resourceKey(originalUrl);
  const resLockKey = `${RESOURCE_LOCK_PREFIX}${resKey}`;
  const lockAcquired = await redis.set(resLockKey, '1', 'EX', RESOURCE_LOCK_TTL, 'NX');

  if (!lockAcquired) {
    // 等待其他请求完成转存
    const waited = await waitForCache(cacheKey, RESOURCE_LOCK_WAIT_MS, RESOURCE_LOCK_MAX_WAIT);
    if (waited) return { ok: true, shareUrl: waited.shareUrl, slug: waited.slug };
    return { ok: false, message: '资源获取超时，请稍后重试' };
  }

  // 4. 获取可用账号
  const account = await getAvailableAccount();
  if (!account) {
    await redis.del(resLockKey);
    return { ok: false, message: '暂无可用的网盘账号，请稍后再试' };
  }

  try {
    // 5. 执行转存+分享
    const quark = new QuarkAPI(account.cookie);
    const saveDir = account.saveDirId || process.env.SAVE_DIR || '/来自搜索站';
    const result = await quark.saveAndShare(originalUrl, saveDir, !!account.saveDirId);

    if (!result.ok || !result.shareInfo) {
      // 转存失败，增加 failCount
      await prisma.cloudAccount.update({
        where: { id: account.id },
        data: { failCount: { increment: 1 } },
      });
      return { ok: false, message: result.message || '转存失败' };
    }

    // 6. 计算过期时间
    const expireMinutes = parseInt(process.env.SHARE_EXPIRE_MINUTES || '15', 10);
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    // 7. 存入数据库
    const slug = generateSlug(title);
    await prisma.resource.create({
      data: {
        title,
        originalUrl,
        shareUrl: result.shareInfo.share_url,
        shareId: result.shareInfo.share_id,
        fileIds: JSON.stringify(result.savedFids || []),
        fileFid: result.savedFids?.join(',') || '',
        accountId: account.id,
        slug,
        seoTitle: `${title} - 夸克网盘资源下载`,
        seoDescription: `${title}，夸克网盘高速下载，免费获取资源链接。`,
        expiresAt,
        status: 'active',
      },
    });

    // 8. 更新账号：转存计数+1，failCount 清零
    await prisma.cloudAccount.update({
      where: { id: account.id },
      data: {
        dailySaveCount: { increment: 1 },
        failCount: 0,
      },
    });

    // 9. 写入 L3 缓存
    await redis.setex(cacheKey, SAVE_CACHE_TTL, JSON.stringify({
      shareUrl: result.shareInfo.share_url,
      slug,
    }));

    return { ok: true, shareUrl: result.shareInfo.share_url, slug };
  } catch (error) {
    console.error('❌ [转存服务] 异常:', error);
    await prisma.cloudAccount.update({
      where: { id: account.id },
      data: { failCount: { increment: 1 } },
    }).catch(() => {});
    return { ok: false, message: '转存过程中出错' };
  } finally {
    await releaseAccountLock(account.id);
    await redis.del(resLockKey);
  }
}

async function waitForCache(
  cacheKey: string,
  intervalMs: number,
  maxWaitMs: number
): Promise<{ shareUrl: string; slug: string } | null> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, intervalMs));
    const result = await redis.get(cacheKey);
    if (result) return JSON.parse(result);
  }
  return null;
}

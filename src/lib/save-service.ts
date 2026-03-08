/**
 * 转存服务
 * 实现: 去重、多账号轮询、转存+分享
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { QuarkAPI } from '@/lib/quark-api';
import { generateSlug } from '@/lib/utils';

const SAVE_CACHE_PREFIX = 'saved:';
const SAVE_CACHE_TTL = 1800; // 30分钟缓存已转存链接
const ACCOUNT_LOCK_PREFIX = 'account_lock:';

export interface SaveResult {
  ok: boolean;
  shareUrl?: string;
  slug?: string;
  message?: string;
}

/**
 * 获取可用的夸克网盘账号（轮询策略）
 */
async function getAvailableAccount(): Promise<{
  id: number;
  cookie: string;
  nickname: string;
} | null> {
  // 查找状态正常的账号，按今日转存次数升序（最小负载优先）
  const accounts = await prisma.cloudAccount.findMany({
    where: {
      status: 'active',
      isActive: true,
      platform: 'quark',
    },
    orderBy: { dailySaveCount: 'asc' },
  });

  for (const account of accounts) {
    // 尝试获取账号锁（避免并发使用同一账号）
    const lockKey = `${ACCOUNT_LOCK_PREFIX}${account.id}`;
    const locked = await redis.set(lockKey, '1', 'EX', 60, 'NX');
    if (locked) {
      return {
        id: account.id,
        cookie: account.cookie,
        nickname: account.nickname || '未命名',
      };
    }
  }

  return null;
}

/**
 * 释放账号锁
 */
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
  // 1. 去重检查 - Redis
  const cacheKey = `${SAVE_CACHE_PREFIX}${originalUrl}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    return { ok: true, shareUrl: data.shareUrl, slug: data.slug };
  }

  // 2. 去重检查 - 数据库
  const existing = await prisma.resource.findFirst({
    where: {
      originalUrl,
      status: 'active',
    },
  });
  if (existing?.shareUrl) {
    // 写回Redis缓存
    await redis.setex(cacheKey, SAVE_CACHE_TTL, JSON.stringify({
      shareUrl: existing.shareUrl,
      slug: existing.slug,
    }));
    return { ok: true, shareUrl: existing.shareUrl, slug: existing.slug };
  }

  // 3. 获取可用账号
  const account = await getAvailableAccount();
  if (!account) {
    return { ok: false, message: '暂无可用的网盘账号，请稍后再试' };
  }

  try {
    // 4. 执行转存+分享
    const quark = new QuarkAPI(account.cookie);
    const saveDir = process.env.SAVE_DIR || '/来自搜索站';
    const result = await quark.saveAndShare(originalUrl, saveDir);

    if (!result.ok || !result.shareInfo) {
      return { ok: false, message: result.message || '转存失败' };
    }

    // 5. 计算过期时间
    const expireMinutes = parseInt(process.env.SHARE_EXPIRE_MINUTES || '15', 10);
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    // 6. 生成slug并存入数据库
    const slug = generateSlug(title);
    const savedFidStr = result.savedFids?.join(',') || '';
    const resource = await prisma.resource.create({
      data: {
        title,
        originalUrl,
        shareUrl: result.shareInfo.share_url,
        shareId: result.shareInfo.share_id,
        fileIds: JSON.stringify(result.savedFids || []),
        fileFid: savedFidStr,  // 存储转存后的文件fid，供cleanup使用
        accountId: account.id,
        slug,
        seoTitle: `${title} - 夸克网盘资源下载`,
        seoDescription: `${title}，夸克网盘高速下载，免费获取资源链接。`,
        expiresAt,
        status: 'active',
      },
    });

    // 7. 更新账号转存计数
    await prisma.cloudAccount.update({
      where: { id: account.id },
      data: { dailySaveCount: { increment: 1 } },
    });

    // 8. 写入Redis缓存
    await redis.setex(cacheKey, SAVE_CACHE_TTL, JSON.stringify({
      shareUrl: result.shareInfo.share_url,
      slug,
    }));

    return {
      ok: true,
      shareUrl: result.shareInfo.share_url,
      slug,
    };
  } catch (error) {
    console.error('Save and share error:', error);
    return { ok: false, message: '转存过程中出错' };
  } finally {
    await releaseAccountLock(account.id);
  }
}

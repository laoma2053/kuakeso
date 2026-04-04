/**
 * 搜索服务
 * 实现: 多级缓存、请求合并、限流
 * 注意: 搜索时不再做有效性验证，验证改为在用户点击"获取资源"时单条进行
 */

import { redis } from '@/lib/redis';
import { createPanSouClient, type PanSouResult } from '@/lib/pansou-api';

const CACHE_PREFIX = 'search:';
const LOCK_PREFIX = 'search_lock:';
const CACHE_TTL = 600; // 10分钟缓存
const RATE_LIMIT_PREFIX = 'ratelimit:search:';
const RATE_LIMIT_MAX = 10; // 每分钟最多10次
const RATE_LIMIT_WINDOW = 60; // 60秒

export interface SearchResultItem {
  id: string;
  url: string;
  title: string;
  password: string;
  datetime: string;
  source: string;
}

/**
 * IP限流检查
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `${RATE_LIMIT_PREFIX}${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  return count <= RATE_LIMIT_MAX;
}

/**
 * 将 PanSou 结果转换为搜索结果项，按日期倒序排列
 */
function mapResults(results: PanSouResult[]): SearchResultItem[] {
  const mapped = results.map((item, index) => ({
    id: `${index}_${Date.now().toString(36)}`,
    url: item.url,
    title: item.note || '未命名资源',
    password: item.password || '',
    datetime: item.datetime || '',
    source: item.source || '',
  }));

  // 按日期倒序排序，优先展示最近日期的资源
  mapped.sort((a, b) => {
    if (!a.datetime && !b.datetime) return 0;
    if (!a.datetime) return 1;
    if (!b.datetime) return -1;
    return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
  });

  return mapped;
}

/**
 * 核心搜索函数
 * 实现请求合并 + 缓存 + 有效性检测 + 限流
 */
export async function searchResources(keyword: string, page: number = 1, ip?: string, platform: string = 'quark'): Promise<{
  results: SearchResultItem[];
  total: number;
  cached: boolean;
}> {
  // 限流检查
  if (ip) {
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      throw new Error('请求过于频繁，请稍后再试');
    }
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return { results: [], total: 0, cached: false };
  }

  const cacheKey = `${CACHE_PREFIX}${platform}:${normalizedKeyword}`;
  const lockKey = `${LOCK_PREFIX}${platform}:${normalizedKeyword}`;

  // 1. 查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const paged = data.slice(start, start + pageSize);
    return { results: paged, total: data.length, cached: true };
  }

  // 2. 请求合并 - 尝试获取锁
  const lockAcquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');

  if (!lockAcquired) {
    // 有其他请求正在处理，等待结果
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await redis.get(cacheKey);
      if (result) {
        const data = JSON.parse(result);
        return { results: data, total: data.length, cached: true };
      }
    }
    // 超时了，直接返回空
    return { results: [], total: 0, cached: false };
  }

  try {
    // 3. 调用PanSou API
    const pansou = createPanSouClient();
    const searchResult = await pansou.search(normalizedKeyword, { cloudTypes: [platform] });

    if (searchResult.results.length === 0) {
      // 空结果也缓存，但TTL短一些（2分钟）
      await redis.setex(cacheKey, 120, JSON.stringify([]));
      return { results: [], total: 0, cached: false };
    }

    // 4. 将结果映射并按日期排序（不做有效性验证，验证在保存时进行）
    const mappedResults = mapResults(searchResult.results);

    // 5. 写入缓存
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(mappedResults));

    // 分页
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const paged = mappedResults.slice(start, start + pageSize);

    return { results: paged, total: mappedResults.length, cached: false };
  } finally {
    // 释放锁
    await redis.del(lockKey);
  }
}

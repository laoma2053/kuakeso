/**
 * 搜索服务
 * 实现: 多级缓存、请求合并、有效性检测、限流
 */

import { redis } from '@/lib/redis';
import { createPanSouClient, type PanSouResult } from '@/lib/pansou-api';
import { QuarkAPI, type QuarkFileItem } from '@/lib/quark-api';
import { extractPwdId } from '@/lib/utils';

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
  valid: boolean;
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
 * 资源有效性检测 (采用 PanCheck 两步验证法)
 * 步骤1: 获取 stoken (POST /share/sharepage/token)
 * 步骤2: 用 stoken 获取文件列表 (GET /share/sharepage/detail)，检查列表是否为空
 * 超时3秒
 */
async function validateResource(url: string): Promise<boolean> {
  try {
    const extracted = extractPwdId(url);
    if (!extracted) return false;

    const api = new QuarkAPI('');

    // 步骤1: 获取 stoken
    const stokenResult = await Promise.race([
      api.getStoken(extracted.pwdId, extracted.passcode),
      new Promise<{ ok: false }>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);

    if (!stokenResult.ok || !stokenResult.stoken) return false;

    // 步骤2: 用 stoken 获取文件列表，检查是否为空
    const fileList = await Promise.race([
      api.getShareDetail(extracted.pwdId, stokenResult.stoken),
      new Promise<QuarkFileItem[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);

    return fileList.length > 0;
  } catch {
    // 验证超时或异常，默认保留该结果（宁可误报也不漏掉）
    return true;
  }
}

/**
 * 批量有效性检测（并行，带超时）
 */
async function batchValidate(results: PanSouResult[]): Promise<SearchResultItem[]> {
  const validationPromises = results.map(async (item, index) => {
    const valid = await validateResource(item.url);
    return {
      id: `${Buffer.from(item.url).toString('base64url').slice(0, 16)}_${index}`,
      url: item.url,
      title: item.note || '未命名资源',
      password: item.password || '',
      datetime: item.datetime || '',
      source: item.source || '',
      valid,
    };
  });

  const settledResults = await Promise.allSettled(validationPromises);

  return settledResults
    .filter((r): r is PromiseFulfilledResult<SearchResultItem> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(r => r.valid); // 只返回有效的
}

/**
 * 核心搜索函数
 * 实现请求合并 + 缓存 + 有效性检测 + 限流
 */
export async function searchResources(keyword: string, page: number = 1, ip?: string): Promise<{
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

  const cacheKey = `${CACHE_PREFIX}${normalizedKeyword}`;
  const lockKey = `${LOCK_PREFIX}${normalizedKeyword}`;

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
    const searchResult = await pansou.search(normalizedKeyword);

    if (searchResult.results.length === 0) {
      // 空结果也缓存，但TTL短一些（2分钟）
      await redis.setex(cacheKey, 120, JSON.stringify([]));
      return { results: [], total: 0, cached: false };
    }

    // 4. 并行有效性检测
    const validatedResults = await batchValidate(searchResult.results);

    // 5. 写入缓存
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(validatedResults));

    // 分页
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const paged = validatedResults.slice(start, start + pageSize);

    return { results: paged, total: validatedResults.length, cached: false };
  } finally {
    // 释放锁
    await redis.del(lockKey);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { saveAndShareResource } from '@/lib/save-service';
import { QuarkAPI } from '@/lib/quark-api';
import { extractPwdId } from '@/lib/utils';
import { redis } from '@/lib/redis';

/**
 * 单条资源有效性验证 (PanCheck 两步验证法)
 */
async function validateSingleResource(url: string): Promise<boolean> {
  try {
    const extracted = extractPwdId(url);
    if (!extracted) return false;

    const api = new QuarkAPI('');

    // 步骤1: 获取 stoken
    const stokenResult = await Promise.race([
      api.getStoken(extracted.pwdId, extracted.passcode),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (stokenResult === null) return false; // 超时视为无效
    if (!stokenResult.ok || !stokenResult.stoken) return false;

    // 步骤2: 用 stoken 获取文件列表
    const fileList = await Promise.race([
      api.getShareDetail(extracted.pwdId, stokenResult.stoken),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (fileList === null) return false; // 超时视为无效
    return fileList.length > 0;
  } catch {
    return false;
  }
}

/**
 * 从搜索缓存中移除失效资源
 */
async function removeFromSearchCache(shareUrl: string): Promise<void> {
  try {
    // 扫描所有搜索缓存
    const keys = await redis.keys('search:*');
    for (const key of keys) {
      if (key.startsWith('search_lock:')) continue; // 跳过锁
      const cached = await redis.get(key);
      if (!cached) continue;
      try {
        const results = JSON.parse(cached);
        if (!Array.isArray(results)) continue;
        const filtered = results.filter((r: any) => r.url !== shareUrl);
        if (filtered.length < results.length) {
          const ttl = await redis.ttl(key);
          if (ttl > 0) {
            await redis.setex(key, ttl, JSON.stringify(filtered));
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('[save] removeFromSearchCache error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareUrl, password, title } = body;

    if (!shareUrl || typeof shareUrl !== 'string') {
      return NextResponse.json(
        { error: '无效的分享链接' },
        { status: 400 }
      );
    }

    // 验证链接格式
    if (!shareUrl.includes('quark') && !shareUrl.includes('pan.')) {
      return NextResponse.json(
        { error: '不支持的链接类型' },
        { status: 400 }
      );
    }

    // ⭐ 先验证资源有效性
    const isValid = await validateSingleResource(shareUrl);
    if (!isValid) {
      // 资源无效，从搜索缓存中移除
      removeFromSearchCache(shareUrl).catch(() => {});
      return NextResponse.json(
        { error: '该资源已失效或不存在，请换一个资源保存', invalid: true },
        { status: 410 }
      );
    }

    const result = await saveAndShareResource(shareUrl, title || '未命名资源');

    if (!result) {
      return NextResponse.json(
        { error: '获取资源失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      shareUrl: result.shareUrl,
    });
  } catch (error: any) {
    console.error('[API/save] Error:', error);

    const message = error.message || '保存失败';

    if (message.includes('资源已失效') || message.includes('不存在')) {
      return NextResponse.json({ error: '该资源已失效或不存在', invalid: true }, { status: 410 });
    }

    if (message.includes('空间不足')) {
      return NextResponse.json({ error: '服务器存储空间不足，请稍后重试' }, { status: 503 });
    }

    return NextResponse.json(
      { error: '获取资源失败，请稍后重试' },
      { status: 500 }
    );
  }
}

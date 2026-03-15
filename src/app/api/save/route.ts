import { NextRequest, NextResponse } from 'next/server';
import { saveAndShareResource } from '@/lib/save-service';
import { QuarkAPI } from '@/lib/quark-api';
import { extractPwdId } from '@/lib/utils';
import { redis } from '@/lib/redis';

/**
 * 资源有效性验证结果
 * - 'valid': 资源有效
 * - 'invalid': 资源确认失效（API明确返回错误）
 * - 'unknown': 网络异常/超时，无法判断（不应视为失效）
 */
type ValidateResult = 'valid' | 'invalid' | 'unknown';

/**
 * 单条资源有效性验证 (PanCheck 两步验证法)
 * 区分"资源确认失效"和"网络异常无法判断"两种情况
 */
async function validateSingleResource(url: string): Promise<ValidateResult> {
  try {
    const extracted = extractPwdId(url);
    if (!extracted) return 'invalid';

    const api = new QuarkAPI('');

    // 步骤1: 获取 stoken
    const stokenResult = await Promise.race([
      api.getStoken(extracted.pwdId, extracted.passcode),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (stokenResult === null) return 'unknown'; // 超时 → 无法判断，不视为失效
    if (!stokenResult.ok || !stokenResult.stoken) return 'invalid'; // API明确返回失败

    // 步骤2: 用 stoken 获取文件列表
    const fileList = await Promise.race([
      api.getShareDetail(extracted.pwdId, stokenResult.stoken),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    if (fileList === null) return 'unknown'; // 超时 → 无法判断
    return fileList.length > 0 ? 'valid' : 'invalid';
  } catch (error: any) {
    // 网络错误（ETIMEDOUT, ECONNREFUSED等）→ 无法判断，不应视为失效
    const isNetworkError = error?.cause?.code === 'ETIMEDOUT'
      || error?.cause?.code === 'ECONNREFUSED'
      || error?.cause?.code === 'ENOTFOUND'
      || error?.message?.includes('fetch failed');
    if (isNetworkError) {
      console.warn('⚠️ [有效性检测] 网络异常, 跳过验证:', error?.cause?.code || error?.message);
      return 'unknown';
    }
    return 'unknown';
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
    console.error('❌ [转存] 清除搜索缓存失败:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareUrl, title } = body;

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

    // ⭐ 先验证资源有效性（仅在确认失效时拒绝，网络异常时跳过验证继续尝试）
    const validity = await validateSingleResource(shareUrl);
    if (validity === 'invalid') {
      // 资源确认失效，从搜索缓存中移除
      removeFromSearchCache(shareUrl).catch(() => {});
      return NextResponse.json(
        { error: '该资源已失效或不存在，请换一个资源保存', invalid: true },
        { status: 410 }
      );
    }
    // validity === 'unknown' 时不阻断，继续尝试转存（让转存流程自己判断）

    const result = await saveAndShareResource(shareUrl, title || '未命名资源');

    if (!result.ok) {
      const message = result.message || '获取资源失败，请稍后重试';
      console.error('❌ [转存] 转存分享失败:', message);

      if (message.includes('资源已失效') || message.includes('不存在') || message.includes('分享内容为空')) {
        removeFromSearchCache(shareUrl).catch(() => {});
        return NextResponse.json({ error: message, invalid: true }, { status: 410 });
      }

      if (message.includes('空间不足') || message.includes('容量')) {
        return NextResponse.json({ error: '服务器存储空间不足，请稍后重试' }, { status: 503 });
      }

      if (message.includes('暂无可用')) {
        return NextResponse.json({ error: message }, { status: 503 });
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      shareUrl: result.shareUrl,
    });
  } catch (error: any) {
    console.error('💥 [转存] 接口异常:', error);

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

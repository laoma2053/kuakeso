import { NextRequest, NextResponse } from 'next/server';
import { saveAndShareResource } from '@/lib/save-service';

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
      return NextResponse.json({ error: '该资源已失效或不存在' }, { status: 404 });
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

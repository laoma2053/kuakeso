import { NextRequest, NextResponse } from 'next/server';
import { searchResources } from '@/lib/search-service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, page = 1 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '请输入搜索关键词' },
        { status: 400 }
      );
    }

    const trimmed = query.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      return NextResponse.json(
        { error: '关键词长度应在1-100字之间' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    const result = await searchResources(trimmed, page, ip);

    // Record search log asynchronously (don't block response)
    prisma.searchLog.create({
      data: {
        keyword: trimmed,
        resultsCount: result.total || 0,
        ip,
        userAgent,
      },
    }).catch((err: unknown) => {
      console.error('⚠️ [搜索] 记录搜索日志失败:', err);
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ [搜索] 搜索接口异常:', error);

    if (error.message?.includes('请求过于频繁')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: '搜索服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}

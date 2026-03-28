import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ resources: [] });
  }

  try {
    // 查询相关资源（标题包含关键词且状态为 active）
    const resources = await prisma.resource.findMany({
      where: {
        status: 'active',
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        slug: true,
        title: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({ resources });
  } catch (error) {
    return NextResponse.json({ resources: [] });
  }
}

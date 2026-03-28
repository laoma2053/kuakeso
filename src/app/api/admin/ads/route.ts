import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-secret-token';

// 验证管理员权限
function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  return token === ADMIN_TOKEN;
}

// GET - 获取广告配置
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'sidebar_ads' },
    });

    const ads = config?.value || [];
    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST - 更新广告配置
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { ads } = await req.json();

    await prisma.siteConfig.upsert({
      where: { key: 'sidebar_ads' },
      create: {
        key: 'sidebar_ads',
        value: ads,
      },
      update: {
        value: ads,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-secret-token';

function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  return token === ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: 'friendly_links' } });
    return NextResponse.json({ links: config?.value || [] });
  } catch {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const { links } = await req.json();
    await prisma.siteConfig.upsert({
      where: { key: 'friendly_links' },
      create: { key: 'friendly_links', value: links },
      update: { value: links },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

/**
 * GET /api/admin/accounts - 获取所有夸克账号
 */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorizedResponse();

  const rawAccounts = await prisma.cloudAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      platform: true,
      usedSpace: true,
      totalSpace: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      _count: { select: { resources: true } },
    },
  });

  // BigInt 无法被 JSON.stringify 序列化，需要转换为 Number
  const accounts = rawAccounts.map((a) => ({
    ...a,
    usedSpace: Number(a.usedSpace),
    totalSpace: Number(a.totalSpace),
  }));

  return NextResponse.json({ accounts });
}

/**
 * POST /api/admin/accounts - 添加夸克账号
 */
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorizedResponse();

  const body = await req.json();
  const { name, cookie } = body;

  if (!cookie) {
    return NextResponse.json({ error: '请提供Cookie' }, { status: 400 });
  }

  // 验证cookie是否有效
  const { QuarkAPI } = await import('@/lib/quark-api');
  const api = new QuarkAPI(cookie);

  try {
    const info = await api.getAccountInfo();
    if (!info) {
      return NextResponse.json({ error: 'Cookie无效或已过期' }, { status: 400 });
    }

    const account = await prisma.cloudAccount.create({
      data: {
        name: name || info.nickname || '夸克账号',
        platform: 'quark',
        cookie,
        usedSpace: 0,
        totalSpace: 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: account.id,
      name: account.name,
      message: '账号添加成功',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '账号验证失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/accounts - 删除账号
 */
export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '缺少账号ID' }, { status: 400 });
  }

  await prisma.cloudAccount.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ message: '账号已删除' });
}

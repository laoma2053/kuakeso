import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

/**
 * GET /api/admin/stats - 获取系统统计信息
 */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorizedResponse();

  const [
    accountCount,
    activeAccountCount,
    resourceCount,
    todaySearchCount,
    recentResources,
  ] = await Promise.all([
    prisma.cloudAccount.count(),
    prisma.cloudAccount.count({ where: { isActive: true } }),
    prisma.resource.count(),
    prisma.searchLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        shareUrl: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      accountCount,
      activeAccountCount,
      resourceCount,
      todaySearchCount,
    },
    recentResources,
  });
}

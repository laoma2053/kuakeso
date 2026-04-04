import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_PLATFORMS = ['quark', 'baidu', 'xunlei', 'uc'];

export async function GET() {
  const rows = await prisma.cloudAccount.findMany({
    where: { isActive: true },
    select: { platform: true },
    distinct: ['platform'],
  });

  const found = rows.map((r) => r.platform).filter((p) => VALID_PLATFORMS.includes(p));
  // quark 始终存在且排第一
  const platforms = ['quark', ...VALID_PLATFORMS.slice(1).filter((p) => found.includes(p))];

  return NextResponse.json({ platforms });
}

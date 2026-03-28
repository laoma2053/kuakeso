import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'sidebar_ads' },
    });

    const ads = config?.value || [];
    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ ads: [] });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'dialog_ads' },
    });
    return NextResponse.json({ ads: config?.value || [] });
  } catch {
    return NextResponse.json({ ads: [] });
  }
}

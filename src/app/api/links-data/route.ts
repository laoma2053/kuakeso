import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: 'friendly_links' } });
    return NextResponse.json({ links: config?.value || [] });
  } catch {
    return NextResponse.json({ links: [] });
  }
}

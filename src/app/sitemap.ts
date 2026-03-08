import { MetadataRoute } from 'next';

// 强制运行时动态生成，不在构建时预渲染
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic resource pages (latest 500)
  try {
    const { prisma } = await import('@/lib/prisma');
    const resources = await prisma.resource.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { slug: true, updatedAt: true },
    });

    const resourcePages: MetadataRoute.Sitemap = resources.map((r) => ({
      url: `${baseUrl}/res/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...resourcePages];
  } catch {
    // 构建时或数据库不可用时，只返回静态页面
    return staticPages;
  }
}

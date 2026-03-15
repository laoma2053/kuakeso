import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ResourceDetail } from '@/components/resource-detail';

interface PageProps {
  params: { slug: string };
}

async function getResource(slug: string) {
  const resource = await prisma.resource.findUnique({
    where: { slug },
  });
  return resource;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resource = await getResource(params.slug);

  if (!resource) {
    return { title: '资源不存在 - 网盘搜' };
  }

  const title = `${resource.title} - 夸克网盘资源下载 - 网盘搜`;
  const description = `免费获取「${resource.title}」夸克网盘资源，高速下载，安全可靠。网盘搜为您提供最新最全的网盘资源搜索服务。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ResourcePage({ params }: PageProps) {
  const resource = await getResource(params.slug);

  if (!resource) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: resource.title,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/res/${resource.slug}`,
    datePublished: resource.createdAt.toISOString(),
    provider: {
      '@type': 'Organization',
      name: '网盘搜',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <ResourceDetail resource={{
              title: resource.title,
              shareUrl: resource.shareUrl || '',
              slug: resource.slug,
              createdAt: resource.createdAt.toISOString(),
            }} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

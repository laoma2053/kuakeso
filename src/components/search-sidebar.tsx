'use client';

import Link from 'next/link';

interface RelatedResource {
  slug: string;
  title: string;
}

interface SearchSidebarProps {
  relatedResources?: RelatedResource[];
  ads?: Array<{ text: string; url: string }>;
}

export function SearchSidebar({ relatedResources = [], ads = [] }: SearchSidebarProps) {
  return (
    <aside className="space-y-6 sticky top-20">
      {/* 相关资源 */}
      {relatedResources.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">相关资源</h3>
          <div className="space-y-2">
            {relatedResources.slice(0, 5).map((item) => (
              <Link
                key={item.slug}
                href={`/res/${item.slug}`}
                className="block text-sm text-blue-600 hover:underline line-clamp-2"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 广告位 */}
      {ads.length > 0 && (
        <div className="bg-surface-secondary border border-border rounded-lg p-4">
          <div className="space-y-3">
            {ads.map((ad, index) => (
              <a
                key={index}
                href={ad.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-text-primary hover:text-brand-500 transition-colors"
              >
                {ad.text}
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

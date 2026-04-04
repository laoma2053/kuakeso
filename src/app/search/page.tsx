'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { type ResourceItem } from '@/components/resource-card';
import { ResourceListItem } from '@/components/resource-list-item';
import { SearchSidebar } from '@/components/search-sidebar';

const PLATFORM_LABELS: Record<string, string> = {
  quark: '夸克网盘',
  baidu: '百度网盘',
  xunlei: '迅雷网盘',
  uc: 'UC网盘',
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const platform = searchParams.get('platform') || 'quark';
  const logoSrc = useMemo(() => Math.random() > 0.5 ? '/pic/logo_zh.png' : '/pic/logo_en.png', []);

  const [results, setResults] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<Array<{ text: string; url: string }>>([]);
  const [relatedResources, setRelatedResources] = useState<Array<{ slug: string; title: string }>>([]);
  const [platforms, setPlatforms] = useState<string[]>(['quark']);

  // 获取已配置平台列表
  useEffect(() => {
    fetch('/api/platforms')
      .then((r) => r.json())
      .then((d) => { if (d.platforms?.length) setPlatforms(d.platforms); })
      .catch(() => {});
  }, []);

  // 当资源验证失效时，从列表中移除
  const handleInvalidResource = (url: string) => {
    setResults((prev) => prev.filter((r) => r.url !== url));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  // 获取广告配置
  useEffect(() => {
    fetch('/api/ads')
      .then((res) => res.json())
      .then((data) => setAds(data.ads || []))
      .catch(() => setAds([]));
  }, []);

  // 获取相关资源
  useEffect(() => {
    if (!query) return;
    fetch(`/api/related?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setRelatedResources(data.resources || []))
      .catch(() => setRelatedResources([]));
  }, [query]);

  useEffect(() => {
    if (!query) return;
    setSearchInput(query);

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, page, platform }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '搜索失败');
        // Map SearchResultItem to ResourceItem
        const mapped = (data.results || []).map((item: any) => ({
          url: item.url,
          password: item.password,
          note: item.title, // SearchResultItem.title -> ResourceItem.note
          datetime: item.datetime,
          source: item.source,
        }));
        setResults(mapped);
        setTotal(data.total || 0);
      } catch (err: any) {
        setError(err.message || '搜索出错');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&platform=${platform}`);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">

      {/* Sticky Header：Logo + 搜索框 + 导航 */}
      <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 sm:gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src={logoSrc} alt="夸克点搜" className="h-7 sm:h-9 w-auto object-contain" />
          </Link>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="输入关键词搜索资源..."
              enterKeyHint="search"
              className="w-full px-4 sm:px-5 py-2.5 sm:py-3.5
                         bg-white
                         border border-border
                         rounded-full
                         text-text-primary text-[16px] sm:text-base
                         placeholder:text-text-tertiary
                         shadow-[0_1px_6px_rgba(32,33,36,0.08)]
                         transition-shadow duration-200
                         focus:outline-none
                         focus:shadow-[0_1px_6px_rgba(32,33,36,0.28)]
                         hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)]
                         active:shadow-[0_1px_6px_rgba(32,33,36,0.28)]
                         md:appearance-none md:shadow-sm md:focus:shadow-md md:hover:shadow-md md:active:shadow-md"
            />
          </form>

        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Stats */}
        {!loading && query && (
          <p className="text-sm text-text-secondary mb-3">
            搜索 &quot;<span className="text-brand-500 font-medium">{query}</span>&quot;
            {total > 0 && <>，找到 <span className="font-medium text-text-primary">{total}</span> 个{PLATFORM_LABELS[platform] ?? platform}资源</>}
          </p>
        )}

        {/* 平台 Tab 栏 - 多平台时显示 */}
        {platforms.length > 1 && (
          <div className="flex items-center gap-1 border-b border-border mb-4">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&platform=${p}`)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  platform === p
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {PLATFORM_LABELS[p] ?? p}
              </button>
            ))}
          </div>
        )}

        {/* 两栏布局：主内容 + 侧边栏 */}
        <div className="flex gap-6">
          {/* 主内容区 */}
          <div className="flex-1 min-w-0">
            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-border rounded-lg p-4">
                    <div className="skeleton h-5 w-3/4 mb-3" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="text-center py-16">
                <p className="text-red-500 mb-2">{error}</p>
                <button onClick={() => router.refresh()} className="btn-secondary text-sm">
                  重试
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && query && results.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-text-secondary text-lg mb-2">没有找到相关资源</p>
                <p className="text-text-secondary text-sm">试试其他关键词</p>
              </div>
            )}

            {/* Results List */}
            {!loading && results.length > 0 && (
              <>
                <div className="space-y-2">
                  {results.map((resource, index) => (
                    <ResourceListItem
                      key={`${resource.url}-${index}`}
                      resource={resource}
                      searchQuery={query}
                      onInvalid={handleInvalidResource}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&platform=${platform}&page=${page - 1}`)}
                      disabled={page <= 1}
                      className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-text-secondary px-3">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&platform=${platform}&page=${page + 1}`)}
                      disabled={page >= totalPages}
                      className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 侧边栏 - 仅在有结果时显示 */}
          {!loading && results.length > 0 && (
            <div className="hidden lg:block w-80 flex-shrink-0 border-l border-border pl-6 md:pl-8">
              <SearchSidebar
                relatedResources={relatedResources}
                ads={ads}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

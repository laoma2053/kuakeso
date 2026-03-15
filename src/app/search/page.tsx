'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Loader2, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { ResourceCard, type ResourceItem } from '@/components/resource-card';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [error, setError] = useState<string | null>(null);

  // 当资源验证失效时，从列表中移除
  const handleInvalidResource = (url: string) => {
    setResults((prev) => prev.filter((r) => r.url !== url));
    setTotal((prev) => Math.max(0, prev - 1));
  };

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
          body: JSON.stringify({ query, page }),
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
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark">

      {/* Sticky Header：Logo + 搜索框 + 导航 */}
      <div className="sticky top-0 z-50 bg-bg-primary dark:bg-bg-primary-dark border-b border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 sm:gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src="/pic/logo.png" alt="夸克搜" className="h-7 sm:h-9 w-auto object-contain" />
          </Link>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="输入关键词搜索资源..."
              className="w-full px-4 sm:px-5 py-2.5 sm:py-3.5
                         bg-white dark:bg-gray-800
                         border border-gray-200 dark:border-gray-700
                         rounded-full
                         text-gray-800 dark:text-gray-100 text-sm sm:text-base
                         placeholder:text-gray-400
                         shadow-[0_0_8px_rgba(32,33,36,0.08)]
                         transition-shadow duration-300 ease-out
                         focus:outline-none
                         hover:shadow-[0_0_16px_rgba(32,33,36,0.15)]
                         focus:shadow-[0_0_16px_rgba(32,33,36,0.15)]"
            />
          </form>

          {/* 弹性空白，将导航推到右侧 */}
          <div className="flex-1" />

          {/* 导航 */}
          <nav className="flex items-center gap-4 flex-shrink-0">
            <Link href="/" className="text-sm text-text-secondary hover:text-text-primary dark:text-text-secondary-dark dark:hover:text-text-primary-dark transition-colors">
              首页
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="切换主题"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </nav>

        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Stats */}
        {!loading && query && (
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
            搜索 &quot;<span className="text-brand-500 font-medium">{query}</span>&quot;
            {total > 0 && <>，找到 <span className="font-medium text-text-primary dark:text-text-primary-dark">{total}</span> 个资源</>}
          </p>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton h-5 w-3/4 mb-3" />
                <div className="skeleton h-3 w-1/2 mb-4" />
                <div className="skeleton h-9 w-full mt-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="btn-secondary text-sm"
            >
              重试
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && query && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-text-secondary dark:text-text-secondary-dark text-lg mb-2">
              没有找到相关资源
            </p>
            <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
              试试其他关键词
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((resource, index) => (
                <ResourceCard key={`${resource.url}-${index}`} resource={resource} index={index} onInvalid={handleInvalidResource} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&page=${page - 1}`)}
                  disabled={page <= 1}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark px-3">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&page=${page + 1}`)}
                  disabled={page >= totalPages}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-bg-primary-dark">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

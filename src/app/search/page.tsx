'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ResourceCard, type ResourceItem } from '@/components/resource-card';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
      <Header />

      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-bg-primary/90 dark:bg-bg-primary-dark/90 backdrop-blur-md border-b border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="p-2 rounded-xl hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索资源..."
                className="search-input text-sm py-2.5 pr-10"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-r from-[#5B6CF9] to-[#8B5CF6] text-white"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
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

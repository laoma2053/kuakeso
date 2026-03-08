'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchHero() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [query, router]);

  const hotSearches = ['速度与激情', '甄嬛传', '三体', 'Office', 'PS教程', '考研资料'];

  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      {/* Logo & Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5B6CF9] to-[#8B5CF6] shadow-xl mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
          <span className="gradient-text">网盘搜</span>
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark text-base sm:text-lg max-w-md mx-auto">
          搜索全网夸克网盘资源，一键获取分享链接
        </p>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
        <div className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索资源..."
            className="search-input pr-14 text-base sm:text-lg"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-r from-[#5B6CF9] to-[#8B5CF6] flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Hot Searches */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
        <span className="text-xs text-text-secondary dark:text-text-secondary-dark mr-1">热门搜索:</span>
        {hotSearches.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setQuery(tag);
              router.push(`/search?q=${encodeURIComponent(tag)}`);
            }}
            className="px-3 py-1.5 text-xs rounded-full
                       bg-brand-50 dark:bg-brand-900/20
                       text-brand-600 dark:text-brand-300
                       hover:bg-brand-100 dark:hover:bg-brand-900/40
                       transition-colors cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-16 flex items-center gap-8 text-center">
        <div>
          <div className="text-2xl font-bold gradient-text">1M+</div>
          <div className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">资源收录</div>
        </div>
        <div className="w-px h-8 bg-border dark:bg-border-dark" />
        <div>
          <div className="text-2xl font-bold gradient-text">秒级</div>
          <div className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">搜索响应</div>
        </div>
        <div className="w-px h-8 bg-border dark:bg-border-dark" />
        <div>
          <div className="text-2xl font-bold gradient-text">免费</div>
          <div className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">无需注册</div>
        </div>
      </div>
    </section>
  );
}

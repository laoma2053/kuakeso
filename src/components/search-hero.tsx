'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    <section className="flex-1 flex flex-col items-center px-4">

      {/* Logo + 搜索框 + 热门搜索 */}
      <div className="flex flex-col items-center w-full">

        {/* Logo */}
        <div className="mb-5 sm:mb-6">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
            <Image
              src="/pic/logo.png"
              alt="夸克搜"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-3 sm:mb-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词搜索资源..."
              className="w-full px-5 py-3.5 sm:py-4
                         bg-white
                         border border-gray-200
                         rounded-full
                         text-gray-800 text-base sm:text-lg
                         placeholder:text-gray-400
                         shadow-[0_0_8px_rgba(32,33,36,0.08)]
                         transition-shadow duration-300 ease-out
                         focus:outline-none
                         hover:shadow-[0_0_16px_rgba(32,33,36,0.15)]
                         focus:shadow-[0_0_16px_rgba(32,33,36,0.15)]"
            />
          </div>
        </form>

        {/* Hot Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl px-2">
          <span className="text-xs text-gray-400 mr-1">热门搜索</span>
          {hotSearches.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                router.push(`/search?q=${encodeURIComponent(tag)}`);
              }}
              className="px-3 py-1 text-xs rounded-full
                         bg-gray-50 text-gray-600
                         hover:bg-gray-100
                         transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

      </div>

    </section>
  );
}

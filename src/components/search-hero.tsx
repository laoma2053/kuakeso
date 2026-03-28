'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export function SearchHero() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const logoSrc = useMemo(() => Math.random() > 0.5 ? '/pic/logo_zh.png' : '/pic/logo_en.png', []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [query, router]);

  const hotSearches = ['速度与激情', '甄嬛传', '三体', 'Office', 'PS教程', '考研资料'];

  return (
    <section className="flex-1 flex flex-col items-center px-4 pt-[20vh]">

      {/* Logo + 搜索框 + 热门搜索 */}
      <div className="flex flex-col items-center w-full">

        {/* Logo */}
        <div className="mb-8">
          <div className="relative w-52 h-[52px] sm:w-64 sm:h-16 lg:w-80 lg:h-20">
            <Image
              src={logoSrc}
              alt="夸克点搜"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-4">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜夸克网盘资源..."
              enterKeyHint="search"
              className="w-full px-5 py-3.5 sm:py-4
                         bg-white
                         border border-gray-200
                         rounded-full
                         text-gray-800 text-base sm:text-lg
                         placeholder:text-gray-400
                         shadow-[0_1px_6px_rgba(32,33,36,0.08)]
                         transition-shadow duration-200
                         focus:outline-none
                         focus:shadow-[0_1px_6px_rgba(32,33,36,0.28)]
                         hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)]
                         active:shadow-[0_1px_6px_rgba(32,33,36,0.28)]"
            />
          </div>
        </form>

        {/* Hot Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl px-2">
          <span className="text-xs text-gray-400 mr-1">热门搜索</span>
          {hotSearches.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              prefetch={true}
              className="px-3 py-1 text-xs rounded-full
                         bg-gray-100 text-gray-700
                         hover:bg-gray-200
                         active:bg-gray-200
                         transition-colors cursor-pointer inline-block"
            >
              {tag}
            </Link>
          ))}
        </div>

      </div>

    </section>
  );
}

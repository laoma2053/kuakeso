'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

const PLATFORM_LABELS: Record<string, string> = {
  quark: '夸克',
  baidu: '百度',
  xunlei: '迅雷',
  uc: 'UC',
};

export function SearchHero() {
  const [query, setQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState('quark');
  const [platforms, setPlatforms] = useState<string[]>(['quark']);
  const router = useRouter();
  const logoSrc = useMemo(() => Math.random() > 0.5 ? '/pic/logo_zh.png' : '/pic/logo_en.png', []);

  useEffect(() => {
    fetch('/api/platforms')
      .then((r) => r.json())
      .then((d) => { if (d.platforms?.length) setPlatforms(d.platforms); })
      .catch(() => {});
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&platform=${activePlatform}`);
  }, [query, activePlatform, router]);

  const hotSearches = ['速度与激情', '甄嬛传', '三体', 'Office', 'PS教程', '考研资料'];

  return (
    <section className="flex-1 flex flex-col items-center px-4 pt-[20vh]">
      <div className="flex flex-col items-center w-full">

        {/* Logo */}
        <div className="mb-8">
          <div className="relative w-52 h-[52px] sm:w-64 sm:h-16 lg:w-80 lg:h-20">
            <Image src={logoSrc} alt="夸克点搜" fill className="object-contain" priority />
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-4">
          <div className="bg-surface-card border border-border rounded-2xl shadow-search px-4 sm:px-5 pt-4 pb-3 transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(5,81,255,0.16)] focus-within:shadow-[0_4px_24px_rgba(5,81,255,0.16)]">

            {/* 输入区 */}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜夸克网盘资源..."
              enterKeyHint="search"
              className="w-full bg-transparent text-text-primary text-base sm:text-lg placeholder:text-text-tertiary focus:outline-none mb-3 md:appearance-none"
            />

            {/* 操作栏 */}
            <div className="flex items-center justify-between">

              {/* 左侧：平台切换按钮组 */}
              <div className="flex items-center gap-1 bg-surface-secondary rounded-full p-0.5">
                {platforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePlatform(p)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 ${
                      activePlatform === p
                        ? 'bg-surface-card text-brand-500 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {PLATFORM_LABELS[p] ?? p}
                  </button>
                ))}
              </div>

              {/* 右侧：提交按钮 */}
              <button
                type="submit"
                disabled={!query.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  query.trim()
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>

            </div>
          </div>
        </form>

        {/* Hot Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-xl px-2">
          <span className="text-xs text-text-tertiary mr-1">热门搜索</span>
          {hotSearches.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}&platform=${activePlatform}`}
              prefetch={true}
              className="px-3 py-1 text-xs rounded-full bg-surface-secondary text-text-primary hover:bg-surface-hover active:bg-surface-hover transition-colors cursor-pointer inline-block"
            >
              {tag}
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

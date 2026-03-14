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
    <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
      {/* Logo区域 - 显示logo图片 */}
      <div className="mb-6 sm:mb-8">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
          <Image
            src="/pic/logo.png"
            alt="夸克搜"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* 描述文字 */}
      <p className="text-gray-500 text-sm sm:text-base text-center mb-6 sm:mb-8 max-w-md">
        聚合全网网盘资源，一键免费获取链接
      </p>

      {/* Search Box - 简洁风格 */}
      <form onSubmit={handleSearch} className="w-full max-w-xl mb-6 sm:mb-8">
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
                       transition-shadow duration-300 ease-out
                       focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15),0_1px_2px_rgba(0,0,0,0.05)]
                       hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)]"
          />
        </div>
      </form>

      {/* Hot Searches - 简化样式 */}
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

      {/* 底部信息 - 多快好省 */}
      <div className="mt-16 sm:mt-20 flex items-center gap-8 sm:gap-12 text-center">
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-800">多</div>
          <div className="text-xs text-gray-500 mt-1">百万资源</div>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-800">快</div>
          <div className="text-xs text-gray-500 mt-1">秒级响应</div>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-800">好</div>
          <div className="text-xs text-gray-500 mt-1">每日更新</div>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-800">省</div>
          <div className="text-xs text-gray-500 mt-1">免费获取</div>
        </div>
      </div>
    </section>
  );
}

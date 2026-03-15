'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="absolute top-0 right-0 z-50 p-4">
      <nav className="flex items-center gap-6">
        <Link href="/" className="text-sm text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
          首页
        </Link>
        <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">
          关于
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="切换主题"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </nav>
    </header>
  );
}

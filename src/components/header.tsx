'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-surface-dark/80 border-b border-border/50 dark:border-border-dark/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B6CF9] to-[#8B5CF6] flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:inline">网盘搜</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 dark:border-border-dark/50 bg-white dark:bg-surface-dark px-4 py-3 space-y-2">
          <Link href="/" className="block py-2 text-sm text-text-secondary" onClick={() => setMobileMenuOpen(false)}>
            首页
          </Link>
          <Link href="/about" className="block py-2 text-sm text-text-secondary" onClick={() => setMobileMenuOpen(false)}>
            关于
          </Link>
          <button
            onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMobileMenuOpen(false); }}
            className="block py-2 text-sm text-text-secondary"
          >
            {theme === 'dark' ? '☀️ 亮色模式' : '🌙 暗色模式'}
          </button>
        </div>
      )}
    </header>
  );
}

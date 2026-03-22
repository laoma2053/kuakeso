'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end">
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            首页
          </Link>
        </nav>
      </div>
    </header>
  );
}

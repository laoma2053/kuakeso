'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  // 在关于我们、免责声明、友情链接页面显示首页按钮
  const showHomeButton = ['/about', '/disclaimer', '/links'].includes(pathname);

  return (
    <header className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end">
        {showHomeButton && (
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            首页
          </Link>
        )}
      </div>
    </header>
  );
}

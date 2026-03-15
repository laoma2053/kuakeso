import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border dark:border-border-dark bg-bg-primary/80 dark:bg-bg-primary-dark/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          {/* 左：导航链接 */}
          <div className="flex items-center gap-4 text-xs text-text-secondary dark:text-text-secondary-dark">
            <Link href="/about" className="hover:text-brand-500 transition-colors">
              关于我们
            </Link>
            <span className="text-border dark:text-border-dark">|</span>
            <Link href="/disclaimer" className="hover:text-brand-500 transition-colors">
              免责声明
            </Link>
            <span className="text-border dark:text-border-dark">|</span>
            <a href="mailto:admin@example.com" className="hover:text-brand-500 transition-colors">
              联系我们
            </a>
          </div>

          {/* 右：版权 */}
          <div className="text-xs text-text-secondary dark:text-text-secondary-dark md:text-right">
            <p>本站不存储任何资源 · © {new Date().getFullYear()} 夸克搜</p>
          </div>

        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border dark:border-border-dark bg-bg-primary/80 dark:bg-bg-primary-dark/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <img src="/pic/logo.png" alt="网盘搜" className="h-6 w-auto" />
          </div>

          {/* Center: Links */}
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

          {/* Right: Copyright */}
          <div className="text-xs text-text-secondary dark:text-text-secondary-dark text-center md:text-right">
            <p>本站不存储任何资源，仅提供搜索服务</p>
            <p className="mt-1">如有侵权请联系删除 · © {new Date().getFullYear()} 网盘搜</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

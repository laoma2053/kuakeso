import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          页面未找到
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
          您访问的页面不存在或已被移除
        </p>
        <Link href="/" className="btn-primary px-6 py-2.5">
          返回首页
        </Link>
      </main>
      <Footer />
    </div>
  );
}

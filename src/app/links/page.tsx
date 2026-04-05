import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '友情链接 - 夸克点搜',
  description: '夸克点搜友情链接，推荐优质资源站点。',
};

export default function LinksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
          友情链接
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-3">推荐站点</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed mb-4">
              以下是我们推荐的优质资源站点，欢迎访问。
            </p>

            <div className="space-y-3">
              {/* 示例链接，可在后台管理 */}
              <div className="flex items-center justify-between p-3 bg-bg-secondary dark:bg-bg-secondary-dark rounded-lg">
                <div>
                  <h3 className="font-medium text-text-primary dark:text-text-primary-dark">示例站点</h3>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark">优质资源分享平台</p>
                </div>
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:underline text-sm"
                >
                  访问
                </a>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-3">申请友链</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              如需申请友情链接，请确保您的站点内容健康、合法，并发送邮件至：
              <a href="mailto:so@kuake.so" className="text-brand-500 hover:underline ml-1">so@kuake.so</a>
            </p>
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="inline-block px-6 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-brand-500/30 transition-colors text-sm">
              返回首页
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

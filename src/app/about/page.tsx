import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们 - 夸克搜',
  description: '夸克搜是一个免费的夸克网盘资源搜索平台，为用户提供快速、便捷的资源搜索服务。',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
          关于夸克搜
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-3">我们是谁</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              夸克搜是一个免费的网盘资源搜索平台。我们通过聚合互联网上公开分享的网盘资源链接，
              为用户提供快速、精准的搜索服务。
            </p>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed mt-2">
              我们<span className="font-semibold text-text-primary dark:text-text-primary-dark">不存储任何文件内容</span>，仅提供资源索引和搜索功能。
            </p>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-3">为什么选择夸克搜</h2>
            <ul className="text-text-secondary dark:text-text-secondary-dark space-y-2 leading-relaxed">
              <li><span className="font-semibold text-text-primary dark:text-text-primary-dark">多</span> · 资源丰富 — 聚合全网公开分享的网盘资源，影视、学习、软件、文档一搜即达</li>
              <li><span className="font-semibold text-text-primary dark:text-text-primary-dark">快</span> · 速度极快 — 多级缓存与智能检索加持，输入关键词即刻呈现搜索结果</li>
              <li><span className="font-semibold text-text-primary dark:text-text-primary-dark">好</span> · 质量可靠 — 资源索引实时同步，自动过滤失效链接，确保搜索质量</li>
              <li><span className="font-semibold text-text-primary dark:text-text-primary-dark">省</span> · 完全免费 — 无需注册、无需付费，搜索和获取资源链接全程零成本</li>
            </ul>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-3">如何使用</h2>
            <ol className="list-decimal list-inside text-text-secondary dark:text-text-secondary-dark space-y-2 leading-relaxed">
              <li>在搜索框输入关键词，点击搜索</li>
              <li>在搜索结果中找到需要的资源</li>
              <li>点击"获取资源"获取分享链接</li>
              <li>使用夸克网盘APP或客户端打开链接</li>
              <li>将资源转存到自己的网盘后即可下载</li>
            </ol>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-3">联系我们</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              如有任何问题、建议或侵权投诉，请发送邮件至：
              <a href="mailto:admin@example.com" className="text-brand-500 hover:underline">admin@example.com</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

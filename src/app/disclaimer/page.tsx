import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '免责声明 - 网盘搜',
  description: '网盘搜免责声明与服务条款',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary dark:bg-bg-primary-dark">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
          免责声明
        </h1>

        <div className="card p-6 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">1. 服务性质</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              网盘搜（以下简称"本站"）是一个网盘资源搜索引擎，仅提供信息检索服务。
              本站不存储、上传、复制或传播任何文件内容，所有搜索结果均来源于互联网公开信息。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">2. 版权声明</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              本站搜索结果中的所有资源版权归原作者和版权方所有。
              如果您是版权方，发现本站搜索结果中包含侵犯您合法权益的内容，请通过联系方式通知我们，
              我们将在收到通知后尽快删除相关搜索结果。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">3. 用户责任</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              用户通过本站搜索和获取的资源仅供学习和研究使用。
              用户应在下载后24小时内删除，如因用户使用搜索结果产生的任何法律纠纷，本站不承担任何责任。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">4. 免责条款</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              本站不保证搜索结果的准确性、完整性和时效性。对于因使用本站服务而造成的任何直接或间接损失，
              本站不承担任何责任。本站保留随时修改本声明的权利。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">5. 侵权通知</h2>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              如需提交侵权通知，请发送邮件至
              <a href="mailto:admin@example.com" className="text-brand-500 hover:underline ml-1">admin@example.com</a>，
              邮件中请包含：被侵权内容的描述、侵权搜索结果的链接、您的联系方式、版权证明材料。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

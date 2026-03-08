'use client';

import { ExternalLink, Calendar, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';

interface ResourceDetailProps {
  resource: {
    title: string;
    shareUrl: string;
    slug: string;
    createdAt: string;
  };
}

export function ResourceDetail({ resource }: ResourceDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resource.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = resource.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
        {resource.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
        <Calendar className="w-4 h-4" />
        <time dateTime={resource.createdAt}>
          {new Date(resource.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>

      {/* Share URL */}
      <div className="bg-bg-secondary dark:bg-bg-secondary-dark rounded-xl p-4 mb-6">
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark mb-2">资源链接</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm text-brand-600 dark:text-brand-400 break-all">
            {resource.shareUrl}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 p-2 rounded-lg hover:bg-bg-primary dark:hover:bg-bg-primary-dark transition-colors"
            title="复制链接"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark" />
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={resource.shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base"
        >
          <ExternalLink className="w-5 h-5" />
          打开夸克网盘
        </a>
        <button
          onClick={handleCopy}
          className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 text-base"
        >
          {copied ? (
            <>
              <CheckCheck className="w-5 h-5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              复制链接
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>温馨提示：</strong>请使用夸克网盘APP或客户端打开链接，转存后即可高速下载。
          如链接失效，请返回搜索页重新获取。
        </p>
      </div>
    </div>
  );
}

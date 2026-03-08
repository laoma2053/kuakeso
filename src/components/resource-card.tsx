'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Clock, Globe, Shield, Loader2 } from 'lucide-react';
import { CaptchaDialog } from './captcha-dialog';

export interface ResourceItem {
  url: string;
  password?: string;
  note?: string;
  datetime?: string;
  source?: string;
}

interface ResourceCardProps {
  resource: ResourceItem;
  index: number;
}

export function ResourceCard({ resource, index }: ResourceCardProps) {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = resource.note || extractTitle(resource.url);
  const domain = extractDomain(resource.url);
  const timeAgo = resource.datetime ? formatRelativeTime(resource.datetime) : null;

  const handleGetResource = () => {
    setShowCaptcha(true);
  };

  const handleCaptchaSuccess = useCallback(async () => {
    setShowCaptcha(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareUrl: resource.url,
          password: resource.password,
          title: resource.note || title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '获取资源失败');
      }

      setShareUrl(data.shareUrl);
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [resource.url, resource.password]);

  return (
    <>
      <div
        className="card group hover:shadow-brand-sm transition-all duration-300"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex flex-col h-full">
          {/* Title */}
          <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-2 line-clamp-2 group-hover:text-brand-500 transition-colors">
            {title}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-text-secondary-dark mb-4">
            {timeAgo && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
            )}
            {domain && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {domain}
              </span>
            )}
            {resource.password && (
              <span className="flex items-center gap-1 text-amber-500">
                <Shield className="w-3 h-3" />
                有密码
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2"
              >
                <ExternalLink className="w-4 h-4" />
                打开资源
              </a>
            ) : (
              <button
                onClick={handleGetResource}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    获取中...
                  </>
                ) : (
                  '获取资源'
                )}
              </button>
            )}
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-3 py-2 text-sm"
              title="访问原始链接"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>
      </div>

      {/* Captcha Dialog */}
      <CaptchaDialog
        open={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onSuccess={handleCaptchaSuccess}
      />
    </>
  );
}

/* Helper functions */
function extractTitle(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || u.hostname;
  } catch {
    return url.slice(0, 60);
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function formatRelativeTime(datetime: string): string {
  try {
    const date = new Date(datetime);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  } catch {
    return datetime;
  }
}

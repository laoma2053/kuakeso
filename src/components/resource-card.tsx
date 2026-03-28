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
  onInvalid?: (url: string) => void;
}

export function ResourceCard({ resource, index, onInvalid }: ResourceCardProps) {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState<string>('');

  const title = resource.note || extractTitle(resource.url);
  const domain = extractDomain(resource.url);
  const timeAgo = resource.datetime ? formatRelativeTime(resource.datetime) : null;

  const handleGetResource = () => {
    setResourceTitle(title);
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
        // 资源失效 (410 Gone)，通知父组件移除该卡片
        if (data.invalid && onInvalid) {
          setError('该资源已失效，正在移除...');
          setTimeout(() => onInvalid(resource.url), 1500);
          return;
        }
        throw new Error(data.error || '获取资源失败');
      }

      setShareUrl(data.shareUrl);
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [resource.url, resource.password, resource.note, title, onInvalid]);

  return (
    <>
      <div
        className="card group hover:shadow-brand-sm transition-all duration-300 h-auto"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex flex-col p-5">
          {/* Title */}
          <h3 className="font-semibold text-base text-text-primary dark:text-text-primary-dark mb-3 line-clamp-2 group-hover:text-brand-500 transition-colors leading-relaxed min-h-[3rem]">
            {title}
          </h3>

          {/* Meta */}
          {resource.password && (
            <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-text-secondary-dark mb-3">
              <span className="flex items-center gap-1 text-amber-500">
                <Shield className="w-3 h-3" />
                有密码
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3">
            {shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <ExternalLink className="w-4 h-4" />
                打开资源
              </a>
            ) : (
              <button
                onClick={handleGetResource}
                disabled={loading}
                className="w-full flex items-stretch rounded-lg overflow-hidden disabled:opacity-50 transition-all hover:shadow-lg"
              >
                <span className="flex-1 bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-text-secondary-dark text-xs py-2.5 px-4 flex items-center">
                  {timeAgo ? `分享日期：${timeAgo}` : '获取网盘资源'}
                </span>
                <span className="bg-brand-500 text-white text-sm font-medium py-2.5 px-6 flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      获取中
                    </>
                  ) : (
                    '获取资源'
                  )}
                </span>
              </button>
            )}
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
        resourceTitle={resourceTitle}
        shareUrl={shareUrl}
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

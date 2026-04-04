'use client';

import { useState, useCallback } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { CaptchaDialog } from './captcha-dialog';
import Link from 'next/link';

export interface ResourceItem {
  url: string;
  password?: string;
  note?: string;
  datetime?: string;
  source?: string;
}

interface ResourceListItemProps {
  resource: ResourceItem;
  searchQuery?: string;
  onInvalid?: (url: string) => void;
}

export function ResourceListItem({ resource, searchQuery, onInvalid }: ResourceListItemProps) {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = resource.note || extractTitle(resource.url);
  const timeAgo = resource.datetime ? formatRelativeTime(resource.datetime) : null;
  const sourceLabel = getSourceLabel(resource.source);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    } else {
      setShowCaptcha(true);
    }
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
        if (data.invalid && onInvalid) {
          setError('该资源已失效');
          setTimeout(() => onInvalid(resource.url), 1500);
          return;
        }
        throw new Error(data.error || '获取资源失败');
      }

      setShareUrl(data.shareUrl);
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  }, [resource.url, resource.password, resource.note, title, onInvalid]);

  return (
    <>
      <div className="border border-border rounded-lg p-3 hover:ring-1 hover:ring-border transition-all">
        {/* 标题 */}
        <a
          href="#"
          onClick={handleTitleClick}
          className={`text-lg font-medium line-clamp-1 hover:underline transition-colors ${
            shareUrl ? 'text-accent-500' : 'text-text-primary'
          }`}
        >
          {shareUrl ? title : highlightKeyword(title, searchQuery)}
        </a>

        {/* 元信息 */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-text-tertiary">
          {timeAgo && <span>{timeAgo}</span>}
          {timeAgo && <span>·</span>}
          <span>{sourceLabel}</span>
          {resource.password && <><span>·</span><span className="text-amber-500">有密码</span></>}
        </div>

        {/* 错误提示 */}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>获取中...</span>
          </div>
        )}
      </div>

      <CaptchaDialog
        open={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onSuccess={handleCaptchaSuccess}
        resourceTitle={title}
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
    return '1年前';
  } catch {
    return datetime;
  }
}

function getSourceLabel(source?: string): string {
  if (!source) return '第三方';
  if (source.includes('tg') || source.includes('telegram')) return 'TG频道';
  if (source.includes('plugin') || source.includes('extension')) return '社区论坛';
  return '第三方';
}

function highlightKeyword(text: string, keyword?: string) {
  if (!keyword) return text;

  const regex = new RegExp(`(${keyword})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="text-brand-500">{part}</span>
    ) : (
      part
    )
  );
}

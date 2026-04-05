'use client';

import { useState, useCallback } from 'react';
import { CaptchaDialog } from './captcha-dialog';

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
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const title = resource.note || extractTitle(resource.url);
  const timeAgo = resource.datetime ? formatRelativeTime(resource.datetime) : null;
  const sourceLabel = getSourceLabel(resource.source);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowCaptcha(true);
  };

  const handleCaptchaSuccess = useCallback(async () => {
    // 不关闭弹窗，在弹窗内显示 loading
    setSaving(true);
    setSaveError(null);

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
          setSaveError('该资源已失效');
          setTimeout(() => {
            setShowCaptcha(false);
            onInvalid(resource.url);
          }, 2000);
          return;
        }
        throw new Error(data.error || '获取资源失败');
      }

      setShareUrl(data.shareUrl);
    } catch (err: any) {
      setSaveError(err.message || '网络错误');
      setTimeout(() => setShowCaptcha(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [resource.url, resource.password, resource.note, title, onInvalid]);

  return (
    <>
      <div className="border border-border rounded-lg p-3 hover:shadow-card-hover hover:border-brand-500/20 transition-all duration-200">
        {/* 标题 */}
        <a
          href="#"
          onClick={handleTitleClick}
          className={`text-lg font-semibold line-clamp-1 hover:underline transition-colors ${
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
      </div>

      <CaptchaDialog
        open={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onSuccess={handleCaptchaSuccess}
        resourceTitle={title}
        shareUrl={shareUrl}
        saving={saving}
        saveError={saveError}
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

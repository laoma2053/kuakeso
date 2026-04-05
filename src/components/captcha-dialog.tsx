'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, RefreshCw, Loader2 } from 'lucide-react';

interface CaptchaDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceTitle?: string;
  shareUrl?: string | null;
  saving?: boolean;
  saveError?: string | null;
}

interface CaptchaData {
  id: string;
  question: string;
}

interface AdItem {
  text: string;
  url?: string;
}

export function CaptchaDialog({ open, onClose, onSuccess, resourceTitle, shareUrl, saving, saveError }: CaptchaDialogProps) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ads, setAds] = useState<AdItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch('/api/captcha');
      const data = await res.json();
      setCaptcha({ id: data.id, question: data.question });
      setAnswer('');
      setError('');
    } catch {
      setError('加载验证码失败');
    }
  }, []);

  useEffect(() => {
    if (open) {
      setVerified(false);
      fetchCaptcha();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, fetchCaptcha]);

  useEffect(() => {
    if (shareUrl) setVerified(true);
  }, [shareUrl]);

  // 加载弹窗广告
  useEffect(() => {
    fetch('/api/dialog-ads')
      .then((r) => r.json())
      .then((d) => setAds(d.ads || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha || !answer.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: captcha.id, answer: answer.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setVerified(true);
        onSuccess();
      } else {
        setError('验证码错误，请重试');
        fetchCaptcha();
      }
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 border border-border overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-secondary transition-colors z-10"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>

        <div className="p-6 pb-4">
          {!verified ? (
            /* ── 验证码输入 ── */
            <>
              <h3 className="text-xl font-semibold text-text-primary mb-1">安全验证</h3>
              <p className="text-sm text-text-secondary mb-6">请完成下方验证后获取资源</p>

              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 bg-surface-secondary rounded-xl px-4 py-4 text-center">
                    <span className="text-2xl font-mono font-bold text-text-primary">
                      {captcha?.question || '加载中...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="p-3 rounded-xl hover:bg-surface-secondary transition-colors"
                    title="换一个"
                  >
                    <RefreshCw className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="输入答案"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-text-primary text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all mb-4"
                />

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !answer.trim()}
                  className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-medium text-base hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {loading ? '验证中...' : '确认验证'}
                </button>
              </form>
            </>
          ) : saving ? (
            /* ── 获取中 ── */
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
              <p className="text-text-secondary">正在获取资源...</p>
            </div>
          ) : saveError ? (
            /* ── 获取失败 ── */
            <div className="py-12 flex flex-col items-center justify-center">
              <p className="text-red-500 text-center mb-2">{saveError}</p>
              <p className="text-sm text-text-tertiary">即将关闭...</p>
            </div>
          ) : shareUrl ? (
            /* ── 成功 ── */
            <>
              {/* PC端：二维码引导（md及以上） */}
              <div className="hidden md:block text-center">
                <h3 className="text-xl font-semibold text-text-primary mb-1">
                  请使用 <span className="text-brand-500">夸克APP</span> 扫码获取
                </h3>
                <p className="text-xs text-text-tertiary mb-5">
                  打开夸克APP · 点击搜索框中的相机 · 点击扫码
                </p>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-xl border border-border inline-block">
                    <img
                      src={`https://api.2dcode.biz/v1/create-qr-code?data=${encodeURIComponent(shareUrl)}&size=200x200`}
                      alt="扫码获取资源"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                {resourceTitle && (
                  <p className="text-sm text-text-secondary line-clamp-2">{resourceTitle}</p>
                )}
              </div>

              {/* 移动端：链接+保存按钮（md以下） */}
              <div className="md:hidden">
                {resourceTitle && (
                  <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-2">{resourceTitle}</h3>
                )}
                <p className="text-sm text-text-tertiary mb-3">网盘资源链接</p>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-brand-500 text-sm break-all mb-5 hover:underline"
                >
                  {shareUrl}
                </a>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3.5 rounded-xl bg-brand-500 text-white font-medium text-base text-center hover:bg-brand-600 transition-colors"
                >
                  保存到网盘
                </a>
              </div>
            </>
          ) : null}
        </div>

        {/* 广告区域 */}
        {ads.length > 0 && (
          <div className="border-t border-border px-4 py-3 bg-surface-secondary/50">
            <div className="space-y-1 text-center">
              {ads.slice(0, 3).map((ad, i) =>
                ad.url ? (
                  <a key={i} href={ad.url} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-brand-500 hover:underline">
                    {ad.text}
                  </a>
                ) : (
                  <p key={i} className="text-xs text-text-tertiary">{ad.text}</p>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

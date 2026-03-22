'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, RefreshCw, Loader2, ExternalLink, Copy, Check } from 'lucide-react';

interface CaptchaDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceTitle?: string;
  shareUrl?: string | null;
}

interface CaptchaData {
  id: string;
  question: string;
}

export function CaptchaDialog({ open, onClose, onSuccess, resourceTitle, shareUrl }: CaptchaDialogProps) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);
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
    if (shareUrl) {
      setVerified(true);
    }
  }, [shareUrl]);

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
      <div
        className="absolute inset-0 bg-white/95 dark:bg-gray-900/95"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark transition-colors z-10"
        >
          <X className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
        </button>

        <div className="p-6 pb-4">
          {!verified ? (
            <>
              {/* Title */}
              <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                安全验证
              </h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
                请完成下方验证后获取资源
              </p>

              {/* Captcha Question */}
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 bg-bg-secondary dark:bg-bg-secondary-dark rounded-xl px-4 py-4 text-center">
                    <span className="text-2xl font-mono font-bold text-text-primary dark:text-text-primary-dark">
                      {captcha?.question || '加载中...'}
                    </span>
                    <span className="text-2xl font-mono font-bold text-text-primary dark:text-text-primary-dark"> = ?</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="p-3 rounded-xl hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark transition-colors"
                    title="换一个"
                  >
                    <RefreshCw className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                  </button>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="输入答案"
                  className="w-full px-4 py-3.5 rounded-xl border border-border dark:border-border-dark
                             bg-bg-primary dark:bg-bg-primary-dark
                             text-text-primary dark:text-text-primary-dark
                             text-center text-lg font-mono
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                             transition-all mb-4"
                />

                {error && (
                  <p className="text-sm text-red-500 text-center mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !answer.trim()}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50"
                >
                  {loading ? '验证中...' : '确认验证'}
                </button>
              </form>
            </>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
              <p className="text-text-secondary dark:text-text-secondary-dark">正在获取资源...</p>
            </div>
          ) : shareUrl ? (
            <>
              {/* Success State */}
              <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-6">
                资源获取成功
              </h3>

              {/* Resource Title */}
              {resourceTitle && (
                <div className="mb-5">
                  <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-2">资源标题</p>
                  <p className="text-base text-text-primary dark:text-text-primary-dark font-medium line-clamp-2">
                    {resourceTitle}
                  </p>
                </div>
              )}

              {/* Share URL - Desktop: QR Code + Link */}
              <div className="mb-5">
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-3">网盘资源链接</p>

                {/* Desktop: QR Code */}
                <div className="hidden md:flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                      alt="扫码获取资源"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                <p className="hidden md:block text-center text-xs text-text-secondary dark:text-text-secondary-dark mb-4">
                  使用夸克 APP 扫码获取
                </p>

                {/* Mobile & Desktop: Link Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border dark:border-border-dark
                               bg-bg-secondary dark:bg-bg-secondary-dark
                               text-text-primary dark:text-text-primary-dark text-sm
                               focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-lg bg-bg-secondary dark:bg-bg-secondary-dark hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                    title="复制链接"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-4">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary py-3 text-center flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  保存到网盘
                </a>
                <button
                  onClick={onClose}
                  className="flex-1 btn-secondary py-3"
                >
                  关闭
                </button>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
                <p className="mb-1">⏰ 5分钟后删除，及时保存网盘</p>
                <p>⚠️ 不要相信资源内的任何广告信息</p>
              </div>
            </>
          ) : null}
        </div>

        {/* Ad Placeholder */}
        <div className="border-t border-border dark:border-border-dark p-4 bg-bg-secondary/30 dark:bg-bg-secondary-dark/30 rounded-b-2xl">
          <div className="text-center text-xs text-text-secondary dark:text-text-secondary-dark">
            广告位（可在管理后台配置）
          </div>
        </div>
      </div>
    </div>
  );
}

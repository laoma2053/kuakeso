'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface CaptchaDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CaptchaData {
  id: string;
  question: string;
}

export function CaptchaDialog({ open, onClose, onSuccess }: CaptchaDialogProps) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      fetchCaptcha();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, fetchCaptcha]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-bg-primary dark:bg-bg-primary-dark rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark" />
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-1">
          安全验证
        </h3>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-5">
          请完成下方验证后获取资源
        </p>

        {/* Captcha Question */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-bg-secondary dark:bg-bg-secondary-dark rounded-xl px-4 py-3 text-center">
              <span className="text-xl font-mono font-bold text-text-primary dark:text-text-primary-dark">
                {captcha?.question || '加载中...'}
              </span>
              <span className="text-xl font-mono font-bold text-text-primary dark:text-text-primary-dark"> = ?</span>
            </div>
            <button
              type="button"
              onClick={fetchCaptcha}
              className="p-2 rounded-xl hover:bg-bg-secondary dark:hover:bg-bg-secondary-dark transition-colors"
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
            className="w-full px-4 py-3 rounded-xl border border-border dark:border-border-dark
                       bg-bg-primary dark:bg-bg-primary-dark
                       text-text-primary dark:text-text-primary-dark
                       text-center text-lg font-mono
                       focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                       transition-all mb-3"
          />

          {error && (
            <p className="text-sm text-red-500 text-center mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            {loading ? '验证中...' : '确认验证'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Shield, LogOut, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdsManagePage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ads, setAds] = useState<Array<{ text: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) {
      loadAds();
    }
  }, [isLoggedIn, token]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  const loadAds = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAds(data.ads);
      } else {
        setMessage('加载失败：' + data.error);
      }
    } catch (err) {
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const saveAds = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ads }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('保存成功');
      } else {
        setMessage('保存失败：' + data.error);
      }
    } catch (err) {
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const addAd = () => {
    setAds([...ads, { text: '', url: '' }]);
  };

  const removeAd = (index: number) => {
    setAds(ads.filter((_, i) => i !== index));
  };

  const updateAd = (index: number, field: 'text' | 'url', value: string) => {
    const newAds = [...ads];
    newAds[index][field] = value;
    setAds(newAds);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-secondary dark:bg-bg-secondary-dark">
      {/* Top Bar */}
      <div className="bg-bg-primary dark:bg-bg-primary-dark border-b border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" />
              <span className="font-semibold text-text-primary dark:text-text-primary-dark">夸克搜 · 管理后台</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-text-secondary hover:text-brand-500 transition-colors">
                账号管理
              </Link>
              <Link href="/admin/ads" className="text-sm text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1">
                <Megaphone className="w-4 h-4" />
                广告管理
              </Link>
            </nav>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-text-secondary hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
            退出
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6 text-text-primary dark:text-text-primary-dark">广告管理</h1>

        {/* 广告列表 */}
        {ads.length > 0 && (
          <div className="card p-6">
            <div className="space-y-4">
              {ads.map((ad, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={ad.text}
                      onChange={(e) => updateAd(index, 'text', e.target.value)}
                      className="w-full px-4 py-2 border border-border dark:border-border-dark rounded bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark"
                      placeholder="广告文字"
                    />
                    <input
                      type="text"
                      value={ad.url}
                      onChange={(e) => updateAd(index, 'url', e.target.value)}
                      className="w-full px-4 py-2 border border-border dark:border-border-dark rounded bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark"
                      placeholder="链接地址"
                    />
                  </div>
                  <button
                    onClick={() => removeAd(index)}
                    className="btn-secondary px-4 py-2 text-red-600"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={addAd} className="btn-secondary">
                添加广告
              </button>
              <button onClick={saveAds} disabled={loading} className="btn-primary">
                保存
              </button>
            </div>

            {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

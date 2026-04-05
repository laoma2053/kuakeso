'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminNav, AdminLoginForm } from '@/components/admin-layout';

interface AdItem { text: string; url?: string; }

function AdSection({
  title, description, ads, onChange, onSave, saving,
}: {
  title: string; description: string; ads: AdItem[];
  onChange: (ads: AdItem[]) => void; onSave: () => void; saving: boolean;
}) {
  const update = (i: number, field: keyof AdItem, val: string) => {
    const next = [...ads];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  return (
    <div className="card p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
      </div>
      <div className="space-y-3 mb-4">
        {ads.map((ad, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <input
                type="text" value={ad.text} onChange={(e) => update(i, 'text', e.target.value)}
                placeholder="广告文字" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-brand-500/40"
              />
              <input
                type="text" value={ad.url || ''} onChange={(e) => update(i, 'url', e.target.value)}
                placeholder="链接地址（可选）" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-brand-500/40"
              />
            </div>
            <button onClick={() => onChange(ads.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors mt-0.5">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onChange([...ads, { text: '', url: '' }])} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">
          <Plus className="w-3.5 h-3.5" />添加
        </button>
        <button onClick={onSave} disabled={saving} className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export default function AdsPage() {
  const { token, isLoggedIn, loading, login, logout, authHeaders } = useAdminAuth();
  const [sidebarAds, setSidebarAds] = useState<AdItem[]>([]);
  const [dialogAds, setDialogAds] = useState<AdItem[]>([]);
  const [savingSidebar, setSavingSidebar] = useState(false);
  const [savingDialog, setSavingDialog] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const [r1, r2] = await Promise.all([
      fetch('/api/admin/ads', { headers: h }),
      fetch('/api/admin/dialog-ads', { headers: h }),
    ]);
    if (r1.ok) setSidebarAds((await r1.json()).ads || []);
    if (r2.ok) setDialogAds((await r2.json()).ads || []);
  }, [token]);

  useEffect(() => { if (isLoggedIn) load(); }, [isLoggedIn, load]);

  const save = async (url: string, ads: AdItem[], setSaving: (v: boolean) => void) => {
    setSaving(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ads }) });
      setMsg(res.ok ? '保存成功' : '保存失败');
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('网络错误'); }
    finally { setSaving(false); }
  };

  if (!isLoggedIn) return <AdminLoginForm onLogin={login} loading={loading} />;

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav onLogout={logout} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-text-primary mb-6">广告管理</h1>
        {msg && <p className="text-sm text-brand-500 mb-4">{msg}</p>}
        <AdSection
          title="侧边栏广告" description="显示在搜索结果页右侧边栏，最多 5 条"
          ads={sidebarAds} onChange={setSidebarAds}
          onSave={() => save('/api/admin/ads', sidebarAds, setSavingSidebar)} saving={savingSidebar}
        />
        <AdSection
          title="弹窗广告" description="显示在资源获取弹窗底部，最多 3 条"
          ads={dialogAds} onChange={setDialogAds}
          onSave={() => save('/api/admin/dialog-ads', dialogAds, setSavingDialog)} saving={savingDialog}
        />
      </div>
    </div>
  );
}

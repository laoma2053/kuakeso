'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminNav, AdminLoginForm } from '@/components/admin-layout';

interface LinkItem { name: string; description: string; url: string; }

export default function LinksPage() {
  const { token, isLoggedIn, loading, login, logout, authHeaders } = useAdminAuth();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/admin/links', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setLinks((await res.json()).links || []);
  }, [token]);

  useEffect(() => { if (isLoggedIn) load(); }, [isLoggedIn, load]);

  const update = (i: number, field: keyof LinkItem, val: string) => {
    const next = [...links];
    next[i] = { ...next[i], [field]: val };
    setLinks(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/links', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ links }) });
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
        <h1 className="text-xl font-bold text-text-primary mb-6">友情链接</h1>
        {msg && <p className="text-sm text-brand-500 mb-4">{msg}</p>}
        <div className="card p-6">
          <p className="text-xs text-text-tertiary mb-4">配置后将显示在前端友情链接页面</p>
          <div className="space-y-4 mb-4">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <input type="text" value={link.name} onChange={(e) => update(i, 'name', e.target.value)}
                    placeholder="网站名称" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-brand-500/40" />
                  <input type="text" value={link.description} onChange={(e) => update(i, 'description', e.target.value)}
                    placeholder="网站描述" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-brand-500/40" />
                  <input type="text" value={link.url} onChange={(e) => update(i, 'url', e.target.value)}
                    placeholder="网站地址（https://...）" className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-brand-500/40" />
                </div>
                <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLinks([...links, { name: '', description: '', url: '' }])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">
              <Plus className="w-3.5 h-3.5" />添加
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminNav, AdminLoginForm } from '@/components/admin-layout';

interface Account {
  id: number;
  name: string;
  platform: string;
  isActive: boolean;
  lastUsedAt: string | null;
  _count: { resources: number };
}

const PLATFORM_LABELS: Record<string, string> = {
  quark: '夸克网盘',
  baidu: '百度网盘',
  xunlei: '迅雷网盘',
  uc: 'UC网盘',
};

export default function AccountsPage() {
  const { token, isLoggedIn, loading, login, logout, authHeaders } = useAdminAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('quark');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCookie, setNewCookie] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/admin/accounts', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts);
      const pts = [...new Set<string>(data.accounts.map((a: Account) => a.platform || 'quark'))];
      setPlatforms(pts.length ? pts : ['quark']);
    }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) fetchAccounts();
  }, [isLoggedIn, fetchAccounts]);

  const handleAdd = async () => {
    if (!newCookie.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newName, cookie: newCookie }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddForm(false);
        setNewName('');
        setNewCookie('');
        fetchAccounts();
      } else {
        alert(data.error || '添加失败');
      }
    } catch {
      alert('操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除账号「${name}」吗？`)) return;
    const res = await fetch(`/api/admin/accounts?id=${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) fetchAccounts();
    else alert('删除失败');
  };

  if (!isLoggedIn) return <AdminLoginForm onLogin={login} loading={loading} />;

  const filtered = accounts.filter((a) => (a.platform || 'quark') === activeTab);

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav onLogout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text-primary">账号管理</h1>
          <div className="flex gap-2">
            <button onClick={fetchAccounts} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />刷新
            </button>
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 transition-colors">
              <Plus className="w-3.5 h-3.5" />添加账号
            </button>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === p ? 'border-brand-500 text-brand-500' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {PLATFORM_LABELS[p] ?? p}
            </button>
          ))}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card p-4 mb-4">
            <h3 className="font-medium text-text-primary mb-3">添加 {PLATFORM_LABELS[activeTab] ?? activeTab} 账号</h3>
            <input
              type="text"
              placeholder="账号名称（可选）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm mb-2 focus:outline-none focus:border-brand-500/40"
            />
            <textarea
              placeholder="Cookie（必填）"
              value={newCookie}
              onChange={(e) => setNewCookie(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm mb-3 resize-none focus:outline-none focus:border-brand-500/40"
            />
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving} className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-sm disabled:opacity-50">
                {saving ? '验证中...' : '确认添加'}
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-1.5 rounded-lg border border-border text-sm text-text-secondary">
                取消
              </button>
            </div>
          </div>
        )}

        {/* Account List */}
        <div className="card p-4">
          {filtered.length === 0 ? (
            <p className="text-center text-text-secondary py-8">暂无账号</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{acc.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${acc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {acc.isActive ? '活跃' : '停用'}
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary mt-1 flex gap-3">
                      <span>转存 {acc._count.resources} 个</span>
                      {acc.lastUsedAt && <span>最近使用 {new Date(acc.lastUsedAt).toLocaleDateString('zh-CN')}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(acc.id, acc.name)} className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

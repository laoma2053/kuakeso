'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Database, Search, Plus, Trash2,
  RefreshCw, LogOut, Eye, EyeOff, Activity, Megaphone,
} from 'lucide-react';
import Link from 'next/link';

interface Account {
  id: number;
  name: string;
  platform: string;
  usedSpace: number;
  totalSpace: number;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  _count: { resources: number };
}

interface Stats {
  accountCount: number;
  activeAccountCount: number;
  resourceCount: number;
  todaySearchCount: number;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCookie, setNewCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {}
  }, [token]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/accounts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } catch {}
  }, [token]);

  const handleLogin = async () => {
    if (!token.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsLoggedIn(true);
        localStorage.setItem('admin_token', token);
      } else {
        alert('Token 无效');
      }
    } catch {
      alert('连接失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchAccounts();
    }
  }, [isLoggedIn, fetchStats, fetchAccounts]);

  const handleAddAccount = async () => {
    if (!newCookie.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: newName, cookie: newCookie }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddForm(false);
        setNewName('');
        setNewCookie('');
        fetchAccounts();
        fetchStats();
        alert('账号添加成功');
      } else {
        alert(data.error || '添加失败');
      }
    } catch {
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: number, name: string) => {
    if (!confirm(`确定删除账号「${name}」吗？`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts?id=${id}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (res.ok) {
        alert('删除成功');
        fetchAccounts();
        fetchStats();
      } else {
        const data = await res.json();
        alert('删除失败：' + (data.error || '未知错误'));
      }
    } catch (err) {
      alert('删除失败：网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setToken('');
    setStats(null);
    setAccounts([]);
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary dark:bg-bg-primary-dark px-4">
        <div className="card max-w-sm w-full p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">管理后台</h1>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mt-1">请输入管理员 Token</p>
          </div>
          <div className="relative mb-4">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin Token"
              className="w-full px-4 py-3 pr-10 rounded-xl border border-border dark:border-border-dark
                         bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark
                         focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showToken ? <EyeOff className="w-4 h-4 text-text-secondary" /> : <Eye className="w-4 h-4 text-text-secondary" />}
            </button>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? '验证中...' : '登录'}
          </button>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-bg-secondary dark:bg-bg-secondary-dark">
      {/* Top Bar */}
      <div className="bg-bg-primary dark:bg-bg-primary-dark border-b border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" />
              <span className="font-semibold text-text-primary dark:text-text-primary-dark">夸克点搜 · 管理后台</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-brand-500 hover:text-brand-600 transition-colors">
                账号管理
              </Link>
              <Link href="/admin/ads" className="text-sm text-text-secondary hover:text-brand-500 transition-colors flex items-center gap-1">
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Users className="w-5 h-5" />} label="网盘账号" value={stats.accountCount} sub={`${stats.activeAccountCount} 个活跃`} />
            <StatCard icon={<Database className="w-5 h-5" />} label="资源总数" value={stats.resourceCount} />
            <StatCard icon={<Search className="w-5 h-5" />} label="今日搜索" value={stats.todaySearchCount} />
            <StatCard icon={<Activity className="w-5 h-5" />} label="系统状态" value="运行中" color="green" />
          </div>
        )}

        {/* Accounts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">夸克网盘账号</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { fetchAccounts(); fetchStats(); }} className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                刷新
              </button>
              <button onClick={() => setShowAddForm(true)} className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                添加账号
              </button>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-bg-secondary dark:bg-bg-secondary-dark rounded-xl p-4 mb-4">
              <h3 className="font-medium text-text-primary dark:text-text-primary-dark mb-3">添加夸克账号</h3>
              <input
                type="text"
                placeholder="账号名称（可选）"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark text-sm mb-2"
              />
              <textarea
                placeholder="夸克网盘 Cookie（必填）"
                value={newCookie}
                onChange={(e) => setNewCookie(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-border-dark bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark text-sm mb-3 resize-none"
              />
              <div className="flex items-center gap-2">
                <button onClick={handleAddAccount} disabled={loading} className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50">
                  {loading ? '验证中...' : '确认添加'}
                </button>
                <button onClick={() => setShowAddForm(false)} className="btn-secondary px-4 py-1.5 text-sm">
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Accounts List */}
          {accounts.length === 0 ? (
            <p className="text-center text-text-secondary dark:text-text-secondary-dark py-8">暂无账号，请添加夸克网盘账号</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary dark:bg-bg-secondary-dark">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary dark:text-text-primary-dark">{acc.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${acc.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {acc.isActive ? '活跃' : '停用'}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1 flex items-center gap-3">
                      <span>转存: {acc._count.resources} 个</span>
                      {acc.lastUsedAt && <span>最近使用: {new Date(acc.lastUsedAt).toLocaleDateString('zh-CN')}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(acc.id, acc.name)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  >
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

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${color === 'green' ? 'text-green-500' : 'text-brand-500'}`}>{icon}</span>
        <span className="text-sm text-text-secondary dark:text-text-secondary-dark">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">{value}</div>
      {sub && <div className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">{sub}</div>}
    </div>
  );
}

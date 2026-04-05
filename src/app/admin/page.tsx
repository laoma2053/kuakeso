'use client';

import { useState, useEffect } from 'react';
import { Users, Database, Search, Activity } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminNav, AdminLoginForm } from '@/components/admin-layout';

interface Stats {
  accountCount: number;
  activeAccountCount: number;
  resourceCount: number;
  todaySearchCount: number;
}

export default function AdminPage() {
  const { token, isLoggedIn, loading, login, logout, authHeaders } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.stats) setStats(d.stats); })
      .catch(() => {});
  }, [isLoggedIn, token]);

  if (!isLoggedIn) return <AdminLoginForm onLogin={login} loading={loading} />;

  return (
    <div className="min-h-screen bg-surface">
      <AdminNav onLogout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-text-primary mb-6">仪表盘</h1>
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="网盘账号" value={stats.accountCount} sub={`${stats.activeAccountCount} 个活跃`} />
            <StatCard icon={<Database className="w-5 h-5" />} label="资源总数" value={stats.resourceCount} />
            <StatCard icon={<Search className="w-5 h-5" />} label="今日搜索" value={stats.todaySearchCount} />
            <StatCard icon={<Activity className="w-5 h-5" />} label="系统状态" value="运行中" color="green" />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={color === 'green' ? 'text-green-500' : 'text-brand-500'}>{icon}</span>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-secondary mt-1">{sub}</div>}
    </div>
  );
}

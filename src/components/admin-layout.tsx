'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, LayoutDashboard, Users, Megaphone, Link2, LogOut, Eye, EyeOff, Database, Search, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 共用顶部导航
export function AdminNav({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const navItems = [
    { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
    { href: '/admin/accounts', label: '账号管理', icon: Users },
    { href: '/admin/ads', label: '广告管理', icon: Megaphone },
    { href: '/admin/links', label: '友情链接', icon: Link2 },
  ];
  return (
    <div className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-text-primary">夸克点搜 · 管理后台</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? 'bg-brand-50 text-brand-500 font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1 text-sm text-text-secondary hover:text-red-500 transition-colors">
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </div>
    </div>
  );
}

// 登录表单
export function AdminLoginForm({ onLogin, loading }: { onLogin: (token: string) => void; loading: boolean }) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="card max-w-sm w-full p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">管理后台</h1>
          <p className="text-sm text-text-secondary mt-1">请输入管理员 Token</p>
        </div>
        <div className="relative mb-4">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin Token"
            className="w-full px-4 py-3 pr-10 rounded-xl border border-border bg-white text-text-primary focus:outline-none focus:border-brand-500/40 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && onLogin(token)}
          />
          <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showToken ? <EyeOff className="w-4 h-4 text-text-secondary" /> : <Eye className="w-4 h-4 text-text-secondary" />}
          </button>
        </div>
        <button onClick={() => onLogin(token)} disabled={loading} className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
          {loading ? '验证中...' : '登录'}
        </button>
      </div>
    </div>
  );
}

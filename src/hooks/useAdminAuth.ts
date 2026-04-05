'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const [token, setToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
    }
  }, []);

  const login = useCallback(async (inputToken: string) => {
    if (!inputToken.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${inputToken}` },
      });
      if (res.ok) {
        setToken(inputToken);
        setIsLoggedIn(true);
        localStorage.setItem('admin_token', inputToken);
      } else {
        alert('Token 无效');
      }
    } catch {
      alert('连接失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setToken('');
    setIsLoggedIn(false);
    router.push('/admin');
  }, [router]);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  return { token, isLoggedIn, loading, login, logout, authHeaders };
}

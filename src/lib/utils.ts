import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return d.toLocaleDateString('zh-CN');
}

export function generateSlug(title: string): string {
  // 生成短ID+中文拼音首字母的slug
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 从夸克网盘分享链接中提取 pwd_id 和 passcode
 * 支持格式:
 *   https://pan.quark.cn/s/{pwd_id}
 *   https://pan.quark.cn/s/{pwd_id}?pwd={password}
 *   https://pan.quark.cn/s/{pwd_id}#/list/share
 *   https://pan.qoark.cn/s/{short_code} (短链，需重定向)
 */
export function extractPwdId(url: string): { pwdId: string; passcode: string } | null {
  try {
    const parsed = new URL(url);
    const supportedHosts = ['pan.quark.cn', 'pan.qoark.cn'];
    if (!supportedHosts.includes(parsed.host)) return null;
    if (!parsed.pathname.startsWith('/s/')) return null;

    const pathPart = parsed.pathname.replace('/s/', '').split('/')[0];
    const pwdId = pathPart?.trim();
    if (!pwdId) return null;

    const passcode = parsed.searchParams.get('pwd')?.trim() || '';
    return { pwdId, passcode };
  } catch {
    // Fallback: 简单正则
    const match = url.match(/\/s\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const pwdId = match[1];
    const pwdMatch = url.match(/[?&]pwd=([a-zA-Z0-9]+)/);
    const passcode = pwdMatch ? pwdMatch[1] : '';
    return { pwdId, passcode };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(ms);
}

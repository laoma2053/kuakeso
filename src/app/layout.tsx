import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '夸克搜 - 夸克网盘资源搜索引擎',
    template: '%s | 网盘搜',
  },
  description: '专业的夸克网盘资源搜索引擎，搜索全网资源，一键获取夸克网盘分享链接。',
  keywords: ['网盘搜索', '夸克网盘', '资源搜索', '网盘资源'],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

/**
 * 简单的管理后台鉴权中间件
 */
export function verifyAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === ADMIN_TOKEN;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: '未授权访问' },
    { status: 401 }
  );
}

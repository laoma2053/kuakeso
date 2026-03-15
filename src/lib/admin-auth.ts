import { NextRequest, NextResponse } from 'next/server';

/**
 * 简单的管理后台鉴权中间件
 */
export function verifyAdmin(req: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN || 'changeme';
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === adminToken;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: '未授权访问' },
    { status: 401 }
  );
}

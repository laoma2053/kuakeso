import { NextRequest, NextResponse } from 'next/server';
import { generateCaptcha, verifyCaptcha } from '@/lib/captcha';

/**
 * GET /api/captcha - 生成验证码
 */
export async function GET() {
  try {
    const captcha = await generateCaptcha();
    return NextResponse.json(captcha);
  } catch (error) {
    console.error('[API/captcha] Generate error:', error);
    return NextResponse.json(
      { error: '验证码生成失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/captcha - 验证验证码
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, answer } = body;

    if (!id || answer === undefined || answer === null) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
        { status: 400 }
      );
    }

    const success = await verifyCaptcha(id, String(answer));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[API/captcha] Verify error:', error);
    return NextResponse.json(
      { success: false, error: '验证失败' },
      { status: 500 }
    );
  }
}

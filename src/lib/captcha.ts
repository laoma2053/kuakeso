/**
 * 简易验证码服务
 * 生成数学运算验证码，服务端验证
 */

import { redis } from '@/lib/redis';

const CAPTCHA_PREFIX = 'captcha:';
const CAPTCHA_TTL = 300; // 5分钟有效

interface CaptchaData {
  id: string;
  question: string;
  answer: number;
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成数学验证码
 */
export async function generateCaptcha(): Promise<{ id: string; question: string }> {
  const operators = ['+', '-', '×'];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
    default:
      a = 1;
      b = 1;
      answer = 2;
  }

  const id = generateId();
  const question = `${a} ${op} ${b} = ?`;

  // 存入Redis
  await redis.setex(`${CAPTCHA_PREFIX}${id}`, CAPTCHA_TTL, String(answer));

  return { id, question };
}

/**
 * 验证验证码
 */
export async function verifyCaptcha(id: string, userAnswer: string): Promise<boolean> {
  const key = `${CAPTCHA_PREFIX}${id}`;
  const correctAnswer = await redis.get(key);

  if (!correctAnswer) {
    return false; // 已过期或不存在
  }

  // 验证后立即删除（一次性使用）
  await redis.del(key);

  return String(correctAnswer) === String(userAnswer).trim();
}

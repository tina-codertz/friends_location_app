import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

type JwtPayload = {
  userId: number;
  username?: string;
  email?: string;
  iat: number;
  exp: number;
};

export async function jwtAuth(c: Context, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  const token = header.slice(7);
  try {
    const payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as JwtPayload;
    if (!payload?.userId) {
      return c.json({ success: false, message: 'Invalid token' }, 401);
    }
    c.set('userId', Number(payload.userId));
    await next();
  } catch {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
}

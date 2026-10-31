import type { NextFunction, Request, Response } from 'express';

/**
 * Giới hạn số request mỗi IP (chống spam / DoS đơn giản), không cần thư viện ngoài.
 * Mặc định: 300 request / 1 phút / IP. Vượt quá -> 429 Too Many Requests.
 * (Đăng nhập sai 5 lần đã có cơ chế khoá riêng trong AuthService.)
 */
export function rateLimit(options: { windowMs?: number; max?: number } = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 300;
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Dọn bộ nhớ định kỳ
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ statusCode: 429, message: 'Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút' });
    }
    return next();
  };
}

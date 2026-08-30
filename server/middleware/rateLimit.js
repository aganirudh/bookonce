export function createRateLimiter({ limit = 60, windowMs = 60_000 } = {}) {
  const clients = new Map();

  const middleware = (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = clients.get(key);
    if (!current || now >= current.resetAt) {
      clients.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= limit) {
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }
    current.count += 1;
    return next();
  };

  middleware.reset = () => clients.clear();
  return middleware;
}

const loginAttempts = new Map();

function configuredOrigins() {
  return (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export function corsOptions() {
  const allowed = configuredOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
  };
}

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}

export function authRateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 20;
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const attempts = (loginAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (attempts.length >= maxAttempts) {
    res.setHeader('Retry-After', '900');
    return res.status(429).json({
      error: 'Too many authentication attempts. Try again in 15 minutes.',
    });
  }

  attempts.push(now);
  loginAttempts.set(key, attempts);
  next();
}
